/**
 * Interface for embedding providers
 * Defines the contract for creating text embeddings
 */
export interface EmbeddingProvider {
  /**
   * Creates an embedding vector from the given text
   * @param text The text to create an embedding for
   * @returns A promise that resolves to an array of numbers representing the embedding
   * @throws Error if the embedding creation fails
   */
  createEmbedding(text: string): Promise<number[]>;
}

/**
 * Configuration options for embedding providers
 */
export interface EmbeddingProviderConfig {
  /**
   * Provider-specific configuration
   */
  [key: string]: any;
}

/**
 * Error that can be thrown by embedding providers
 */
export class EmbeddingError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "EmbeddingError";
  }
}

/**
 * Provider types supported by the system
 */
export enum EmbeddingProviderType {
  OLLAMA = "ollama",
  NOMIC = "nomic",
}
