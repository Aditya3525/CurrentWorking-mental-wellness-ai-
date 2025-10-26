import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { HuggingFaceProvider } from './providers/HuggingFaceProvider';
import { AIProvider, AIMessage, AIResponse, AIConfig, ConversationContext, AIProviderConfig, AIProviderType } from '../types/ai';
import { logger } from '../utils/logger';

type ProviderState = {
  failureCount: number;
  cooldownUntil: number | null;
  lastError?: string;
};

const serviceLogger = logger.child({ module: 'LLMService' });

export class LLMService {
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private providerPriority: AIProviderType[] = [];
  private lastWorkingProvider: AIProviderType | null = null;
  private fallbackEnabled = true;
  private providerState: Map<AIProviderType, ProviderState> = new Map();
  private maxFailuresBeforeCooldown = 3;
  private providerCooldownMs = 300000;
  private usageLoggingEnabled = true;

  constructor() {
    this.usageLoggingEnabled = (process.env.AI_USAGE_LOGGING ?? 'true').toLowerCase() !== 'false';
    this.maxFailuresBeforeCooldown = Math.max(
      1,
      Math.floor(this.parseNumber(process.env.AI_PROVIDER_MAX_FAILURES_BEFORE_COOLDOWN, 3))
    );
    this.providerCooldownMs = Math.max(
      1000,
      this.parseNumber(process.env.AI_PROVIDER_COOLDOWN_MS, 300000)
    );
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
          this.providerState.set(type as AIProviderType, {
            failureCount: 0,
            cooldownUntil: null
          });
          serviceLogger.info({ provider: provider.name, providerType: type }, 'Initialized AI provider');
        }
      } catch (error) {
        serviceLogger.warn({ providerType: type, err: error }, 'Failed to initialize AI provider');
      }
    }

    // Set provider priority from environment or use default
    this.providerPriority = this.getProviderPriority();
    serviceLogger.info(
      { providerPriority: this.providerPriority },
      'Provider priority configured'
    );

    this.fallbackEnabled = this.getFallbackFlag();
    serviceLogger.info(
      { fallbackEnabled: this.fallbackEnabled, maxFailuresBeforeCooldown: this.maxFailuresBeforeCooldown, cooldownMs: this.providerCooldownMs },
      'LLM fallback configuration applied'
    );
  }

  private loadProviderConfigs(): Record<string, AIProviderConfig> {
    const configs: Record<string, AIProviderConfig> = {};

    const defaultMaxTokens = this.parseNumber(process.env.AI_MAX_TOKENS, 600);
    const defaultTemperature = this.parseNumber(process.env.AI_TEMPERATURE, 0.6);
    const defaultTimeout = this.parseNumber(process.env.AI_TIMEOUT, 30000);

    const sanitizeKeys = (keys: Array<string | undefined>): string[] => {
      const PLACEHOLDER_REGEX = /(your[_-]|placeholder|example|changeme)/i;
      return keys
        .map((key) => key?.trim())
        .filter((key): key is string => {
          if (!key) return false;
          return !PLACEHOLDER_REGEX.test(key);
        });
    };

    // OpenAI Configuration
    const openaiKeys = sanitizeKeys([
      process.env.OPENAI_API_KEY_1,
      process.env.OPENAI_API_KEY_2,
      process.env.OPENAI_API_KEY_3
    ]);

    if (openaiKeys.length > 0) {
      const openaiModel = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
      configs.openai = {
        apiKeys: openaiKeys,
        model: openaiModel,
        maxTokens: this.parseNumber(process.env.OPENAI_MAX_TOKENS, defaultMaxTokens),
        temperature: this.parseNumber(process.env.OPENAI_TEMPERATURE, defaultTemperature),
        timeout: this.parseNumber(process.env.OPENAI_TIMEOUT, defaultTimeout),
        priority: 1
      };
    }

    // Anthropic Configuration
    const anthropicKeys = sanitizeKeys([
      process.env.ANTHROPIC_API_KEY_1,
      process.env.ANTHROPIC_API_KEY_2
    ]);

    if (anthropicKeys.length > 0) {
      const anthropicModel = process.env.ANTHROPIC_MODEL?.trim() || 'claude-3-5-sonnet-20240620';
      configs.anthropic = {
        apiKeys: anthropicKeys,
        model: anthropicModel,
        maxTokens: this.parseNumber(process.env.ANTHROPIC_MAX_TOKENS, defaultMaxTokens),
        temperature: this.parseNumber(process.env.ANTHROPIC_TEMPERATURE, defaultTemperature),
        timeout: this.parseNumber(process.env.ANTHROPIC_TIMEOUT, defaultTimeout),
        priority: 2
      };
    }

    // Gemini Configuration
    const geminiKeys = sanitizeKeys([
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ]);

    if (geminiKeys.length > 0) {
      const geminiModel = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash-thinking-exp';
      configs.gemini = {
        apiKeys: geminiKeys,
        model: geminiModel,
        maxTokens: this.parseNumber(process.env.GEMINI_MAX_TOKENS, defaultMaxTokens),
        temperature: this.parseNumber(process.env.GEMINI_TEMPERATURE, defaultTemperature),
        timeout: this.parseNumber(process.env.GEMINI_TIMEOUT, defaultTimeout),
        priority: 1 // High priority since Gemini 2.0 Flash is very fast
      };
    }

    // HuggingFace Configuration
    const huggingfaceKeys = sanitizeKeys([
      process.env.HUGGINGFACE_API_KEY_1,
      process.env.HUGGINGFACE_API_KEY_2,
      process.env.HUGGINGFACE_API_KEY
    ]);

    if (huggingfaceKeys.length > 0) {
      const huggingfaceModel = process.env.HUGGINGFACE_MODEL?.trim() || 'Guilherme34/Psychologist-3b';
      configs.huggingface = {
        apiKeys: huggingfaceKeys,
        model: huggingfaceModel,
        maxTokens: this.parseNumber(process.env.HUGGINGFACE_MAX_TOKENS, defaultMaxTokens),
        temperature: this.parseNumber(process.env.HUGGINGFACE_TEMPERATURE, defaultTemperature),
        timeout: this.parseNumber(process.env.HUGGINGFACE_TIMEOUT, defaultTimeout),
        priority: 1 // High priority for psychology-specific model
      };
    }

    // Ollama Configuration (opt-in only to avoid local resource usage)
    const ollamaEnabled = (process.env.OLLAMA_ENABLED ?? 'false').trim().toLowerCase() === 'true';
    if (ollamaEnabled) {
      const ollamaModel = process.env.OLLAMA_MODEL || 'llama3';
      configs.ollama = {
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: ollamaModel,
        maxTokens: this.parseNumber(process.env.OLLAMA_MAX_TOKENS, defaultMaxTokens),
        temperature: this.parseNumber(process.env.OLLAMA_TEMPERATURE, defaultTemperature),
        timeout: this.parseNumber(process.env.OLLAMA_TIMEOUT, this.parseNumber(process.env.AI_TIMEOUT, 60000)),
        priority: 3
      };
    }

    return configs;
  }

  private getOrCreateProviderState(providerType: AIProviderType): ProviderState {
    const state = this.providerState.get(providerType);
    if (state) return state;
    const initial: ProviderState = { failureCount: 0, cooldownUntil: null };
    this.providerState.set(providerType, initial);
    return initial;
  }

  private clearCooldownIfExpired(providerType: AIProviderType, referenceTime = Date.now()): void {
    const state = this.providerState.get(providerType);
    if (!state?.cooldownUntil) return;
    if (referenceTime >= state.cooldownUntil) {
      this.providerState.set(providerType, { failureCount: 0, cooldownUntil: null });
      serviceLogger.debug({ providerType }, 'Provider cooldown cleared');
    }
  }

  private isProviderCoolingDown(providerType: AIProviderType, referenceTime = Date.now()): boolean {
    const state = this.providerState.get(providerType);
    if (!state?.cooldownUntil) return false;
    return referenceTime < state.cooldownUntil;
  }

  private markProviderSuccess(providerType: AIProviderType): void {
    if (!this.providerState.has(providerType)) return;
    this.providerState.set(providerType, { failureCount: 0, cooldownUntil: null });
  }

  private recordProviderFailure(providerType: AIProviderType, error?: any): void {
    const state = this.getOrCreateProviderState(providerType);
    const failureCount = state.failureCount + 1;
    let cooldownUntil = state.cooldownUntil ?? null;

    if (failureCount >= this.maxFailuresBeforeCooldown) {
      cooldownUntil = Date.now() + this.providerCooldownMs;
      serviceLogger.warn({ providerType, failureCount, cooldownUntil }, 'Provider entered cooldown window');
    }

    this.providerState.set(providerType, {
      failureCount,
      cooldownUntil,
      lastError: error?.message ?? state.lastError
    });
  }

  private parseNumber(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private getProviderPriority(): AIProviderType[] {
    // Default excludes 'ollama' so it is only used if explicitly configured and enabled
    const priorityString = process.env.AI_PROVIDER_PRIORITY || 'gemini,huggingface,openai,anthropic';
    const priority = priorityString.split(',').map(p => p.trim() as AIProviderType);
    
    // Filter to only include providers that are actually initialized
    const filtered = priority.filter(type => this.providers.has(type));

    // Ensure Ollama is always last if present
    const ollamaIndex = filtered.indexOf(AIProviderType.OLLAMA);
    if (ollamaIndex >= 0 && ollamaIndex !== filtered.length - 1) {
      filtered.splice(ollamaIndex, 1);
      filtered.push(AIProviderType.OLLAMA);
    }

    return filtered;
  }

  private getFallbackFlag(): boolean {
    const flag = process.env.AI_ENABLE_FALLBACK;
    if (typeof flag !== 'string') return true;
    const normalized = flag.trim().toLowerCase();
    return !(normalized === 'false' || normalized === '0' || normalized === 'off');
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
    if (providersToTry.length === 0) {
      const coolingProviders = Array.from(this.providerState.entries())
        .filter(([type]) => this.isProviderCoolingDown(type))
        .map(([type, state]) => `${type} (retry at ${state.cooldownUntil ? new Date(state.cooldownUntil).toISOString() : 'unknown'})`);

      throw new Error(
        coolingProviders.length > 0
          ? `All AI providers are cooling down. Next retry windows: ${coolingProviders.join(', ')}`
          : 'No AI providers are eligible to run. Check configuration and cooldown settings.'
      );
    }

    let lastError: Error | null = null;

    for (const providerType of providersToTry) {
      const provider = this.providers.get(providerType);
      if (!provider) continue;
      if (this.isProviderCoolingDown(providerType)) {
        serviceLogger.warn({ providerType }, 'Provider still cooling down when attempting to invoke');
        continue;
      }

      try {
        serviceLogger.info({ provider: provider.name, providerType }, 'Attempting AI provider response');
        
        // Check if provider is available
        if (!(await provider.isAvailable())) {
          const availabilityError = new Error(`${provider.name} is not available`);
          this.recordProviderFailure(providerType, availabilityError);
          serviceLogger.warn({ provider: provider.name, providerType }, 'Provider reported unavailable, trying next');
          continue;
        }

        const startTime = Date.now();
        const response = await provider.generateResponse(messages, config, context);
        const totalTime = Date.now() - startTime;

        // Mark this provider as working
        this.lastWorkingProvider = providerType;
        this.markProviderSuccess(providerType);

        serviceLogger.info({ provider: provider.name, providerType, durationMs: totalTime }, 'Provider responded successfully');

        this.recordUsageMetrics(providerType, {
          provider: provider.name,
          processingTime: totalTime,
          tokens: response.usage?.total_tokens,
          model: response.model
        });
        
        return {
          ...response,
          provider: provider.name,
          processingTime: totalTime
        };

      } catch (error: any) {
        lastError = error;
        this.recordProviderFailure(providerType, error);
        serviceLogger.warn({ provider: provider.name, providerType, err: error }, 'Provider failed to generate response');
        
        // If it's an authentication error, don't retry this provider
        if (error.statusCode === 401) {
          serviceLogger.error({ provider: provider.name, providerType }, 'Authentication failed for provider, skipping');
          continue;
        }
        
        // For rate limits, try next provider immediately
        if (error.statusCode === 429 || error.statusCode === 402) {
          serviceLogger.warn({ provider: provider.name, providerType }, 'Rate limit or quota exceeded, moving to next provider');
          continue;
        }
      }
    }

    // All providers failed
    const availableProviders = Array.from(this.providers.keys()).join(', ');
    const coolingProviders = Array.from(this.providerState.entries())
      .filter(([type]) => this.isProviderCoolingDown(type))
      .map(([type, state]) => ({
        providerType: type,
        retryAt: state.cooldownUntil ? new Date(state.cooldownUntil).toISOString() : null,
        lastError: state.lastError ?? lastError?.message
      }));

    if (coolingProviders.length > 0) {
      serviceLogger.warn({ coolingProviders }, 'All providers failed; some are cooling down');
    }

    throw new Error(
      `All AI providers failed. Last error: ${lastError?.message || 'Unknown'}. ` +
      `Available providers: ${availableProviders}. ` +
      (coolingProviders.length > 0
        ? `Cooling down providers: ${coolingProviders
            .map((provider) => `${provider.providerType}${provider.retryAt ? ` (retry at ${provider.retryAt})` : ''}`)
            .join(', ')}. `
        : '') +
      `Please check your API keys or ensure Ollama is running locally.`
    );
  }

  /**
   * Get list of providers to try, prioritizing last working provider
   */
  private getProvidersToTry(): AIProviderType[] {
    const now = Date.now();
    const prioritized = [...this.providerPriority].filter((type) => this.providers.has(type));

    let ordered = prioritized;

    if (this.lastWorkingProvider && prioritized.includes(this.lastWorkingProvider)) {
      const filtered = prioritized.filter((p) => p !== this.lastWorkingProvider);
      ordered = [this.lastWorkingProvider, ...filtered];
    }

    const available = ordered.filter((type) => {
      this.clearCooldownIfExpired(type, now);
      if (this.isProviderCoolingDown(type, now)) {
        serviceLogger.debug({ providerType: type }, 'Provider skipped due to active cooldown');
        return false;
      }
      return true;
    });

    if (!this.fallbackEnabled) {
      if (available.length > 0) {
        return [available[0]];
      }
      if (ordered.length > 0) {
        return [ordered[0]];
      }
    }

    return available;
  }

  /**
   * Debug helper for tests and diagnostics
   */
  public debugConfig(): { fallbackEnabled: boolean; providerPriority: AIProviderType[]; availableProviders: AIProviderType[]; maxFailuresBeforeCooldown: number; providerCooldownMs: number } {
    return {
      fallbackEnabled: this.fallbackEnabled,
      providerPriority: [...this.providerPriority],
      availableProviders: [...this.providers.keys()],
      maxFailuresBeforeCooldown: this.maxFailuresBeforeCooldown,
      providerCooldownMs: this.providerCooldownMs
    };
  }

  public debugProvidersToTry(): AIProviderType[] {
    return this.getProvidersToTry();
  }

  public debugMarkProviderFailure(providerType: AIProviderType, options?: { failureCount?: number; forceCooldown?: boolean }): void {
    const targetState = this.getOrCreateProviderState(providerType);
    const nextCount = options?.failureCount ?? targetState.failureCount + 1;
    const forceCooldown = options?.forceCooldown ?? false;
    let cooldownUntil = targetState.cooldownUntil;

    if (forceCooldown || nextCount >= this.maxFailuresBeforeCooldown) {
      cooldownUntil = Date.now() + this.providerCooldownMs;
    }

    this.providerState.set(providerType, {
      failureCount: nextCount,
      cooldownUntil,
      lastError: 'Marked failure (debug)'
    });
  }

  /**
   * Get status of all providers
   */
  async getProviderStatus(): Promise<Record<string, { available: boolean; name: string; cooldownActive: boolean; cooldownExpiresAt: string | null; lastError?: string }>> {
    const status: Record<string, { available: boolean; name: string; cooldownActive: boolean; cooldownExpiresAt: string | null; lastError?: string }> = {};
    const now = Date.now();

    for (const [type, provider] of this.providers) {
      try {
        this.clearCooldownIfExpired(type, now);
        const coolingDown = this.isProviderCoolingDown(type, now);
        const availableFlag = await provider.isAvailable();
        const state = this.providerState.get(type) ?? { failureCount: 0, cooldownUntil: null };

        status[type] = {
          available: availableFlag && !coolingDown,
          name: provider.name,
          cooldownActive: coolingDown,
          cooldownExpiresAt: state.cooldownUntil ? new Date(state.cooldownUntil).toISOString() : null,
          lastError: state.lastError
        };
      } catch (error: any) {
        const state = this.providerState.get(type) ?? { failureCount: 0, cooldownUntil: null };
        status[type] = {
          available: false,
          name: provider.name,
          cooldownActive: this.isProviderCoolingDown(type, now),
          cooldownExpiresAt: state.cooldownUntil ? new Date(state.cooldownUntil).toISOString() : null,
          lastError: error?.message ?? state.lastError
        };
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

  private recordUsageMetrics(providerType: AIProviderType, data: { provider: string; processingTime: number; tokens?: number; model?: string | null }): void {
    if (!this.usageLoggingEnabled) return;
    const payload = {
      event: 'ai_usage',
      providerKey: providerType,
      provider: data.provider,
      model: data.model ?? null,
      durationMs: data.processingTime,
      tokens: data.tokens ?? null,
      timestamp: new Date().toISOString()
    };
    serviceLogger.info(payload, 'AI provider usage metrics');
  }
}

// Export singleton instance
export const llmService = new LLMService();