import { QdrantClient } from "@qdrant/js-client-rest";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import logger from "@/lib/logger";
import { Project } from "@/types";
import ollama from "ollama";
import { getValidatedEnv, isProduction } from "@/lib/env";
import {
  QdrantPoint,
  QdrantSearchResult,
  OllamaError,
} from "@/types/qdrant.types";
import type { EmbeddingProvider } from "@/interfaces/embedding.interface";
import type { VectorDBClient } from "@/interfaces/vectordb.interface";
import { EmbeddingFactory } from "@/factories/embedding.factory";
import { QdrantAdapter } from "@/adapters/qdrant.adapter";

export class QdrantHandler {
  private client: QdrantClient;
  private embeddingCache: Map<string, number[]> = new Map();
  private searchCache: Map<string, QdrantSearchResult[]> = new Map();
  private embeddingProvider: EmbeddingProvider;
  private vectorDB: VectorDBClient;

  constructor(
    embeddingProvider?: EmbeddingProvider,
    vectorDB?: VectorDBClient,
  ) {
    if (embeddingProvider && vectorDB) {
      // New constructor injection pattern
      this.embeddingProvider = embeddingProvider;
      this.vectorDB = vectorDB;
      // Keep the legacy client for backward compatibility with existing methods
      const env = getValidatedEnv();
      this.client = new QdrantClient({
        url: env.QD_URL,
        apiKey: env.QD_API_KEY,
      });
    } else {
      // Legacy constructor pattern for backward compatibility
      const env = getValidatedEnv();
      this.client = new QdrantClient({
        url: env.QD_URL,
        apiKey: env.QD_API_KEY,
      });
      // Initialize with default adapters
      this.embeddingProvider = EmbeddingFactory.create();
      this.vectorDB = new QdrantAdapter();
    }
    this.ensureCollectionExists();
  }

  private async ensureCollectionExists() {
    try {
      await this.client.getCollection("eth_global_showcase");
      logger.info("Collection 'eth_global_showcase' exists.");
    } catch (e) {
      logger.info("Collection not found, creating a new one.");
      await this.client.createCollection("eth_global_showcase", {
        vectors: {
          size: 768,
          distance: "Cosine",
        },
      });
      logger.info("Collection 'eth_global_showcase' created successfully.");
    }
  }

  public async addProject(
    title: string,
    projectDescription: string,
    howItsMade: string,
    sourceCode: string,
    link: string,
    hackathon: string,
  ) {
    try {
      // 既存のプロジェクトをリンクで検索
      const existingProject = await this.findProjectByLink(link);

      let projectId: string;
      if (existingProject) {
        // 既存のプロジェクトが見つかった場合、そのIDを使用
        projectId = String(existingProject.id);
        logger.info(
          `Found existing project '${title}' with ID: ${projectId}. Updating...`,
        );
      } else {
        // 新規プロジェクトの場合
        // 後方互換性のため、UUIDを使用（既存システムとの互換性維持）
        projectId = uuidv4();
        logger.info(`Creating new project '${title}' with ID: ${projectId}`);
      }

      const embedding = await this.createEmbedding(projectDescription);
      const point = {
        id: projectId,
        vector: embedding,
        payload: {
          title,
          projectDescription,
          howItsMade,
          sourceCode,
          link,
          hackathon,
          lastUpdated: new Date().toISOString(),
        },
      };

      if (this.vectorDB.upsert) {
        await this.vectorDB.upsert("eth_global_showcase", [point]);
      } else {
        // Fallback to legacy client for backward compatibility
        await this.client.upsert("eth_global_showcase", {
          wait: true,
          points: [point],
        });
      }

      logger.info(
        `Project '${title}' from event '${hackathon}' upserted to the 'eth_global_showcase'.`,
      );
    } catch (error) {
      logger.error("Failed to add/update project:", error);
    }
  }

  private async findProjectByLink(link: string): Promise<QdrantPoint | null> {
    try {
      // ペイロードフィルターを使用してリンクで検索
      const searchResult = await this.client.scroll("eth_global_showcase", {
        filter: {
          must: [
            {
              key: "link",
              match: {
                value: link,
              },
            },
          ],
        },
        limit: 1,
      });

      if (searchResult.points && searchResult.points.length > 0) {
        return searchResult.points[0] as unknown as QdrantPoint;
      }

      return null;
    } catch (error) {
      logger.error("Failed to find project by link:", error);
      return null;
    }
  }

  public async createEmbedding(text: string): Promise<number[]> {
    try {
      // Use injected embedding provider
      return await this.embeddingProvider.createEmbedding(text);
    } catch (error) {
      // For backward compatibility, preserve the existing error handling structure
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
      };
      logger.error("Error during embedding creation: ", errorDetails);

      // Re-throw the error with additional context if needed
      throw error;
    }
  }
  public async searchSimilarProjects(
    embedding: number[],
    limit: number = 5,
  ): Promise<Project[]> {
    try {
      const response = await this.vectorDB.search("eth_global_showcase", {
        vector: embedding,
        limit,
      });

      console.log("Full response object:", JSON.stringify(response, null, 2));
      return response
        .filter((item: any) => item.payload != null)
        .map((item: any) => ({
          title: String(item.payload?.title || ""),
          description: String(item.payload?.projectDescription || ""),
          link: item.payload?.link as string | undefined,
          howItsMade: item.payload?.howItsMade as string | undefined,
          sourceCode: item.payload?.sourceCode as string | undefined,
        }));
    } catch (error) {
      logger.error("Failed to search for similar projects:", error);
      return [];
    }
  }

  // Performance monitoring methods
  public getCacheStats() {
    return {
      embeddingCacheSize: this.embeddingCache.size,
      searchCacheSize: this.searchCache.size,
    };
  }

  public clearCache() {
    this.embeddingCache.clear();
    this.searchCache.clear();
    logger.info("All caches cleared");
  }
}
