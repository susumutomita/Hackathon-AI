import { QdrantHandler } from "@/lib/qdrantHandler";
import { EmbeddingFactory, EmbeddingFactoryConfig } from "./embedding.factory";
import { QdrantAdapter, QdrantConfig } from "@/adapters/qdrant.adapter";
import type { EmbeddingProvider } from "@/interfaces/embedding.interface";
import type { VectorDBClient } from "@/interfaces/vectordb.interface";

/**
 * Configuration for QdrantHandler factory
 */
export interface QdrantHandlerFactoryConfig {
  /**
   * Configuration for embedding provider
   */
  embedding?: EmbeddingFactoryConfig;

  /**
   * Configuration for vector database
   */
  vectorDB?: QdrantConfig;

  /**
   * Custom embedding provider instance
   */
  embeddingProvider?: EmbeddingProvider;

  /**
   * Custom vector database client instance
   */
  vectorDBClient?: VectorDBClient;
}

/**
 * Factory for creating QdrantHandler instances with dependency injection
 */
export class QdrantHandlerFactory {
  /**
   * Creates a QdrantHandler instance with injected dependencies
   * @param config Factory configuration
   * @returns A QdrantHandler instance with injected dependencies
   */
  static create(config?: QdrantHandlerFactoryConfig): QdrantHandler {
    // Use custom instances if provided, otherwise create from config
    const embeddingProvider = 
      config?.embeddingProvider || 
      EmbeddingFactory.create(config?.embedding);

    const vectorDBClient = 
      config?.vectorDBClient || 
      new QdrantAdapter(config?.vectorDB);

    return new QdrantHandler(embeddingProvider, vectorDBClient);
  }

  /**
   * Creates a QdrantHandler with default configuration
   * Uses environment variables for configuration
   * @returns A QdrantHandler instance with default dependencies
   */
  static createDefault(): QdrantHandler {
    return this.create();
  }
}