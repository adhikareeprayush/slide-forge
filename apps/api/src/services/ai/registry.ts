import { MockAIProvider } from './mock';
import { NvidiaNimProvider, OllamaProvider } from './nvidia';
import type { AIProvider } from './types';

export type AIProviderName = 'nvidia' | 'ollama' | 'mock';

export function getAIProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER ?? 'mock') as AIProviderName;

  switch (name) {
    case 'nvidia':
      return new NvidiaNimProvider();
    case 'ollama':
      return new OllamaProvider();
    case 'mock':
      return new MockAIProvider();
    default:
      throw new Error(`Unknown AI_PROVIDER: ${name}`);
  }
}

export function resolveAIProvider(): AIProvider {
  if (!process.env.NVIDIA_API_KEY && process.env.AI_PROVIDER === 'nvidia') {
    console.warn('NVIDIA_API_KEY missing — falling back to mock provider');
    return new MockAIProvider();
  }
  try {
    return getAIProvider();
  } catch {
    console.warn('AI provider init failed — falling back to mock provider');
    return new MockAIProvider();
  }
}
