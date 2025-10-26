import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIProviderType } from '../src/types/ai';

const ORIGINAL_ENV = { ...process.env };

async function createService() {
  // Reload the module so environment updates apply.
  const module = await import('../src/services/llmProvider');
  return new module.LLMService();
}

const enableHuggingFace = () => {
  process.env.HUGGINGFACE_API_KEY_1 = 'hf_test_key';
};

const enableGemini = () => {
  process.env.GEMINI_API_KEY_1 = 'gm_test_key';
};

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

describe('LLMService fallback priority', () => {
  it('prefers providers that are both enabled and healthy', async () => {
    process.env.AI_PROVIDER_PRIORITY = `${AIProviderType.GEMINI},${AIProviderType.HUGGINGFACE}`;
    enableGemini();
    enableHuggingFace();

    const service = await createService();
    const providersToTry = service.debugProvidersToTry();

    expect(providersToTry).toEqual([
      AIProviderType.GEMINI,
      AIProviderType.HUGGINGFACE
    ]);
  });

  it('skips providers without API credentials even if prioritised', async () => {
    process.env.AI_PROVIDER_PRIORITY = `${AIProviderType.HUGGINGFACE},${AIProviderType.GEMINI}`;
    enableGemini();

    const service = await createService();
    const providersToTry = service.debugProvidersToTry();

    expect(providersToTry).toEqual([AIProviderType.GEMINI]);
  });

  it('drops providers that enter cooldown windows', async () => {
    process.env.AI_PROVIDER_PRIORITY = `${AIProviderType.HUGGINGFACE}`;
    enableHuggingFace();
    process.env.AI_PROVIDER_MAX_FAILURES_BEFORE_COOLDOWN = '1';
    process.env.AI_PROVIDER_COOLDOWN_MS = '1';

    const service = await createService();

    expect(service.debugProvidersToTry()).toEqual([AIProviderType.HUGGINGFACE]);

    service.debugMarkProviderFailure(AIProviderType.HUGGINGFACE, { forceCooldown: true });

    expect(service.debugProvidersToTry()).toEqual([]);
  });
});

afterAll(() => {
  process.env = { ...ORIGINAL_ENV };
});
