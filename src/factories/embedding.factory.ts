import {
  EmbeddingProvider,
  EmbeddingProviderType,
  EmbeddingProviderConfig,
} from "@/interfaces/embedding.interface";
import { HttpClient } from "@/interfaces/http.interface";
import { OllamaAdapter, OllamaConfig } from "@/adapters/ollama.adapter";
import { NomicAdapter, NomicConfig } from "@/adapters/nomic.adapter";
import { AxiosAdapter } from "@/adapters/axios.adapter";

/**
 * Factory configuration for creating embedding providers
 */
export interface EmbeddingFactoryConfig {
  /**
   * Provider type to create
   */
  provider?: EmbeddingProviderType | string;

  /**
   * Provider-specific configuration
   */
  config?: EmbeddingProviderConfig;

  /**
   * Custom HTTP client to use (for providers that need HTTP)
   */
  httpClient?: HttpClient;
}

/**
 * Factory for creating embedding providers
 */
export class EmbeddingFactory {
  /**
   * Creates an embedding provider based on configuration
   * @param config Factory configuration
   * @returns An embedding provider instance
   * @throws Error if the provider type is not supported
   */
  static create(config?: EmbeddingFactoryConfig): EmbeddingProvider {
    const providerType =
      config?.provider ||
      process.env.EMBEDDING_PROVIDER ||
      EmbeddingProviderType.NOMIC;

    switch (providerType.toLowerCase()) {
      case EmbeddingProviderType.OLLAMA:
        return this.createOllamaProvider(config?.config as OllamaConfig);

      case EmbeddingProviderType.NOMIC:
        return this.createNomicProvider(
          config?.httpClient,
          config?.config as NomicConfig,
        );

      default:
        throw new Error(`Unsupported embedding provider: ${providerType}`);
    }
  }

  /**
   * Creates an Ollama embedding provider
   */
  private static createOllamaProvider(
    config?: OllamaConfig,
  ): EmbeddingProvider {
    return new OllamaAdapter(config);
  }

  /**
   * Creates a Nomic embedding provider
   */
  private static createNomicProvider(
    httpClient?: HttpClient,
    config?: NomicConfig,
  ): EmbeddingProvider {
    // Use provided HTTP client or create a default one
    const client = httpClient || new AxiosAdapter();
    return new NomicAdapter(client, config);
  }

  /**
   * Registers a custom provider factory
   * This can be used to add support for additional providers
   */
  private static customProviders = new Map<
    string,
    (config?: any) => EmbeddingProvider
  >();

  static registerProvider(
    type: string,
    factory: (config?: any) => EmbeddingProvider,
  ): void {
    this.customProviders.set(type.toLowerCase(), factory);
  }

  /**
   * Creates a custom provider if registered
   */
  private static createCustomProvider(
    type: string,
    config?: any,
  ): EmbeddingProvider | null {
    const factory = this.customProviders.get(type.toLowerCase());
    if (factory) {
      return factory(config);
    }
    return null;
  }
}
