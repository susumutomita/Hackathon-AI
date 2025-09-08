import { NextApiRequest, NextApiResponse } from "next";
import { crawlEthGlobalShowcase } from "@/lib/crawler";
import {
  handleApiError,
  validateMethod,
  createError,
  ErrorType,
} from "@/lib/errorHandler";
import logger from "@/lib/logger";

// Ensure Node.js runtime on Vercel/Next
export const config = {
  runtime: "nodejs",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const startTime = Date.now();

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Check if method is GET
  if (req.method !== "GET") {
    res.status(405).json({
      error: "Method Not Allowed",
      message: "Only GET method is allowed",
    });
    return;
  }

  try {
    // Check environment restriction
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === "production") {
      throw createError(
        ErrorType.AUTHORIZATION_ERROR,
        "Crawling API is disabled in production environment",
        { environment: process.env.NEXT_PUBLIC_ENVIRONMENT },
        ["この機能は本番環境では無効化されています"],
      );
    }

    logger.info("Crawl request started", {
      userAgent: req.headers["user-agent"],
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    });

    const projects = await crawlEthGlobalShowcase();

    const duration = Date.now() - startTime;
    logger.performanceLog("Crawl completed", duration, {
      projectsFound: projects?.length || 0,
    });

    res.status(200).json({
      message: "クローリングが正常に完了しました",
      projects,
      metadata: {
        crawlTime: duration,
        projectsFound: projects?.length || 0,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.performanceLog("Crawl failed", duration, {
      error: error.message,
    });

    handleApiError(error, res, {
      endpoint: "/api/crawl",
      duration,
    });
  }
}
