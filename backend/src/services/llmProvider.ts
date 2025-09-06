import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { HuggingFaceProvider } from './providers/HuggingFaceProvider';
import { AIProvider, AIMessage, AIResponse, AIConfig, ConversationContext, AIProviderConfig, AIProviderType } from '../types/ai';

export class LLMService {
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private providerPriority: AIProviderType[] = [];
  private lastWorkingProvider: AIProviderType | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Load configuration from environment
    const configs = this.loadProviderConfigs();
    
    // Initialize providers based on available API keys
    for (const [type, config] of Object.entries(configs)) {
      try {
        let provider: AIProvider | null = null;

        switch (type as AIProviderType) {
          case 'openai':
            if (config.apiKeys && config.apiKeys.length > 0) {
              provider = new OpenAIProvider(config);
            }
            break;
          case 'anthropic':
            if (config.apiKeys && config.apiKeys.length > 0) {
              provider = new AnthropicProvider(config);
            }
            break;
          case 'gemini':
            if (config.apiKeys && config.apiKeys.length > 0) {
              provider = new GeminiProvider(config);
            }
            break;
          case 'huggingface':
            if (config.apiKeys && config.apiKeys.length > 0) {
              provider = new HuggingFaceProvider(config);
            }
            break;
          case 'ollama':
            provider = new OllamaProvider(config);
            break;
        }

        if (provider) {
          this.providers.set(type as AIProviderType, provider);
          console.log(`[LLMService] Initialized ${provider.name} provider`);
        }
      } catch (error) {
        console.warn(`[LLMService] Failed to initialize ${type} provider:`, error);
      }
    }

    // Set provider priority from environment or use default
    this.providerPriority = this.getProviderPriority();
    console.log(`[LLMService] Provider priority: ${this.providerPriority.join(' → ')}`);
  }

  private loadProviderConfigs(): Record<string, AIProviderConfig> {
    const configs: Record<string, AIProviderConfig> = {};

    // OpenAI Configuration
    const openaiKeys = [
      process.env.OPENAI_API_KEY_1,
      process.env.OPENAI_API_KEY_2,
      process.env.OPENAI_API_KEY_3
    ].filter(Boolean) as string[];

    if (openaiKeys.length > 0) {
      configs.openai = {
        apiKeys: openaiKeys,
        model: 'gpt-3.5-turbo',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '150'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
        priority: 1
      };
    }

    // Anthropic Configuration
    const anthropicKeys = [
      process.env.ANTHROPIC_API_KEY_1,
      process.env.ANTHROPIC_API_KEY_2
    ].filter(Boolean) as string[];

    if (anthropicKeys.length > 0) {
      configs.anthropic = {
        apiKeys: anthropicKeys,
        model: 'claude-3-sonnet-20240229',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '150'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
        priority: 2
      };
    }

    // Gemini Configuration
    const geminiKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ].filter(Boolean) as string[];

    if (geminiKeys.length > 0) {
      configs.gemini = {
        apiKeys: geminiKeys,
        model: 'gemini-2.0-flash-exp',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '150'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
        priority: 1 // High priority since Gemini 2.0 Flash is very fast
      };
    }

    // HuggingFace Configuration
    const huggingfaceKeys = [
      process.env.HUGGINGFACE_API_KEY_1,
      process.env.HUGGINGFACE_API_KEY_2,
      process.env.HUGGINGFACE_API_KEY
    ].filter(Boolean) as string[];

    if (huggingfaceKeys.length > 0) {
      configs.huggingface = {
        apiKeys: huggingfaceKeys,
        model: 'Guilherme34/Psychologist-3b',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '256'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
        priority: 1 // High priority for psychology-specific model
      };
    }

    // Ollama Configuration (always available as fallback)
    configs.ollama = {
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '150'),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.AI_TIMEOUT || '60000'),
      priority: 3
    };

    return configs;
  }

  private getProviderPriority(): AIProviderType[] {
    const priorityString = process.env.AI_PROVIDER_PRIORITY || 'openai,anthropic,ollama';
    const priority = priorityString.split(',').map(p => p.trim() as AIProviderType);
    
    // Filter to only include providers that are actually initialized
    return priority.filter(type => this.providers.has(type));
  }

  /**
   * Generate AI response using the best available provider
   */
  async generateResponse(
    messages: AIMessage[],
    config?: AIConfig,
    context?: ConversationContext
  ): Promise<AIResponse> {
    if (this.providers.size === 0) {
      throw new Error('No AI providers available. Please configure at least one API key or run Ollama locally.');
    }

    // Try providers in priority order, starting with last working provider if available
    const providersToTry = this.getProvidersToTry();

    let lastError: Error | null = null;

    for (const providerType of providersToTry) {
      const provider = this.providers.get(providerType);
      if (!provider) continue;

      try {
        console.log(`[LLMService] Trying ${provider.name} provider...`);
        
        // Check if provider is available
        if (!(await provider.isAvailable())) {
          console.warn(`[LLMService] ${provider.name} is not available, trying next provider...`);
          continue;
        }

        const startTime = Date.now();
        const response = await provider.generateResponse(messages, config, context);
        const totalTime = Date.now() - startTime;

        // Mark this provider as working
        this.lastWorkingProvider = providerType;

        console.log(`[LLMService] ✅ ${provider.name} responded successfully in ${totalTime}ms`);
        
        return {
          ...response,
          provider: provider.name,
          processingTime: totalTime
        };

      } catch (error: any) {
        lastError = error;
        console.warn(`[LLMService] ❌ ${provider.name} failed:`, error.message);
        
        // If it's an authentication error, don't retry this provider
        if (error.statusCode === 401) {
          console.error(`[LLMService] Authentication failed for ${provider.name}, skipping...`);
          continue;
        }
        
        // For rate limits, try next provider immediately
        if (error.statusCode === 429 || error.statusCode === 402) {
          console.warn(`[LLMService] Rate limit/quota exceeded for ${provider.name}, trying next provider...`);
          continue;
        }
      }
    }

    // All providers failed
    const availableProviders = Array.from(this.providers.keys()).join(', ');
    throw new Error(
      `All AI providers failed. Last error: ${lastError?.message || 'Unknown'}. ` +
      `Available providers: ${availableProviders}. ` +
      `Please check your API keys or ensure Ollama is running locally.`
    );
  }

  /**
   * Get list of providers to try, prioritizing last working provider
   */
  private getProvidersToTry(): AIProviderType[] {
    const providers = [...this.providerPriority];
    
    // If we have a last working provider, put it first
    if (this.lastWorkingProvider && providers.includes(this.lastWorkingProvider)) {
      const filtered = providers.filter(p => p !== this.lastWorkingProvider);
      return [this.lastWorkingProvider, ...filtered];
    }
    
    return providers;
  }

  /**
   * Get status of all providers
   */
  async getProviderStatus(): Promise<Record<string, { available: boolean; name: string }>> {
    const status: Record<string, { available: boolean; name: string }> = {};
    
    for (const [type, provider] of this.providers) {
      try {
        const available = await provider.isAvailable();
        status[type] = { available, name: provider.name };
      } catch (error) {
        status[type] = { available: false, name: provider.name };
      }
    }
    
    return status;
  }

  /**
   * Test all providers and return results
   */
  async testAllProviders(): Promise<Record<string, { success: boolean; error?: string; responseTime?: number }>> {
    const results: Record<string, { success: boolean; error?: string; responseTime?: number }> = {};
    
    for (const [type, provider] of this.providers) {
      try {
        const startTime = Date.now();
        await provider.testConnection();
        const responseTime = Date.now() - startTime;
        
        results[type] = { success: true, responseTime };
      } catch (error: any) {
        results[type] = { success: false, error: error.message };
      }
    }
    
    return results;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Export singleton instance
export const llmService = new LLMService();