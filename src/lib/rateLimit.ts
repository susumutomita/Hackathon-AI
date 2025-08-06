import { NextApiRequest } from "next";

// In-memory rate limiter (for development/demo purposes)
// In production, use Redis or a proper distributed cache
class InMemoryRateLimit {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requestInfo = this.requests.get(identifier);

    // Clean up expired entries periodically
    this.cleanup(now);

    if (!requestInfo || now >= requestInfo.resetTime) {
      // First request or window has reset
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (requestInfo.count >= this.maxRequests) {
      return false;
    }

    requestInfo.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const requestInfo = this.requests.get(identifier);
    if (!requestInfo || Date.now() >= requestInfo.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - requestInfo.count);
  }

  getResetTime(identifier: string): number {
    const requestInfo = this.requests.get(identifier);
    if (!requestInfo || Date.now() >= requestInfo.resetTime) {
      return Date.now() + this.windowMs;
    }
    return requestInfo.resetTime;
  }

  private cleanup(now: number) {
    // Clean up expired entries every 100 requests
    if (this.requests.size % 100 === 0) {
      for (const [key, value] of this.requests.entries()) {
        if (now >= value.resetTime) {
          this.requests.delete(key);
        }
      }
    }
  }
}

// Rate limiter instances
const apiRateLimit = new InMemoryRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
const searchRateLimit = new InMemoryRateLimit(60 * 1000, 10); // 10 requests per minute
const crawlRateLimit = new InMemoryRateLimit(5 * 60 * 1000, 5); // 5 requests per 5 minutes

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  error?: string;
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: NextApiRequest): string {
  // Use IP address as identifier
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded ? forwarded.toString().split(",")[0] : req.socket.remoteAddress;
  return ip || "unknown";
}

/**
 * Generic rate limiting middleware
 */
export function applyRateLimit(
  req: NextApiRequest,
  limiter: InMemoryRateLimit,
  limitType: string
): RateLimitResult {
  const identifier = getClientIdentifier(req);
  const isAllowed = limiter.isAllowed(identifier);
  const remaining = limiter.getRemainingRequests(identifier);
  const resetTime = limiter.getResetTime(identifier);
  const limit = limiter instanceof InMemoryRateLimit ? 
    (limiter as any).maxRequests : 0;

  if (!isAllowed) {
    return {
      success: false,
      limit,
      remaining,
      resetTime,
      error: `Rate limit exceeded for ${limitType}. Try again later.`,
    };
  }

  return {
    success: true,
    limit,
    remaining,
    resetTime,
  };
}

/**
 * Rate limit for general API endpoints
 */
export function applyApiRateLimit(req: NextApiRequest): RateLimitResult {
  return applyRateLimit(req, apiRateLimit, "API");
}

/**
 * Rate limit for search endpoints
 */
export function applySearchRateLimit(req: NextApiRequest): RateLimitResult {
  return applyRateLimit(req, searchRateLimit, "search");
}

/**
 * Rate limit for crawl endpoints
 */
export function applyCrawlRateLimit(req: NextApiRequest): RateLimitResult {
  return applyRateLimit(req, crawlRateLimit, "crawl");
}

/**
 * Set rate limit headers in response
 */
export function setRateLimitHeaders(
  headers: any,
  result: RateLimitResult
): void {
  headers["X-RateLimit-Limit"] = result.limit.toString();
  headers["X-RateLimit-Remaining"] = result.remaining.toString();
  headers["X-RateLimit-Reset"] = Math.ceil(result.resetTime / 1000).toString();
}

/**
 * Rate limit error response
 */
export function createRateLimitError(result: RateLimitResult) {
  return {
    error: "Rate limit exceeded",
    message: result.error || "Too many requests",
    retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    limit: result.limit,
    remaining: result.remaining,
  };
}