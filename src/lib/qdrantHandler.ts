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

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class QdrantHandler {
  private client: QdrantClient;
  private embeddingCache: Map<string, CacheEntry<number[]>> = new Map();
  private searchCache: Map<string, CacheEntry<QdrantSearchResult[]>> =
    new Map();
  private projectsCache: Map<string, CacheEntry<Project[]>> = new Map();
  private prizeAnalysisCache: Map<string, CacheEntry<any>> = new Map();
  private embeddingProvider: EmbeddingProvider;
  private vectorDB: VectorDBClient;
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15分
  private collectionInitialized = false;

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
        checkCompatibility: false,
      });
    } else {
      // Legacy constructor pattern for backward compatibility
      const env = getValidatedEnv();
      this.client = new QdrantClient({
        url: env.QD_URL,
        apiKey: env.QD_API_KEY,
        checkCompatibility: false,
      });
      // Initialize with default adapters
      this.embeddingProvider = EmbeddingFactory.create();
      this.vectorDB = new QdrantAdapter();
    }
    // Collection will be initialized lazily on first use
  }

  private async ensureCollectionExists() {
    if (this.collectionInitialized) {
      return;
    }

    try {
      await this.client.getCollection("eth_global_showcase");
      logger.info("Collection 'eth_global_showcase' exists.");
      this.collectionInitialized = true;
    } catch (e) {
      logger.info("Collection not found, creating a new one.");
      try {
        await this.client.createCollection("eth_global_showcase", {
          vectors: {
            size: 768,
            distance: "Cosine",
          },
        });
        logger.info("Collection 'eth_global_showcase' created successfully.");
        this.collectionInitialized = true;
      } catch (createError) {
        logger.error("Failed to create collection:", createError);
        // Graceful fallback - collection may exist but getCollection failed
        // We'll continue with a warning rather than crash
        logger.warn("Continuing without collection verification");
        this.collectionInitialized = true; // Prevent repeated attempts
      }
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

  private isValidCache<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private setCache<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    data: T,
    ttl: number = this.DEFAULT_TTL,
  ): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private getCache<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
  ): T | null {
    const entry = cache.get(key);
    if (entry && this.isValidCache(entry)) {
      return entry.data;
    }
    if (entry) {
      cache.delete(key); // 期限切れのエントリを削除
    }
    return null;
  }

  public async createEmbedding(text: string): Promise<number[]> {
    try {
      // キャッシュをチェック
      const cacheKey = `embedding:${text}`;
      const cached = this.getCache(this.embeddingCache, cacheKey);
      if (cached) {
        logger.debug("Embedding cache hit", { cacheKey });
        return cached;
      }

      // Use injected embedding provider
      const result = await this.embeddingProvider.createEmbedding(text);

      // 結果をキャッシュ
      this.setCache(this.embeddingCache, cacheKey, result);
      logger.debug("Embedding cached", { cacheKey });

      return result;
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
      // Ensure collection exists before performing search
      await this.ensureCollectionExists();

      // キャッシュキーを生成（embeddingのハッシュとlimitを使用）
      const embeddingHash = embedding.slice(0, 10).join(","); // 最初の10要素でハッシュ生成
      const cacheKey = `search:${embeddingHash}:${limit}`;

      // キャッシュをチェック
      const cached = this.getCache(this.projectsCache, cacheKey);
      if (cached) {
        logger.debug("Similar projects cache hit", { cacheKey });
        return cached;
      }

      const response = await this.vectorDB.search("eth_global_showcase", {
        vector: embedding,
        limit,
      });

      console.log("Full response object:", JSON.stringify(response, null, 2));
      const result = response
        .filter((item: any) => item.payload != null)
        .map((item: any) => ({
          title: String(item.payload?.title || ""),
          description: String(item.payload?.projectDescription || ""),
          link: item.payload?.link as string | undefined,
          howItsMade: item.payload?.howItsMade as string | undefined,
          sourceCode: item.payload?.sourceCode as string | undefined,
        }));

      // 結果をキャッシュ
      this.setCache(this.projectsCache, cacheKey, result);
      logger.debug("Similar projects cached", {
        cacheKey,
        count: result.length,
      });

      return result;
    } catch (error) {
      logger.error("Failed to search for similar projects:", error);
      return [];
    }
  }

  public async getAllProjects(
    limit: number = 1000,
    hackathonFilter?: string,
  ): Promise<Project[]> {
    try {
      const filter = hackathonFilter
        ? {
            must: [
              {
                key: "hackathon",
                match: {
                  value: hackathonFilter,
                },
              },
            ],
          }
        : undefined;

      const response = await this.client.scroll("eth_global_showcase", {
        limit,
        with_payload: true,
        filter,
      });

      if (!response.points) {
        return [];
      }

      return response.points
        .filter((point: any) => point.payload != null)
        .map((point: any) => ({
          title: String(point.payload?.title || ""),
          description: String(point.payload?.projectDescription || ""),
          link: point.payload?.link as string | undefined,
          howItsMade: point.payload?.howItsMade as string | undefined,
          sourceCode: point.payload?.sourceCode as string | undefined,
          hackathon: point.payload?.hackathon as string | undefined,
        }));
    } catch (error) {
      logger.error("Failed to get all projects:", error);
      return [];
    }
  }

  public async getProjectsByHackathons(
    hackathons: string[],
    limitPerHackathon: number = 100,
  ): Promise<Project[]> {
    try {
      // キャッシュキーを生成
      const cacheKey = `hackathons:${hackathons.sort().join(",")}:${limitPerHackathon}`;

      // キャッシュをチェック
      const cached = this.getCache(this.projectsCache, cacheKey);
      if (cached) {
        logger.debug("Hackathon projects cache hit", { cacheKey });
        return cached;
      }

      // 並列処理でプロジェクトを取得（メモリ使用量を制限）
      const projectPromises = hackathons.map((hackathon) =>
        this.getAllProjects(limitPerHackathon, hackathon),
      );

      const projectArrays = await Promise.all(projectPromises);

      // フラット化とストリーミング処理で重複除去
      const projectMap = new Map<string, Project>();

      for (const projects of projectArrays) {
        for (const project of projects) {
          if (!projectMap.has(project.title)) {
            projectMap.set(project.title, project);
          }
        }
      }

      const uniqueProjects = Array.from(projectMap.values());

      // 結果をキャッシュ（短い TTL で重複計算を避ける）
      this.setCache(
        this.projectsCache,
        cacheKey,
        uniqueProjects,
        5 * 60 * 1000,
      ); // 5分
      logger.debug("Hackathon projects cached", {
        cacheKey,
        hackathons: hackathons.length,
        totalProjects: uniqueProjects.length,
      });

      return uniqueProjects;
    } catch (error) {
      logger.error("Failed to get projects by hackathons:", error);
      return [];
    }
  }

  // Performance monitoring methods
  public getCacheStats() {
    return {
      embeddingCacheSize: this.embeddingCache.size,
      searchCacheSize: this.searchCache.size,
      projectsCacheSize: this.projectsCache.size,
      prizeAnalysisCacheSize: this.prizeAnalysisCache.size,
      totalCacheSize:
        this.embeddingCache.size +
        this.searchCache.size +
        this.projectsCache.size +
        this.prizeAnalysisCache.size,
    };
  }

  public clearCache() {
    this.embeddingCache.clear();
    this.searchCache.clear();
    this.projectsCache.clear();
    this.prizeAnalysisCache.clear();
    logger.info("All caches cleared");
  }

  public clearExpiredCache() {
    const now = Date.now();

    // Embedding cache cleanup
    for (const [key, entry] of this.embeddingCache.entries()) {
      if (!this.isValidCache(entry)) {
        this.embeddingCache.delete(key);
      }
    }

    // Search cache cleanup
    for (const [key, entry] of this.searchCache.entries()) {
      if (!this.isValidCache(entry)) {
        this.searchCache.delete(key);
      }
    }

    // Projects cache cleanup
    for (const [key, entry] of this.projectsCache.entries()) {
      if (!this.isValidCache(entry)) {
        this.projectsCache.delete(key);
      }
    }

    // Prize analysis cache cleanup
    for (const [key, entry] of this.prizeAnalysisCache.entries()) {
      if (!this.isValidCache(entry)) {
        this.prizeAnalysisCache.delete(key);
      }
    }

    logger.info("Expired cache entries cleared");
  }
}
