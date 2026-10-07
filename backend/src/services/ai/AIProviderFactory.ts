import { AIProvider } from './AIProvider';
import { GeminiProvider } from './GeminiProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { GroqProvider } from './GroqProvider';
import { FallbackProvider } from './FallbackProvider';
import { config } from '../../config';

export class AIProviderFactory {
  private static instance: AIProvider | null = null;

  public static getProvider(providerName?: string): AIProvider {
    const target = (providerName || config.aiProvider || 'gemini').toLowerCase();

    switch (target) {
      case 'gemini':
      case 'google':
        return new GeminiProvider(config.gemini.apiKey, config.gemini.model);

      case 'openai':
      case 'gpt':
        return new OpenAIProvider(config.openai.apiKey, config.openai.model);

      case 'anthropic':
      case 'claude':
        return new AnthropicProvider(config.anthropic.apiKey, config.anthropic.model);

      case 'groq':
        return new GroqProvider(config.groq.apiKey, config.groq.model);

      case 'fallback':
      case 'offline':
      default:
        return new FallbackProvider();
    }
  }

  public static getDefaultProvider(): AIProvider {
    if (!this.instance) {
      this.instance = this.getProvider();
    }
    return this.instance;
  }
}
