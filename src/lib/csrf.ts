import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_SECRET = process.env.CSRF_SECRET || "hackathon-ai-csrf-secret";

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Create HMAC signature for CSRF token
 */
function createTokenSignature(token: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

/**
 * Create a signed CSRF token
 */
export function createCSRFToken(): string {
  const token = generateCSRFToken();
  const signature = createTokenSignature(token, CSRF_SECRET);
  return `${token}.${signature}`;
}

/**
 * Validate CSRF token signature
 */
export function validateCSRFToken(signedToken: string): boolean {
  if (!signedToken || typeof signedToken !== "string") {
    return false;
  }

  const [token, signature] = signedToken.split(".");

  if (!token || !signature) {
    return false;
  }

  const expectedSignature = createTokenSignature(token, CSRF_SECRET);

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    );
  } catch {
    return false;
  }
}

/**
 * Extract CSRF token from request
 */
function getCSRFTokenFromRequest(req: NextApiRequest): string | null {
  // Check header first (recommended)
  const headerToken = req.headers["x-csrf-token"];
  if (headerToken && typeof headerToken === "string") {
    return headerToken;
  }

  // Check body as fallback
  const bodyToken = req.body?.csrfToken;
  if (bodyToken && typeof bodyToken === "string") {
    return bodyToken;
  }

  return null;
}

/**
 * CSRF protection middleware for API routes
 */
export function applyCSRFProtection(
  req: NextApiRequest,
  res: NextApiResponse,
): boolean {
  // Skip CSRF protection for GET requests (they should be idempotent)
  if (req.method === "GET") {
    return true;
  }

  // Skip for development environment (optional)
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DISABLE_CSRF === "true"
  ) {
    return true;
  }

  const token = getCSRFTokenFromRequest(req);

  if (!token) {
    res.status(403).json({
      error: "CSRF token missing",
      message: "CSRF token is required for this request",
    });
    return false;
  }

  if (!validateCSRFToken(token)) {
    res.status(403).json({
      error: "Invalid CSRF token",
      message: "CSRF token is invalid or expired",
    });
    return false;
  }

  return true;
}

/**
 * Add CSRF token to response headers
 */
export function setCSRFTokenHeader(res: NextApiResponse): void {
  const token = createCSRFToken();
  res.setHeader("X-CSRF-Token", token);
}

/**
 * Get CSRF token for client-side usage
 * This endpoint can be called to get a fresh CSRF token
 */
export function getCSRFTokenForClient(): string {
  return createCSRFToken();
}
