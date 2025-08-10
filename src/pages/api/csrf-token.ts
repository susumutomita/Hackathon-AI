import { NextApiRequest, NextApiResponse } from "next";
import { getCSRFTokenForClient } from "@/lib/csrf";
import { validateMethod } from "@/lib/errorHandler";
import {
  applyApiRateLimit,
  setRateLimitHeaders,
  createRateLimitError,
} from "@/lib/rateLimit";

// Ensure Node.js runtime on Vercel/Next
export const config = {
  runtime: "nodejs",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Check if method is GET
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only GET method is allowed",
    });
  }

  try {
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
