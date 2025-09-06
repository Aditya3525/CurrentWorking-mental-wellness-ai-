import { BaseAIProvider } from './BaseAIProvider';
import { AIMessage, AIResponse, AIConfig, ConversationContext, AIProviderConfig } from '../../types/ai';

export class HuggingFaceProvider extends BaseAIProvider {
  private apiKey: string;
  private baseUrl: string = 'https://api-inference.huggingface.co/models';
  private model: string = 'Guilherme34/Psychologist-3b';

  constructor(config: AIProviderConfig) {
    super('huggingface', config);
    this.apiKey = config.apiKey || '';
    
    if (!this.apiKey) {
      throw new Error('HuggingFace API key is required');
    }
  }

  async generateResponse(
    messages: AIMessage[], 
    config?: AIConfig, 
    context?: ConversationContext
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🤗 HuggingFace: Generating response with ${this.model}`);
      
      // Format the conversation for the psychology model
      const prompt = this.formatPromptForPsychologist(messages, context);
      
      const apiKey = this.getCurrentApiKey();
      if (!apiKey) {
        throw new Error('No HuggingFace API key available');
      }

      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: config?.maxTokens || 256,
            temperature: config?.temperature || 0.7,
            top_p: 0.95,
            do_sample: true,
            return_full_text: false,
            repetition_penalty: 1.1
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HuggingFace API Error:', errorText);
        
        if (response.status === 503) {
          throw new Error('Model is loading, please try again in a few moments');
        }
        throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      console.log('🤗 HuggingFace raw response:', data);

      // Handle different response formats
      let content = '';
      if (Array.isArray(data) && data.length > 0) {
        content = data[0].generated_text || '';
      } else if (data.generated_text) {
        content = data.generated_text;
      } else {
        throw new Error('Unexpected response format from HuggingFace');
      }

      // Clean up the response
      content = this.cleanPsychologistResponse(content);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      console.log(`✅ HuggingFace: Response generated in ${processingTime}ms`);

      return {
        content: content.trim(),
        provider: 'huggingface',
        model: this.model,
        usage: {
          prompt_tokens: Math.ceil(prompt.length / 4), // Rough estimate
          completion_tokens: Math.ceil(content.length / 4),
          total_tokens: Math.ceil((prompt.length + content.length) / 4)
        },
        processingTime,
        finish_reason: 'stop',
        success: true,
        apiKeyUsed: this.currentApiKeyIndex
      };

    } catch (error: any) {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      console.error('❌ HuggingFace Error:', error);
      
      // Rotate API key on certain errors
      if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
        this.rotateApiKey();
      }

      return {
        content: '',
        provider: 'huggingface',
        model: this.model,
        processingTime,
        success: false,
        error: error.message || 'Unknown error occurred',
        apiKeyUsed: this.currentApiKeyIndex
      };
    }
  }

  private formatPromptForPsychologist(messages: AIMessage[], context?: ConversationContext): string {
    // Format the prompt specifically for the Psychologist-3b model
    const systemPrompt = `You are a compassionate and professional mental health counselor. Your role is to:
- Listen actively and provide empathetic responses
- Offer therapeutic insights and coping strategies
- Ask thoughtful follow-up questions
- Maintain professional boundaries
- Encourage professional help when needed
- Be supportive and non-judgmental

Remember: You are an AI assistant providing emotional support, not a replacement for professional therapy.`;

    // Build conversation context
    let conversationContext = '';
    if (messages && messages.length > 0) {
      conversationContext = messages.map((msg: AIMessage) => 
        `${msg.role === 'user' ? 'Client' : 'Counselor'}: ${msg.content}`
      ).join('\n');
    }

    // Get the latest user message
    const latestMessage = messages[messages.length - 1];
    const userMessage = latestMessage?.role === 'user' ? latestMessage.content : '';

    // Format the complete prompt
    const prompt = `${systemPrompt}

Previous conversation:
${conversationContext}

Client: ${userMessage}
Counselor:`;

    return prompt;
  }

  private cleanPsychologistResponse(response: string): string {
    // Clean up the response from the psychology model
    let cleaned = response
      .replace(/^(Counselor:|Client:|Human:|Assistant:)/gi, '') // Remove role prefixes
      .replace(/\n\s*\n/g, '\n') // Remove excessive newlines
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\[.*?\]/g, '') // Remove any bracketed instructions
      .replace(/\*.*?\*/g, ''); // Remove asterisk annotations

    // Ensure response is appropriate length
    if (cleaned.length > 500) {
      cleaned = cleaned.substring(0, 500) + '...';
    }

    return cleaned;
  }

  async testConnection(): Promise<boolean> {
    try {
      const apiKey = this.getCurrentApiKey();
      if (!apiKey) return false;

      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: 'Hello',
          parameters: { max_new_tokens: 10 }
        }),
      });
      
      return response.ok || response.status === 503; // 503 means model is loading but available
    } catch (error) {
      console.error('❌ HuggingFace connection test failed:', error);
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.getCurrentApiKey());
  }

  getProviderName(): string {
    return 'huggingface';
  }

  getModelName(): string {
    return this.model;
  }
}
