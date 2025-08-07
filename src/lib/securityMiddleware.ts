import { NextApiRequest, NextApiResponse } from "next";
import { applyCSRFProtection } from "./csrf";
import {
  applyApiRateLimit,
  setRateLimitHeaders,
  createRateLimitError,
} from "./rateLimit";
import logger from "./logger";

export interface SecurityMiddlewareOptions {
  enableCSRF?: boolean;
  enableRateLimit?: boolean;
  rateLimitType?: "api" | "search" | "crawl";
  allowedMethods?: string[];
  requireAuth?: boolean;
}

export interface SecurityCheckResult {
  success: boolean;
  error?: {
    status: number;
    message: string;
    code?: string;
  };
}

/**
 * Comprehensive security middleware for API endpoints
 */
export function applySecurityMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  options: SecurityMiddlewareOptions = {},
): SecurityCheckResult {
  const {
    enableCSRF = false, // Disabled by default for compatibility
    enableRateLimit = true,
    rateLimitType = "api",
    allowedMethods = ["GET", "POST"],
    requireAuth = false,
  } = options;

  try {
    // Method validation
    if (!allowedMethods.includes(req.method || "")) {
      return {
        success: false,
        error: {
          status: 405,
          message: `Method ${req.method} not allowed`,
          code: "METHOD_NOT_ALLOWED",
        },
      };
    }

    // Rate limiting
    if (enableRateLimit) {
      let rateLimitResult;

      switch (rateLimitType) {
        case "search":
          const { applySearchRateLimit } = require("./rateLimit");
          rateLimitResult = applySearchRateLimit(req);
          break;
        case "crawl":
          const { applyCrawlRateLimit } = require("./rateLimit");
          rateLimitResult = applyCrawlRateLimit(req);
          break;
        default:
          rateLimitResult = applyApiRateLimit(req);
      }

      setRateLimitHeaders(res.setHeader.bind(res), rateLimitResult);

      if (!rateLimitResult.success) {
        return {
          success: false,
          error: {
            status: 429,
            message: rateLimitResult.error || "Rate limit exceeded",
            code: "RATE_LIMIT_EXCEEDED",
          },
        };
      }
    }

    // CSRF protection (for state-changing operations)
    if (enableCSRF && req.method !== "GET") {
      const csrfResult = applyCSRFProtection(req, res);
      if (!csrfResult) {
        return {
          success: false,
          error: {
            status: 403,
            message: "CSRF token validation failed",
            code: "CSRF_TOKEN_INVALID",
          },
        };
      }
    }

    // Authentication check (if required)
    if (requireAuth) {
      // Placeholder for authentication logic
      // In a real implementation, you would check for valid JWT tokens, API keys, etc.
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return {
          success: false,
          error: {
            status: 401,
            message: "Authentication required",
            code: "UNAUTHORIZED",
          },
        };
      }
    }

    // Log security-relevant request
    logger.info("Security middleware passed", {
      method: req.method,
      pathname: req.url,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
      enabledFeatures: {
        csrf: enableCSRF,
        rateLimit: enableRateLimit,
        auth: requireAuth,
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error("Security middleware error", {
      error: error.message,
      pathname: req.url,
    });

    return {
      success: false,
      error: {
        status: 500,
        message: "Internal security error",
        code: "SECURITY_ERROR",
      },
    };
  }
}

/**
 * Enhanced API response with security headers
 */
export function secureApiResponse<T>(
  res: NextApiResponse,
  statusCode: number,
  data: T,
  headers: Record<string, string> = {},
): void {
  // Add security headers to API responses
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Add any additional headers
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.status(statusCode).json(data);
}

/**
 * Helper to handle security middleware errors
 */
export function handleSecurityError(
  res: NextApiResponse,
  error: SecurityCheckResult["error"],
): void {
  if (!error) {
    return;
  }

  secureApiResponse(res, error.status, {
    error: error.code || "SECURITY_ERROR",
    message: error.message,
    timestamp: new Date().toISOString(),
  });
}
