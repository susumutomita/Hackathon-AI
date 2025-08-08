import ollama from "ollama";
import {
  EmbeddingProvider,
  EmbeddingProviderConfig,
  EmbeddingError,
} from "@/interfaces/embedding.interface";

/**
 * Ollama adapter configuration
 */
export interface OllamaConfig extends EmbeddingProviderConfig {
  /**
   * Ollama model to use for embeddings
   */
  model?: string;

  /**
   * Ollama server URL
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Adapter for Ollama embedding provider
 */
export class OllamaAdapter implements EmbeddingProvider {
  private readonly model: string;
  private readonly baseUrl?: string;
  private readonly timeout?: number;

  constructor(config?: OllamaConfig) {
    // Use OLLAMA_EMBED_MODEL specifically for embeddings, fallback to OLLAMA_MODEL, then default
    this.model =
      config?.model ||
      process.env.OLLAMA_EMBED_MODEL ||
      process.env.OLLAMA_MODEL ||
      "nomic-embed-text";
    this.baseUrl = config?.baseUrl || process.env.OLLAMA_URL;
    this.timeout = config?.timeout;
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const options: any = {
        model: this.model,
        input: text,
      };

      // Configure Ollama client if custom baseUrl is provided
      if (this.baseUrl) {
        // Note: The ollama library may need to be configured differently
        // This is a placeholder for setting the base URL
        process.env.OLLAMA_HOST = this.baseUrl;
      }

      const response = await ollama.embed(options);

      if (!response.embeddings || response.embeddings.length === 0) {
        throw new EmbeddingError("No embeddings returned from Ollama");
      }

      return response.embeddings[0];
    } catch (error) {
      // Handle specific Ollama errors
      if (this.isConnectionError(error)) {
        const ollamaUrl = this.baseUrl || "http://localhost:11434";
        throw new EmbeddingError(
          `Ollama is not running at ${ollamaUrl}. Please start Ollama with: 'ollama serve' and pull the model with: 'ollama pull ${this.model}'`,
          "CONNECTION_REFUSED",
          error as Error,
        );
      }

      if (this.isModelNotFoundError(error)) {
        throw new EmbeddingError(
          `Model '${this.model}' not found. Please pull the model with: 'ollama pull ${this.model}'`,
          "MODEL_NOT_FOUND",
          error as Error,
        );
      }

      // Generic error
      const message =
        error instanceof Error ? error.message : "Unknown Ollama error";
      throw new EmbeddingError(
        `Ollama embedding failed: ${message}`,
        "OLLAMA_ERROR",
        error as Error,
      );
    }
  }

  /**
   * Checks if the error is a connection error
   */
  private isConnectionError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message?.includes("connection refused") ||
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("connect ECONNREFUSED")
      );
    }
    if (typeof error === "object" && error !== null && "code" in error) {
      return error.code === "ECONNREFUSED";
    }
    return false;
  }

  /**
   * Checks if the error is a model not found error
   */
  private isModelNotFoundError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message?.includes("model not found") ||
        error.message?.includes("pull model") ||
        error.message?.includes("no such model")
      );
    }
    return false;
  }
}
