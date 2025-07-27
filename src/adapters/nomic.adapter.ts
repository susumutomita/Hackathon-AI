import {
  EmbeddingProvider,
  EmbeddingProviderConfig,
  EmbeddingError,
} from "@/interfaces/embedding.interface";
import { HttpClient, HttpError } from "@/interfaces/http.interface";

/**
 * Nomic adapter configuration
 */
export interface NomicConfig extends EmbeddingProviderConfig {
  /**
   * Nomic API key
   */
  apiKey?: string;

  /**
   * Nomic API base URL
   */
  baseUrl?: string;

  /**
   * Model to use for embeddings
   */
  model?: string;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Adapter for Nomic embedding provider
 */
export class NomicAdapter implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout?: number;

  constructor(
    private readonly httpClient: HttpClient,
    config?: NomicConfig,
  ) {
    this.apiKey = config?.apiKey || process.env.NOMIC_API_KEY || "";
    this.baseUrl = config?.baseUrl || "https://api-atlas.nomic.ai";
    this.model = config?.model || "nomic-embed-text-v1";
    this.timeout = config?.timeout;

    if (!this.apiKey) {
      throw new EmbeddingError("NOMIC_API_KEY is required", "MISSING_API_KEY");
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    const url = `${this.baseUrl}/v1/embedding/text`;

    try {
      const response = await this.httpClient.post<{ embeddings: number[][] }>(
        url,
        {
          model: this.model,
          texts: [text],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: this.timeout,
        },
      );

      if (!response.data.embeddings || response.data.embeddings.length === 0) {
        throw new EmbeddingError("No embeddings returned from Nomic API");
      }

      return response.data.embeddings[0];
    } catch (error) {
      // Handle specific HTTP errors
      if (error instanceof HttpError) {
        if (error.hasStatus(401) || error.hasStatus(403)) {
          throw new EmbeddingError(
            "Authentication failed. Please check your NOMIC_API_KEY",
            "AUTH_FAILED",
            error,
          );
        }

        if (error.hasStatus(429)) {
          throw new EmbeddingError(
            "Rate limit exceeded. Please try again later",
            "RATE_LIMIT",
            error,
          );
        }

        if (error.hasStatus(400)) {
          const errorMessage = this.extractErrorMessage(error);
          throw new EmbeddingError(
            `Invalid request: ${errorMessage}`,
            "INVALID_REQUEST",
            error,
          );
        }

        if (error.isServerError()) {
          throw new EmbeddingError(
            "Nomic API server error. Please try again later",
            "SERVER_ERROR",
            error,
          );
        }

        // Generic HTTP error
        throw new EmbeddingError(
          `Nomic API request failed: ${error.status} ${error.statusText}`,
          "HTTP_ERROR",
          error,
        );
      }

      // Non-HTTP errors (network errors, etc.)
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new EmbeddingError(
        `Failed to create embedding: ${message}`,
        "EMBEDDING_ERROR",
        error as Error,
      );
    }
  }

  /**
   * Extracts error message from HTTP error response
   */
  private extractErrorMessage(error: HttpError): string {
    if (error.response?.error) {
      return error.response.error;
    }
    if (error.response?.message) {
      return error.response.message;
    }
    if (typeof error.response === "string") {
      return error.response;
    }
    return "Unknown error";
  }
}
