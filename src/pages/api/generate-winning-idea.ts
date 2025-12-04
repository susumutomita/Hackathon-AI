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
  maxDuration: 60, // 1 minute for Hobby plan compatibility
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IdeaGenerationResponse>,
) {
  const startTime = Date.now();

  // 安全なCORS設定
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // セキュリティヘッダー
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Check if method is POST
  if (req.method !== "POST") {
    res.status(405).json({
      success: false,
      error: "Method Not Allowed - Only POST method is allowed",
    });
    return;
  }

  try {
    // Apply rate limiting (より緩やかな制限)
    const rateLimitResult = applyApiRateLimit(req);
    setRateLimitHeaders(res.setHeader.bind(res), rateLimitResult);

    if (!rateLimitResult.success) {
      res.status(429).json({
        success: false,
        error: "Too many requests. Please try again later.",
      });
      return;
    }

    // Validate request body
    const validation = GenerateWinningIdeaRequestSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
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
      res.status(504).json({
        success: false,
        error: timeoutError.message,
        metadata: {
          processingTime: duration,
          projectsAnalyzed: 0,
          trendsIdentified: [],
        },
      });
      return;
    }

    // Handle validation errors
    if (error.type === "VALIDATION_ERROR") {
      res.status(400).json({
        success: false,
        error: error.message,
        metadata: {
          processingTime: duration,
          projectsAnalyzed: 0,
          trendsIdentified: [],
        },
      });
      return;
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
