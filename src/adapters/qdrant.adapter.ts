import { QdrantClient } from "@qdrant/js-client-rest";
import {
  VectorDBClient,
  VectorSearchQuery,
  VectorSearchResult,
  VectorPoint,
  CollectionConfig,
  VectorDBError,
} from "@/interfaces/vectordb.interface";
import { getValidatedEnv } from "@/lib/env";

/**
 * Qdrant adapter configuration
 */
export interface QdrantConfig {
  /**
   * Qdrant server URL
   */
  url?: string;

  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * Timeout in milliseconds
   */
  timeout?: number;

  /**
   * Whether to check client-server compatibility
   */
  checkCompatibility?: boolean;
}

/**
 * Adapter for Qdrant vector database
 */
export class QdrantAdapter implements VectorDBClient {
  private readonly client: QdrantClient;

  constructor(config?: QdrantConfig) {
    const env = getValidatedEnv();
    const url = config?.url || env.QD_URL;
    const apiKey = config?.apiKey || env.QD_API_KEY;

    this.client = new QdrantClient({
      url,
      apiKey,
      timeout: config?.timeout,
    });
  }

  async search<T = any>(
    collection: string,
    query: VectorSearchQuery,
  ): Promise<VectorSearchResult<T>[]> {
    try {
      const response = await this.client.search(collection, {
        vector: query.vector,
        limit: query.limit,
        filter: query.filter,
        score_threshold: query.scoreThreshold,
      });

      return response.map((item: any) => ({
        id: item.id,
        score: item.score,
        payload: item.payload as T,
      }));
    } catch (error) {
      throw this.wrapError(error, "Search failed");
    }
  }

  async upsert(collection: string, points: VectorPoint[]): Promise<void> {
    try {
      const qdrantPoints = points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: point.payload || {},
      }));

      await this.client.upsert(collection, {
        points: qdrantPoints,
      });
    } catch (error) {
      throw this.wrapError(error, "Upsert failed");
    }
  }

  async createCollection(
    collection: string,
    config?: CollectionConfig,
  ): Promise<void> {
    if (!config?.vectorSize) {
      throw new VectorDBError(
        "Vector size is required for collection creation",
        "INVALID_CONFIG",
      );
    }

    try {
      await this.client.createCollection(collection, {
        vectors: {
          size: config.vectorSize,
          distance: config.distance || "Cosine",
        } as any,
      });
    } catch (error) {
      throw this.wrapError(error, "Collection creation failed");
    }
  }

  async delete(collection: string, ids: string[]): Promise<void> {
    try {
      await this.client.delete(collection, {
        points: ids,
      });
    } catch (error) {
      throw this.wrapError(error, "Delete failed");
    }
  }

  /**
   * Wraps errors in VectorDBError
   */
  private wrapError(error: unknown, context: string): VectorDBError {
    if (error instanceof Error) {
      // Check for connection errors
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("connect ECONNREFUSED") ||
        error.message.includes("Failed to obtain server version")
      ) {
        return new VectorDBError(
          `${context}: Qdrant server is not available. Please ensure Qdrant is running`,
          "CONNECTION_ERROR",
          error,
        );
      }

      // Check for authentication errors
      if (
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("Unauthorized")
      ) {
        return new VectorDBError(
          `${context}: Authentication failed. Please check your API key`,
          "AUTH_ERROR",
          error,
        );
      }

      // Check for collection not found
      if (
        error.message.includes("404") ||
        (error.message.includes("Collection") &&
          error.message.includes("not found"))
      ) {
        return new VectorDBError(
          `${context}: Collection not found`,
          "NOT_FOUND",
          error,
        );
      }

      return new VectorDBError(
        `${context}: ${error.message}`,
        "QDRANT_ERROR",
        error,
      );
    }

    return new VectorDBError(
      `${context}: Unknown error occurred`,
      "UNKNOWN_ERROR",
    );
  }
}
