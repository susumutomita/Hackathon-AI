import { NextApiRequest, NextApiResponse } from "next";
import { QdrantHandlerFactory } from "@/factories/qdrantHandler.factory";
import {
  handleApiError,
  createValidationError,
  createTimeoutError,
} from "@/lib/errorHandler";
import logger from "@/lib/logger";
import { PrizeInfo, IdeaGenerationResponse } from "@/types/agent.types";
import {
  applyApiRateLimit,
  setRateLimitHeaders,
  createRateLimitError,
} from "@/lib/rateLimit";
import { GenerateWinningIdeaRequestSchema } from "@/lib/validation";

// Ensure Node.js runtime
export const config = {
  runtime: "nodejs",
  maxDuration: 60, // 60秒のタイムアウト（アイデア生成は時間がかかる）
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IdeaGenerationResponse>,
) {
  const startTime = Date.now();

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Check if method is POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed - Only POST method is allowed",
    });
  }

  try {
    // Apply rate limiting (より緩やかな制限)
    const rateLimitResult = applyApiRateLimit(req);
    setRateLimitHeaders(res.setHeader.bind(res), rateLimitResult);

    if (!rateLimitResult.success) {
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please try again later.",
      });
    }

    // Validate request body
    const validation = GenerateWinningIdeaRequestSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw createValidationError(errorMessage);
    }

    const { prizeInfo, focusArea, constraints, preferredTech } =
      validation.data;

    logger.info("Generate winning idea request started", {
      sponsor: prizeInfo.sponsor,
      prizeName: prizeInfo.prizeName,
      userAgent: req.headers["user-agent"],
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    });

    // Generate idea using the agent
    const qdrantHandler = QdrantHandlerFactory.createDefault();
    const { IdeaGenerationAgent } = await import("@/lib/ideaGenerationAgent");
    const agent = new IdeaGenerationAgent(qdrantHandler);

    const generatedIdea = await agent.generateWinningIdea(prizeInfo, {
      focusArea,
      constraints,
      preferredTech,
    });

    const duration = Date.now() - startTime;

    logger.info("Idea generation completed", {
      title: generatedIdea.title,
      winningProbability: generatedIdea.winningProbability,
      duration,
    });

    // Prepare metadata
    const metadata = {
      processingTime: duration,
      projectsAnalyzed: generatedIdea.relatedProjects.length,
      trendsIdentified: [
        "DeFi Innovation",
        "AI Integration",
        "Cross-chain Solutions",
        "Privacy Tech",
        "Social Impact",
      ].filter(() => Math.random() > 0.5), // ランダムにトレンドを選択（デモ用）
    };

    res.status(200).json({
      success: true,
      idea: generatedIdea,
      metadata,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error("Failed to generate winning idea", {
      error: error.message,
      stack: error.stack,
      duration,
    });

    // Handle specific error types
    if (
      error.message?.includes("timeout") ||
      error.message?.includes("ETIMEDOUT")
    ) {
      const timeoutError = createTimeoutError(
        "Idea generation took too long. Please try again.",
      );
      return res.status(504).json({
        success: false,
        error: timeoutError.message,
        metadata: {
          processingTime: duration,
          projectsAnalyzed: 0,
          trendsIdentified: [],
        },
      });
    }

    // Handle validation errors
    if (error.type === "VALIDATION_ERROR") {
      return res.status(400).json({
        success: false,
        error: error.message,
        metadata: {
          processingTime: duration,
          projectsAnalyzed: 0,
          trendsIdentified: [],
        },
      });
    }

    // Handle general errors
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate idea. Please try again.",
      metadata: {
        processingTime: duration,
        projectsAnalyzed: 0,
        trendsIdentified: [],
      },
    });
  }
}
