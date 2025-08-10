import { NextApiRequest, NextApiResponse } from "next";
import { checkAndUpdateEvents } from "@/lib/eventUpdater";
import { crawlEthGlobalShowcase } from "@/lib/crawler";
import {
  handleApiError,
  validateMethod,
  createAuthenticationError,
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
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Check if method is POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST method is allowed",
    });
  }

  try {
    // セキュリティ: GitHub Actionsからのアクセスのみ許可
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.CRON_SECRET;

    // CRON_SECRETが設定されている場合のみ認証チェック
    if (expectedToken) {
      if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        throw createAuthenticationError(
          "Invalid or missing authorization token",
          ["有効な認証トークンが必要です"],
        );
      }
    }

    logger.info("Auto crawl request started", {
      userAgent: req.headers["user-agent"],
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    });

    // Step 1: 最新のイベントを取得して更新
    logger.info("Starting events update phase");
    const updateResult = await checkAndUpdateEvents();

    if (!updateResult.success) {
      throw createError(
        ErrorType.EXTERNAL_SERVICE_ERROR,
        updateResult.error || "Failed to update events",
        { updateResult },
        ["イベント情報の更新に失敗しました"],
      );
    }

    logger.info("Events update completed", {
      eventsAdded: updateResult.added,
      totalEvents: updateResult.total,
    });

    // Step 2: 有効化されているイベントをクロール
    logger.info("Starting crawl phase");
    const projects = await crawlEthGlobalShowcase();

    const duration = Date.now() - startTime;
    logger.performanceLog("Auto crawl completed successfully", duration, {
      eventsAdded: updateResult.added,
      totalEvents: updateResult.total,
      projectsCrawled: projects?.length || 0,
    });

    res.status(200).json({
      message: "自動クローリングが正常に完了しました",
      eventsUpdate: {
        added: updateResult.added,
        total: updateResult.total,
      },
      crawlResult: {
        projectsCount: projects?.length || 0,
      },
      metadata: {
        totalProcessingTime: duration,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.performanceLog("Auto crawl failed", duration, {
      error: error.message,
    });

    handleApiError(error, res, {
      endpoint: "/api/auto-crawl",
      duration,
    });
  }
}
