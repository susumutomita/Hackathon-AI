import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import { QdrantHandler } from "../qdrantClient";

// Export type guard functions for testing
const isHttpError = (error: unknown): error is any => {
  return (
    error !== null &&
    typeof error === "object" &&
    "response" in error &&
    (error as any).response !== null &&
    typeof (error as any).response === "object" &&
    "status" in (error as any).response
  );
};

const isOllamaError = (error: unknown): error is any => {
  return (
    error !== null &&
    typeof error === "object" &&
    ("message" in error || "code" in error)
  );
};

const isGeneralError = (error: unknown): error is any => {
  return error !== null && typeof error === "object";
};

describe("QdrantHandler Error Handling Tests", () => {
  let qdrantHandler: QdrantHandler;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    qdrantHandler = new QdrantHandler();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("sanitizeErrorMessage", () => {
    test("should not sanitize in development environment", () => {
      process.env.NODE_ENV = "development";
      const handler = new QdrantHandler();
      const message =
        "Error at https://api.example.com/endpoint with API key abc123defgh";
      // Access private method through reflection for testing
      const sanitized = (handler as any).sanitizeErrorMessage(message);
      expect(sanitized).toBe(message);
    });

    test("should sanitize URLs in production", () => {
      process.env.NODE_ENV = "production";
      const handler = new QdrantHandler();
      const message = "Failed to connect to https://api.nomic.ai/v1/embedding";
      const sanitized = (handler as any).sanitizeErrorMessage(message);
      expect(sanitized).toBe("Failed to connect to [URL_REDACTED]");
    });

    test("should sanitize localhost references in production", () => {
      process.env.NODE_ENV = "production";
      const handler = new QdrantHandler();
      const message = "Cannot connect to localhost:11434";
      const sanitized = (handler as any).sanitizeErrorMessage(message);
      expect(sanitized).toBe("Cannot connect to [LOCAL_SERVICE]");
    });

    test("should sanitize model names in production", () => {
      process.env.NODE_ENV = "production";
      const handler = new QdrantHandler();
      const message = "Model nomic-embed-text-v1 not found";
      const sanitized = (handler as any).sanitizeErrorMessage(message);
      expect(sanitized).toBe("Model [MODEL] not found");
    });

    test("should sanitize service names in production", () => {
      process.env.NODE_ENV = "production";
      const handler = new QdrantHandler();
      const message = "Ollama service failed, Qdrant is down, Nomic API error";
      const sanitized = (handler as any).sanitizeErrorMessage(message);
      expect(sanitized).toBe(
        "[SERVICE] service failed, [SERVICE] is down, [SERVICE] API error",
      );
    });

    test("should sanitize file paths in production", () => {
      process.env.NODE_ENV = "production";
      const handler = new QdrantHandler();
      const message = "Error reading /usr/local/config/api.key";
      const sanitized = (handler as any).sanitizeErrorMessage(message);
      expect(sanitized).toBe("Error reading [PATH]");
    });

    test("should sanitize potential API keys in production", () => {
      process.env.NODE_ENV = "production";
      const handler = new QdrantHandler();
      const message =
        "Invalid API key: sk-1234567890abcdefghijklmnopqrstuvwxyz";
      const sanitized = (handler as any).sanitizeErrorMessage(message);
      expect(sanitized).toBe("Invalid API key: [REDACTED]");
    });
  });

  describe("formatHttpError", () => {
    test("should format 403 forbidden error", () => {
      const formatted = (qdrantHandler as any).formatHttpError(
        403,
        "invalid API key",
      );
      expect(formatted).toBe("403: authentication failed - invalid API key");
    });

    test("should format 401 unauthorized error", () => {
      const formatted = (qdrantHandler as any).formatHttpError(
        401,
        "token expired",
      );
      expect(formatted).toBe("401: unauthorized - token expired");
    });

    test("should format 429 rate limit error", () => {
      const formatted = (qdrantHandler as any).formatHttpError(
        429,
        "too many requests",
      );
      expect(formatted).toBe("429: rate limit exceeded - too many requests");
    });

    test("should format generic error with status code", () => {
      const formatted = (qdrantHandler as any).formatHttpError(
        500,
        "internal server error",
      );
      expect(formatted).toBe("500: internal server error");
    });

    test("should format 404 not found error", () => {
      const formatted = (qdrantHandler as any).formatHttpError(
        404,
        "resource not found",
      );
      expect(formatted).toBe("404: resource not found");
    });
  });

  describe("formatError", () => {
    test("should format HTTP error with response data", () => {
      const error = {
        response: {
          status: 403,
          data: { error: "Invalid API key" },
        },
      };
      const formatted = (qdrantHandler as any).formatError(error, "Test");
      expect(formatted).toContain("Test failed:");
      expect(formatted).toContain("403");
      expect(formatted).toContain("authentication failed");
    });

    test("should format HTTP error with message field", () => {
      const error = {
        response: {
          status: 500,
          data: { message: "Server error occurred" },
        },
      };
      const formatted = (qdrantHandler as any).formatError(error, "API");
      expect(formatted).toContain("API failed:");
      expect(formatted).toContain("500");
      expect(formatted).toContain("Server error occurred");
    });

    test("should handle Ollama connection refused error in development", () => {
      process.env.NODE_ENV = "development";
      process.env.OLLAMA_URL = "http://localhost:11434";
      process.env.OLLAMA_MODEL = "test-model";
      const handler = new QdrantHandler();

      const error = {
        message: "connection refused",
        code: "ECONNREFUSED",
      };
      const formatted = (handler as any).formatError(error, "Ollama");
      expect(formatted).toContain("Ollama failed:");
      expect(formatted).toContain("http://localhost:11434");
      expect(formatted).toContain("ollama serve");
      expect(formatted).toContain("ollama pull test-model");
    });

    test("should handle Ollama connection refused error in production", () => {
      process.env.NODE_ENV = "production";
      const handler = new QdrantHandler();

      const error = {
        message: "connection refused",
        code: "ECONNREFUSED",
      };
      const formatted = (handler as any).formatError(error, "Ollama");
      expect(formatted).toBe(
        "Ollama failed: Service is not available. Please contact support.",
      );
    });

    test("should handle configuration error in development", () => {
      process.env.NODE_ENV = "development";
      const handler = new QdrantHandler();

      const error = {
        message: "NOMIC_API_KEY environment variable is not set",
      };
      const formatted = (handler as any).formatError(error, "Config");
      expect(formatted).toContain("Config failed:");
      expect(formatted).toContain("Configuration error");
      expect(formatted).toContain("environment variable");
    });

    test("should handle configuration error in production", () => {
      process.env.NODE_ENV = "production";
      const handler = new QdrantHandler();

      const error = {
        message: "NOMIC_API_KEY environment variable is not set",
      };
      const formatted = (handler as any).formatError(error, "Config");
      expect(formatted).toBe(
        "Config failed: Configuration error. Please contact support.",
      );
    });

    test("should handle general error with message", () => {
      const error = {
        message: "Something went wrong",
      };
      const formatted = (qdrantHandler as any).formatError(error, "Operation");
      expect(formatted).toContain("Operation failed:");
      expect(formatted).toContain("Something went wrong");
    });

    test("should handle unknown error in development", () => {
      process.env.NODE_ENV = "development";
      const handler = new QdrantHandler();

      const formatted = (handler as any).formatError("string error", "Test");
      expect(formatted).toBe("Test failed: Unknown error");
    });

    test("should handle unknown error in production", () => {
      process.env.NODE_ENV = "production";
      const handler = new QdrantHandler();

      const formatted = (handler as any).formatError("string error", "Test");
      expect(formatted).toBe("Test failed: An error occurred");
    });
  });

  describe("isProduction", () => {
    test("should return true when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production";
      const handler = new QdrantHandler();
      expect((handler as any).isProduction()).toBe(true);
    });

    test("should return false when NODE_ENV is development", () => {
      process.env.NODE_ENV = "development";
      const handler = new QdrantHandler();
      expect((handler as any).isProduction()).toBe(false);
    });

    test("should return false when NODE_ENV is not set", () => {
      delete process.env.NODE_ENV;
      const handler = new QdrantHandler();
      expect((handler as any).isProduction()).toBe(false);
    });

    test("should return false when NODE_ENV is test", () => {
      process.env.NODE_ENV = "test";
      const handler = new QdrantHandler();
      expect((handler as any).isProduction()).toBe(false);
    });
  });
});

describe("Type Guard Functions", () => {
  describe("isHttpError", () => {
    test("should return true for valid HTTP error object", () => {
      const error = {
        response: {
          status: 404,
          statusText: "Not Found",
          data: { error: "Resource not found" },
        },
        message: "Request failed",
      };
      expect(isHttpError(error)).toBe(true);
    });

    test("should return true for minimal HTTP error object", () => {
      const error = {
        response: {
          status: 500,
        },
      };
      expect(isHttpError(error)).toBe(true);
    });

    test("should return false for null", () => {
      expect(isHttpError(null)).toBe(false);
    });

    test("should return false for undefined", () => {
      expect(isHttpError(undefined)).toBe(false);
    });

    test("should return false for non-object types", () => {
      expect(isHttpError("error")).toBe(false);
      expect(isHttpError(123)).toBe(false);
      expect(isHttpError(true)).toBe(false);
    });

    test("should return false for object without response", () => {
      const error = { message: "Error" };
      expect(isHttpError(error)).toBe(false);
    });

    test("should return false for object with null response", () => {
      const error = { response: null };
      expect(isHttpError(error)).toBe(false);
    });

    test("should return false for object with response without status", () => {
      const error = { response: { data: "error" } };
      expect(isHttpError(error)).toBe(false);
    });
  });

  describe("isOllamaError", () => {
    test("should return true for error with message", () => {
      const error = { message: "Connection refused" };
      expect(isOllamaError(error)).toBe(true);
    });

    test("should return true for error with code", () => {
      const error = { code: "ECONNREFUSED" };
      expect(isOllamaError(error)).toBe(true);
    });

    test("should return true for error with both message and code", () => {
      const error = { message: "Connection refused", code: "ECONNREFUSED" };
      expect(isOllamaError(error)).toBe(true);
    });

    test("should return false for null", () => {
      expect(isOllamaError(null)).toBe(false);
    });

    test("should return false for undefined", () => {
      expect(isOllamaError(undefined)).toBe(false);
    });

    test("should return false for non-object types", () => {
      expect(isOllamaError("error")).toBe(false);
      expect(isOllamaError(123)).toBe(false);
      expect(isOllamaError(false)).toBe(false);
    });

    test("should return false for empty object", () => {
      expect(isOllamaError({})).toBe(false);
    });

    test("should return false for object with other properties", () => {
      const error = { status: 500, data: "error" };
      expect(isOllamaError(error)).toBe(false);
    });
  });

  describe("isGeneralError", () => {
    test("should return true for any object", () => {
      expect(isGeneralError({})).toBe(true);
      expect(isGeneralError({ message: "error" })).toBe(true);
      expect(isGeneralError({ foo: "bar" })).toBe(true);
      expect(isGeneralError(new Error("test"))).toBe(true);
    });

    test("should return false for null", () => {
      expect(isGeneralError(null)).toBe(false);
    });

    test("should return false for undefined", () => {
      expect(isGeneralError(undefined)).toBe(false);
    });

    test("should return false for primitive types", () => {
      expect(isGeneralError("string")).toBe(false);
      expect(isGeneralError(123)).toBe(false);
      expect(isGeneralError(true)).toBe(false);
      expect(isGeneralError(Symbol("test"))).toBe(false);
    });

    test("should return true for arrays", () => {
      expect(isGeneralError([])).toBe(true);
      expect(isGeneralError([1, 2, 3])).toBe(true);
    });

    test("should return false for functions", () => {
      expect(isGeneralError(() => {})).toBe(false);
      expect(isGeneralError(function () {})).toBe(false);
    });
  });
});
