import axios from 'axios';
import { BaseAIProvider } from './BaseAIProvider';
import { AIMessage, AIResponse, AIConfig, ConversationContext, AIProviderConfig } from '../../types/ai';

export class OllamaProvider extends BaseAIProvider {
  public name = 'Ollama';
  private baseURL: string;
  private model: string;
  private isModelAvailable: boolean = false;

  constructor(config: AIProviderConfig) {
    super('Ollama', config);
    this.baseURL = config.baseURL || 'http://localhost:11434';
    this.model = config.model || 'llama3';
  }

  async isAvailable(): Promise<boolean> {
    return await this.testConnection();
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log(`[${this.name}] Testing connection to ${this.baseURL}...`);
      
      // Check if Ollama is running
      const response = await Promise.race([
        axios.get(`${this.baseURL}/api/tags`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]) as any;
      
      // Check if our model is available
      const models = response.data?.models || [];
      this.isModelAvailable = models.some((m: any) => 
        m.name.includes(this.model.split(':')[0]) // Handle versioned models like llama3:latest
      );
      
      if (!this.isModelAvailable) {
        console.warn(`[${this.name}] Model ${this.model} not found. Available models:`, 
          models.map((m: any) => m.name));
        
        // Try to pull the model automatically
        console.log(`[${this.name}] Attempting to pull model: ${this.model}`);
        await this.pullModel();
      }
      
      console.log(`[${this.name}] Connection successful, model ${this.model} available`);
      return true;
    } catch (error: any) {
      console.warn(`[${this.name}] Connection test failed:`, error.message);
      return false;
    }
  }

  private async pullModel(): Promise<void> {
    try {
      console.log(`[${this.name}] Pulling model: ${this.model}...`);
      
      // Start model pull (this is async in Ollama)
      const response = await fetch(`${this.baseURL}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.model })
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`);
      }

      // Read the streaming response to monitor progress
      const reader = response.body?.getReader();
      if (reader) {
        let progress = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.status && data.status !== progress) {
                progress = data.status;
                console.log(`[${this.name}] Pull progress: ${progress}`);
              }
              if (data.status === 'success') {
                this.isModelAvailable = true;
                console.log(`[${this.name}] Model ${this.model} pulled successfully`);
                return;
              }
            } catch (e) {
              // Ignore JSON parse errors for partial chunks
            }
          }
        }
      }
    } catch (error: any) {
      console.error(`[${this.name}] Failed to pull model ${this.model}:`, error.message);
      throw error;
    }
  }

  async generateResponse(
    messages: AIMessage[], 
    config?: AIConfig,
    context?: ConversationContext
  ): Promise<AIResponse> {
    if (!this.isModelAvailable && !await this.testConnection()) {
      throw new Error(`[${this.name}] Model ${this.model} not available`);
    }

    const preparedMessages = this.prepareMessages(messages, context);
    const startTime = Date.now();

    try {
      console.log(`[${this.name}] Generating response with ${preparedMessages.length} messages...`);
      
      // Convert messages to Ollama chat format
      const prompt = this.convertMessagesToPrompt(preparedMessages);

      const response = await Promise.race([
        axios.post(`${this.baseURL}/api/generate`, {
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: config?.temperature || this.config.temperature || 0.7,
            num_predict: config?.maxTokens || this.config.maxTokens || 150,
            top_p: 0.9,
            top_k: 40
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 
          config?.timeout || this.config.timeout || 60000) // Longer timeout for local processing
        )
      ]);

      const processingTime = Date.now() - startTime;

      const aiResponse: AIResponse = {
        content: response.data.response || '',
        usage: {
          prompt_tokens: response.data.prompt_eval_count || 0,
          completion_tokens: response.data.eval_count || 0,
          total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
        },
        model: response.data.model || this.model,
        provider: this.name,
        finish_reason: response.data.done ? 'stop' : 'length',
        success: true,
        processingTime,
        apiKeyUsed: 0 // Local model doesn't use API keys
      };

      console.log(`[${this.name}] Successfully generated response in ${processingTime}ms`);
      return aiResponse;

    } catch (error: any) {
      console.error(`[${this.name}] Error generating response:`, error);
      
      if (error.code === 'ECONNREFUSED') {
        const connectionError = new Error('Ollama server not running. Please start Ollama first.');
        (connectionError as any).statusCode = 503;
        throw connectionError;
      }

      // Re-throw with additional context
      const enhancedError = new Error(`Ollama error: ${error.message}`);
      (enhancedError as any).statusCode = error.response?.status || 500;
      throw enhancedError;
    }
  }

  /**
   * Convert messages to a single prompt for Ollama
   */
  private convertMessagesToPrompt(messages: AIMessage[]): string {
    let prompt = '';
    
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          prompt += `System: ${message.content}\n\n`;
          break;
        case 'user':
          prompt += `Human: ${message.content}\n\n`;
          break;
        case 'assistant':
          prompt += `Assistant: ${message.content}\n\n`;
          break;
      }
    }
    
    prompt += 'Assistant:';
    return prompt;
  }
}
