import { NextApiRequest, NextApiResponse } from "next";
import { checkAndUpdateEvents } from "@/lib/eventUpdater";
import { 
  handleApiError, 
  validateMethod,
  createAuthenticationError,
  createError,
  ErrorType,
} from "@/lib/errorHandler";
import logger from "@/lib/logger";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const startTime = Date.now();

  try {
    // Validate HTTP method
    validateMethod(req.method, ["POST"]);

    // セキュリティ: GitHub Actionsからのアクセスのみ許可
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      throw createError(
        ErrorType.CONFIGURATION_ERROR,
        "CRON_SECRET environment variable is not configured",
        { missingEnvVar: "CRON_SECRET" },
        ["管理者にお問い合わせください"]
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      throw createAuthenticationError(
        "Invalid or missing authorization token",
        ["有効な認証トークンが必要です"]
      );
    }

    logger.info("Update events request started", {
      userAgent: req.headers["user-agent"],
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    });

    const result = await checkAndUpdateEvents();

    const duration = Date.now() - startTime;

    if (result.success) {
      logger.performanceLog("Update events completed successfully", duration, {
        eventsAdded: result.added,
        totalEvents: result.total,
      });

      res.status(200).json({
        message: "イベントが正常に更新されました",
        added: result.added,
        total: result.total,
        metadata: {
          updateTime: duration,
        },
      });
    } else {
      logger.error("Update events failed", {
        error: result.error,
        duration,
      });

      throw createError(
        ErrorType.EXTERNAL_SERVICE_ERROR,
        result.error || "Failed to update events",
        { result },
        ["しばらく待ってから再度お試しください"]
      );
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.performanceLog("Update events failed", duration, {
      error: error.message,
    });

    handleApiError(error, res, { 
      endpoint: "/api/update-events",
      duration,
    });
  }
}
