import { NextApiRequest, NextApiResponse } from "next";
import { generateIdeaFromPrize } from "@/lib/ideaAgent";
import {
  GenerateIdeaRequestSchema,
  validateInput,
  sanitizeString,
} from "@/lib/validation";
import {
  applyApiRateLimit,
  setRateLimitHeaders,
  createRateLimitError,
} from "@/lib/rateLimit";
import logger from "@/lib/logger";
import {
  handleApiError,
  createTimeoutError,
  createValidationError,
} from "@/lib/errorHandler";

export const config = { runtime: "nodejs" };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const startTime = Date.now();

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST method is allowed",
    });
  }

  try {
    // Rate limit
    const rate = applyApiRateLimit(req);
    setRateLimitHeaders(res.setHeader.bind(res), rate);
    if (!rate.success) return res.status(429).json(createRateLimitError(rate));

    // Validate
    const validation = validateInput(GenerateIdeaRequestSchema, req.body);
    if (!validation.success) throw createValidationError(validation.error);
    const prize = sanitizeString(validation.data.prize);

    logger.info("Generate idea request", {
      prizeLength: prize.length,
      userAgent: req.headers["user-agent"],
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    });

    const { content, similarProjects } = await generateIdeaFromPrize(prize);

    const duration = Date.now() - startTime;
    logger.performanceLog("Generate idea completed", duration, {
      prizeLength: prize.length,
      refs: similarProjects.length,
    });

    return res.status(200).json({
      idea: content,
      similarProjects,
      metadata: {
        processingTime: duration,
        refsCount: similarProjects.length,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Timeout-like errors
    if (
      error?.message?.includes("timeout") ||
      error?.message?.includes("ETIMEDOUT")
    ) {
      return handleApiError(createTimeoutError(error.message), res, {
        endpoint: "/api/generate-idea",
        duration,
      });
    }

    return handleApiError(error, res, {
      endpoint: "/api/generate-idea",
      duration,
    });
  }
}
