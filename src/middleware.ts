import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname, searchParams } = request.nextUrl;
  
  // Log incoming requests
  logger.info("Incoming request", {
    method: request.method,
    pathname,
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    timestamp: new Date().toISOString(),
  });

  // Rate limiting for API routes (simple implementation)
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    
    // In a production environment, you'd want to use a proper rate limiter like Redis
    // This is a simple demonstration
    const rateLimitKey = `rate_limit_${ip}`;
    
    // For now, just log the rate limiting attempt
    logger.info("API request", {
      pathname,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  // Security headers
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // CORS for API routes
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGINS || "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  // Log response time
  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - Next.js internals
     * - Static files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};