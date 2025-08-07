import { NextApiRequest, NextApiResponse } from "next";
import { getCSRFTokenForClient } from "@/lib/csrf";
import { validateMethod } from "@/lib/errorHandler";
import {
  applyApiRateLimit,
  setRateLimitHeaders,
  createRateLimitError,
} from "@/lib/rateLimit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Only allow GET requests
    validateMethod(req.method, ["GET"]);

    // Apply rate limiting
    const rateLimitResult = applyApiRateLimit(req);
    setRateLimitHeaders(res.setHeader.bind(res), rateLimitResult);

    if (!rateLimitResult.success) {
      return res.status(429).json(createRateLimitError(rateLimitResult));
    }

    // Generate and return CSRF token
    const csrfToken = getCSRFTokenForClient();

    res.status(200).json({
      csrfToken,
      message: "CSRF token generated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to generate CSRF token",
    });
  }
}
