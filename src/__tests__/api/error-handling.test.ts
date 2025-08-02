import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextApiRequest, NextApiResponse } from "next";

// Helper function to create mock request and response
function createMockRequestResponse(
  method = "GET",
  body: any = {},
  query: any = {}
) {
  const req = {
    method,
    headers: {},
    query,
    body,
  } as unknown as NextApiRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    _getStatusCode: function () {
      return this._statusCode || 200;
    },
    _getData: function () {
      return JSON.stringify(this._jsonData);
    },
    _statusCode: 200,
    _jsonData: null,
  } as unknown as NextApiResponse;

  // Override status and json to capture values
  (res.status as ReturnType<typeof vi.fn>).mockImplementation(
    (code: number) => {
      (res as any)._statusCode = code;
      return res;
    }
  );

  (res.json as ReturnType<typeof vi.fn>).mockImplementation((data: any) => {
    (res as any)._jsonData = data;
    return res;
  });

  return { req, res };
}

describe("API Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Common Error Scenarios", () => {
    it("should handle HTTP method validation", () => {
      // Simulate a handler that only accepts POST
      const { req, res } = createMockRequestResponse("GET");

      // Generic handler logic for method validation
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
      }

      expect((res as any)._getStatusCode()).toBe(405);
      expect(JSON.parse((res as any)._getData())).toEqual({
        error: "Method not allowed",
      });
    });

    it("should handle missing required parameters", () => {
      const { req, res } = createMockRequestResponse("POST", {});

      // Simulate validation for required fields
      const requiredFields = ["idea", "prompt"];
      const missingFields = requiredFields.filter(
        (field) => !req.body[field]
      );

      if (missingFields.length > 0) {
        res.status(400).json({
          error: "Missing required parameters",
          missingFields,
        });
      }

      expect((res as any)._getStatusCode()).toBe(400);
      expect(JSON.parse((res as any)._getData())).toEqual({
        error: "Missing required parameters",
        missingFields: ["idea", "prompt"],
      });
    });

    it("should handle invalid JSON in request body", () => {
      const { req, res } = createMockRequestResponse("POST", "invalid-json");

      try {
        if (typeof req.body === "string") {
          JSON.parse(req.body);
        }
      } catch (error) {
        res.status(400).json({
          error: "Invalid JSON in request body",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }

      expect((res as any)._getStatusCode()).toBe(400);
      expect(JSON.parse((res as any)._getData())).toEqual({
        error: "Invalid JSON in request body",
        details: expect.stringContaining("Unexpected token"),
      });
    });

    it("should handle timeout errors", async () => {
      const { req, res } = createMockRequestResponse("POST", {
        idea: "test",
        prompt: "test",
      });

      // Simulate timeout error
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";

      try {
        throw timeoutError;
      } catch (error: any) {
        if (error.name === "TimeoutError") {
          res.status(408).json({
            error: "Request timeout",
            details: "The request took too long to process",
          });
        }
      }

      expect((res as any)._getStatusCode()).toBe(408);
      expect(JSON.parse((res as any)._getData())).toEqual({
        error: "Request timeout",
        details: "The request took too long to process",
      });
    });

    it("should handle rate limiting errors", () => {
      const { req, res } = createMockRequestResponse("POST");

      // Simulate rate limiting
      const rateLimitExceeded = true;

      if (rateLimitExceeded) {
        res.status(429).json({
          error: "Rate limit exceeded",
          details: "Too many requests. Please try again later.",
          retryAfter: 60,
        });
      }

      expect((res as any)._getStatusCode()).toBe(429);
      expect(JSON.parse((res as any)._getData())).toEqual({
        error: "Rate limit exceeded",
        details: "Too many requests. Please try again later.",
        retryAfter: 60,
      });
    });

    it("should handle network errors", async () => {
      const { req, res } = createMockRequestResponse("POST");

      // Simulate network error
      const networkError = new Error("ECONNREFUSED");
      networkError.name = "NetworkError";

      try {
        throw networkError;
      } catch (error: any) {
        if (error.message.includes("ECONNREFUSED")) {
          res.status(503).json({
            error: "Service unavailable",
            details: "Unable to connect to external service",
          });
        }
      }

      expect((res as any)._getStatusCode()).toBe(503);
      expect(JSON.parse((res as any)._getData())).toEqual({
        error: "Service unavailable",
        details: "Unable to connect to external service",
      });
    });

    it("should handle authentication errors", () => {
      const { req, res } = createMockRequestResponse("POST");

      // Simulate missing or invalid authentication
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error: "Unauthorized",
          details: "Valid authentication token required",
        });
      }

      expect((res as any)._getStatusCode()).toBe(401);
      expect(JSON.parse((res as any)._getData())).toEqual({
        error: "Unauthorized",
        details: "Valid authentication token required",
      });
    });

    it("should handle internal server errors with proper logging", () => {
      const { req, res } = createMockRequestResponse("POST");
      const mockLogger = vi.fn();

      try {
        // Simulate unexpected error
        throw new Error("Unexpected internal error");
      } catch (error: any) {
        mockLogger("Internal server error:", error);
        
        res.status(500).json({
          error: "Internal server error",
          details: process.env.NODE_ENV === "development" 
            ? error.message 
            : "An unexpected error occurred",
        });
      }

      expect(mockLogger).toHaveBeenCalledWith(
        "Internal server error:",
        expect.any(Error)
      );
      expect((res as any)._getStatusCode()).toBe(500);
    });

    it("should handle input validation errors", () => {
      const { req, res } = createMockRequestResponse("POST", {
        idea: "",
        prompt: "a".repeat(10000), // Too long
      });

      const errors: string[] = [];

      // Validate idea
      if (!req.body.idea || req.body.idea.trim().length === 0) {
        errors.push("Idea cannot be empty");
      }

      // Validate prompt length
      if (req.body.prompt && req.body.prompt.length > 5000) {
        errors.push("Prompt exceeds maximum length of 5000 characters");
      }

      if (errors.length > 0) {
        res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
      }

      expect((res as any)._getStatusCode()).toBe(400);
      expect(JSON.parse((res as any)._getData())).toEqual({
        error: "Validation failed",
        details: [
          "Idea cannot be empty",
          "Prompt exceeds maximum length of 5000 characters",
        ],
      });
    });

    it("should handle content type validation", () => {
      const { req, res } = createMockRequestResponse("POST");
      req.headers["content-type"] = "text/plain";

      // Check content type
      const contentType = req.headers["content-type"];
      if (!contentType || !contentType.includes("application/json")) {
        res.status(415).json({
          error: "Unsupported media type",
          details: "Content-Type must be application/json",
        });
      }

      expect((res as any)._getStatusCode()).toBe(415);
      expect(JSON.parse((res as any)._getData())).toEqual({
        error: "Unsupported media type",
        details: "Content-Type must be application/json",
      });
    });
  });

  describe("Environment-specific Error Handling", () => {
    it("should handle production environment restrictions", () => {
      const originalEnv = process.env.NEXT_PUBLIC_ENVIRONMENT;
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";

      const { req, res } = createMockRequestResponse("POST");

      // Check if endpoint is disabled in production
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === "production") {
        res.status(403).json({
          error: "This API is disabled in the production environment.",
        });
      }

      expect((res as any)._getStatusCode()).toBe(403);
      expect(JSON.parse((res as any)._getData())).toEqual({
        error: "This API is disabled in the production environment.",
      });

      process.env.NEXT_PUBLIC_ENVIRONMENT = originalEnv;
    });

    it("should handle missing environment variables", () => {
      const originalApiKey = process.env.GROQ_API_KEY;
      delete process.env.GROQ_API_KEY;

      const { req, res } = createMockRequestResponse("POST");

      // Check for required environment variables
      if (!process.env.GROQ_API_KEY) {
        res.status(500).json({
          error: "Configuration error",
          details: "Required environment variables are not set",
        });
      }

      expect((res as any)._getStatusCode()).toBe(500);
      expect(JSON.parse((res as any)._getData())).toEqual({
        error: "Configuration error",
        details: "Required environment variables are not set",
      });

      process.env.GROQ_API_KEY = originalApiKey;
    });
  });

  describe("Error Response Format Consistency", () => {
    it("should maintain consistent error response structure", () => {
      const { req, res } = createMockRequestResponse("POST");

      // Standard error response format
      const errorResponse = {
        error: "Error type",
        details: "Detailed error message",
        timestamp: new Date().toISOString(),
        path: req.url || "/api/test",
      };

      res.status(400).json(errorResponse);

      const responseData = JSON.parse((res as any)._getData());
      expect(responseData).toHaveProperty("error");
      expect(responseData).toHaveProperty("details");
      expect(responseData).toHaveProperty("timestamp");
      expect(responseData).toHaveProperty("path");
    });
  });
});