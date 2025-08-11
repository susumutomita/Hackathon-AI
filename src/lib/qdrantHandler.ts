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
      // 既存のプロジェクトをリンクとタイトル+ハッカソンの組み合わせで検索
      const existingProject = await this.findExistingProject(
        link,
        title,
        hackathon,
      );

      let projectId: string;
      if (existingProject) {
        // 既存のプロジェクトが見つかった場合、そのIDを使用
        projectId = String(existingProject.id);
        logger.info(
          `Found existing project '${title}' (${hackathon}) with ID: ${projectId}. Updating...`,
        );
      } else {
        // 新規プロジェクトの場合
        // 後方互換性のため、UUIDを使用（既存システムとの互換性維持）
        projectId = uuidv4();
        logger.info(
          `Creating new project '${title}' (${hackathon}) with ID: ${projectId}`,
        );
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

  private normalizeLink(link: string): string {
    // URLを正規化（末尾のスラッシュ削除、小文字化、プロトコル除去）
    return link
      .toLowerCase()
      .replace(/^https?:\/\//, "") // プロトコル除去
      .replace(/\/$/, "") // 末尾のスラッシュ削除
      .replace(/^www\./, ""); // www除去
  }

  private async findExistingProject(
    link: string | undefined,
    title: string,
    hackathon: string,
  ): Promise<QdrantPoint | null> {
    try {
      // 1. リンクベースの検索（リンクがある場合）
      if (link) {
        const normalizedLink = this.normalizeLink(link);

        // すべてのプロジェクトを取得してリンクを正規化して比較
        const scrollResult = await this.client.scroll("eth_global_showcase", {
          limit: 10000,
          with_payload: true,
        });

        if (scrollResult.points) {
          for (const point of scrollResult.points) {
            const payload = point.payload as any;
            if (payload?.link) {
              const existingNormalizedLink = this.normalizeLink(payload.link);
              if (existingNormalizedLink === normalizedLink) {
                logger.info(
                  `Found existing project by normalized link: ${link}`,
                );
                return point as unknown as QdrantPoint;
              }
            }
          }
        }
      }

      // 2. タイトル+ハッカソンベースの検索
      const titleHackathonFilter = {
        must: [
          {
            key: "title",
            match: {
              value: title,
            },
          },
          {
            key: "hackathon",
            match: {
              value: hackathon,
            },
          },
        ],
      };

      const searchResult = await this.client.scroll("eth_global_showcase", {
        filter: titleHackathonFilter,
        limit: 1,
      });

      if (searchResult.points && searchResult.points.length > 0) {
        logger.info(
          `Found existing project by title+hackathon: ${title} (${hackathon})`,
        );
        return searchResult.points[0] as unknown as QdrantPoint;
      }

      return null;
    } catch (error) {
      logger.error("Failed to find existing project:", error);
      return null;
    }
  }

  private async findProjectByLink(link: string): Promise<QdrantPoint | null> {
    // 後方互換性のために残す（既存のコードが使用している可能性があるため）
    return this.findExistingProject(link, "", "");
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
