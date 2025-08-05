import { NextApiRequest, NextApiResponse } from "next";
import { QdrantHandler } from "@/lib/qdrantHandler";
import {
  handleApiError,
  validateMethod,
  validateRequired,
  createAuthenticationError,
  createTimeoutError,
} from "@/lib/errorHandler";
import logger from "@/lib/logger";
import { PerformanceMonitor, timeOperation } from "@/lib/performance";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const startTime = Date.now();

  try {
    // Validate HTTP method
    validateMethod(req.method, ["POST"]);

    // Validate required fields
    validateRequired(req.body, ["idea"]);

    const { idea } = req.body;

    // Additional validation
    if (typeof idea !== "string" || idea.trim().length === 0) {
      throw new Error("Idea must be a non-empty string");
    }

    if (idea.length > 5000) {
      throw new Error("Idea exceeds maximum length of 5000 characters");
    }

    logger.info("Search ideas request started", {
      ideaLength: idea.length,
      userAgent: req.headers["user-agent"],
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    });

    const qdrantHandler = new QdrantHandler();
    const performanceMonitor = PerformanceMonitor.getInstance();

    // Time embedding creation
    const { result: embedding, duration: embeddingTime } = await timeOperation(
      "embedding creation",
      () => qdrantHandler.createEmbedding(idea),
    );

    // Time vector search
    const { result: similarProjects, duration: vectorSearchTime } =
      await timeOperation("vector search", () =>
        qdrantHandler.searchSimilarProjects(
          embedding,
          10, // Increased limit for better results
        ),
      );

    const duration = Date.now() - startTime;

    // Record performance metrics
    performanceMonitor.recordMetrics({
      apiResponseTime: duration,
      vectorSearchTime,
      embeddingTime,
      totalRequestTime: duration,
      cacheHitRate:
        qdrantHandler.getCacheStats().embeddingCacheSize > 0 ? 1 : 0,
    });

    logger.performanceLog("Search ideas completed", duration, {
      projectsFound: similarProjects?.length || 0,
      ideaLength: idea.length,
      embeddingTime,
      vectorSearchTime,
    });

    res.status(200).json({
      message: "検索が正常に完了しました",
      projects: similarProjects,
      metadata: {
        searchTime: duration,
        resultsCount: similarProjects?.length || 0,
        cacheStats: qdrantHandler.getCacheStats(),
        embeddingTime,
        vectorSearchTime,
        performanceMetrics: performanceMonitor.getAverageMetrics(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.performanceLog("Search ideas failed", duration, {
      error: error.message,
    });

    // Handle specific error types
    if (
      error.message?.includes("403") ||
      error.message?.includes("authentication")
    ) {
      const authError = createAuthenticationError(error.message, [
        "NOMIC_API_KEYが正しく設定されているか確認してください",
        "APIキーが有効であることを確認してください",
      ]);
      return handleApiError(authError, res, {
        endpoint: "/api/search-ideas",
        duration,
      });
    }

    if (
      error.message?.includes("timeout") ||
      error.message?.includes("ETIMEDOUT")
    ) {
      const timeoutError = createTimeoutError(error.message);
      return handleApiError(timeoutError, res, {
        endpoint: "/api/search-ideas",
        duration,
      });
    }

    // Handle general errors
    handleApiError(error, res, {
      endpoint: "/api/search-ideas",
      idea: req.body?.idea
        ? req.body.idea.substring(0, 100) + "..."
        : undefined,
      duration,
    });
  }
}
