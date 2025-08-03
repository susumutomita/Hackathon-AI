import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextApiResponse } from "next";
import {
  ErrorType,
  AppError,
  createError,
  classifyError,
  handleApiError,
  validateRequired,
  validateMethod,
  validateContentType,
  createValidationError,
  createAuthenticationError,
  createTimeoutError,
  createRateLimitError,
} from "@/lib/errorHandler";

// Mock logger
vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Error Handler", () => {
  let mockRes: Partial<NextApiResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("AppError", () => {
    it("should create an AppError with all properties", () => {
      const errorDetails = {
        type: ErrorType.VALIDATION_ERROR,
        message: "Test error",
        userMessage: "User friendly message",
        statusCode: 400,
        context: { field: "test" },
        suggestions: ["Try again"],
      };

      const error = new AppError(errorDetails);

      expect(error.name).toBe("AppError");
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe("Test error");
      expect(error.userMessage).toBe("User friendly message");
      expect(error.statusCode).toBe(400);
      expect(error.context).toEqual({ field: "test" });
      expect(error.suggestions).toEqual(["Try again"]);
    });
  });

  describe("createError", () => {
    it("should create an error with default user message", () => {
      const error = createError(ErrorType.VALIDATION_ERROR, "Test message");

      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe("Test message");
      expect(error.userMessage).toBe("入力内容に問題があります。内容を確認してください。");
      expect(error.statusCode).toBe(400);
    });

    it("should create an error with context and suggestions", () => {
      const context = { field: "email" };
      const suggestions = ["Check email format"];
      const error = createError(ErrorType.VALIDATION_ERROR, "Invalid email", context, suggestions);

      expect(error.context).toEqual(context);
      expect(error.suggestions).toEqual(suggestions);
    });
  });

  describe("classifyError", () => {
    it("should classify network errors", () => {
      const networkError = new Error("ECONNREFUSED");
      expect(classifyError(networkError)).toBe(ErrorType.NETWORK_ERROR);
    });

    it("should classify timeout errors", () => {
      const timeoutError = new Error("Request timeout");
      expect(classifyError(timeoutError)).toBe(ErrorType.TIMEOUT_ERROR);
    });

    it("should classify authentication errors", () => {
      const authError = new Error("authentication failed");
      expect(classifyError(authError)).toBe(ErrorType.AUTHENTICATION_ERROR);
    });

    it("should classify authorization errors", () => {
      const authzError = new Error("403 Forbidden");
      expect(classifyError(authzError)).toBe(ErrorType.AUTHORIZATION_ERROR);
    });

    it("should classify rate limit errors", () => {
      const rateLimitError = new Error("Rate limit exceeded");
      expect(classifyError(rateLimitError)).toBe(ErrorType.RATE_LIMIT_ERROR);
    });

    it("should classify validation errors", () => {
      const validationError = new Error("validation failed");
      expect(classifyError(validationError)).toBe(ErrorType.VALIDATION_ERROR);
    });

    it("should classify configuration errors", () => {
      const configError = new Error("Missing API key");
      expect(classifyError(configError)).toBe(ErrorType.CONFIGURATION_ERROR);
    });

    it("should default to internal server error", () => {
      const unknownError = new Error("Unknown error");
      expect(classifyError(unknownError)).toBe(ErrorType.INTERNAL_SERVER_ERROR);
    });

    it("should handle null/undefined errors", () => {
      expect(classifyError(null)).toBe(ErrorType.INTERNAL_SERVER_ERROR);
      expect(classifyError(undefined)).toBe(ErrorType.INTERNAL_SERVER_ERROR);
    });
  });

  describe("handleApiError", () => {
    it("should handle AppError correctly", () => {
      const appError = createError(ErrorType.VALIDATION_ERROR, "Test error");
      handleApiError(appError, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "入力内容に問題があります。内容を確認してください。",
          type: ErrorType.VALIDATION_ERROR,
          timestamp: expect.any(String),
        })
      );
    });

    it("should handle generic errors", () => {
      const genericError = new Error("Generic error");
      handleApiError(genericError, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "予期しないエラーが発生しました。しばらくお待ちください。",
          type: ErrorType.INTERNAL_SERVER_ERROR,
        })
      );
    });

    it("should include suggestions when available", () => {
      const errorWithSuggestions = createError(
        ErrorType.VALIDATION_ERROR, 
        "Test error", 
        {}, 
        ["Try again", "Check input"]
      );
      handleApiError(errorWithSuggestions, mockRes as NextApiResponse);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestions: ["Try again", "Check input"],
        })
      );
    });

    it("should include development details in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Test error");
      handleApiError(error, mockRes as NextApiResponse, { testContext: "value" });

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            originalMessage: "Test error",
            context: { testContext: "value" },
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Validation functions", () => {
    describe("validateRequired", () => {
      it("should pass validation for valid data", () => {
        const data = { name: "John", email: "john@example.com" };
        expect(() => validateRequired(data, ["name", "email"])).not.toThrow();
      });

      it("should throw error for missing fields", () => {
        const data = { name: "John" };
        expect(() => validateRequired(data, ["name", "email"])).toThrow(AppError);
      });

      it("should throw error for empty string fields", () => {
        const data = { name: "John", email: "" };
        expect(() => validateRequired(data, ["name", "email"])).toThrow(AppError);
      });

      it("should throw error for whitespace-only fields", () => {
        const data = { name: "John", email: "   " };
        expect(() => validateRequired(data, ["name", "email"])).toThrow(AppError);
      });
    });

    describe("validateMethod", () => {
      it("should pass validation for allowed method", () => {
        expect(() => validateMethod("POST", ["GET", "POST"])).not.toThrow();
      });

      it("should throw error for disallowed method", () => {
        expect(() => validateMethod("DELETE", ["GET", "POST"])).toThrow(AppError);
      });

      it("should throw error for undefined method", () => {
        expect(() => validateMethod(undefined, ["GET", "POST"])).toThrow(AppError);
      });
    });

    describe("validateContentType", () => {
      it("should pass validation for correct content type", () => {
        expect(() => validateContentType("application/json")).not.toThrow();
      });

      it("should pass validation for content type with charset", () => {
        expect(() => validateContentType("application/json; charset=utf-8")).not.toThrow();
      });

      it("should throw error for incorrect content type", () => {
        expect(() => validateContentType("text/plain")).toThrow(AppError);
      });

      it("should throw error for undefined content type", () => {
        expect(() => validateContentType(undefined)).toThrow(AppError);
      });
    });
  });

  describe("Convenience error creators", () => {
    describe("createValidationError", () => {
      it("should create validation error with details", () => {
        const error = createValidationError("Invalid input", ["Field A is required"]);
        
        expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
        expect(error.message).toBe("Invalid input");
        expect(error.context).toEqual({ validationErrors: ["Field A is required"] });
        expect(error.suggestions).toEqual(["検証エラー: Field A is required"]);
      });
    });

    describe("createAuthenticationError", () => {
      it("should create authentication error with default suggestions", () => {
        const error = createAuthenticationError("Auth failed");
        
        expect(error.type).toBe(ErrorType.AUTHENTICATION_ERROR);
        expect(error.message).toBe("Auth failed");
        expect(error.suggestions).toEqual([
          "APIキーが正しく設定されているか確認してください",
          "環境変数の設定を確認してください"
        ]);
      });

      it("should create authentication error with custom suggestions", () => {
        const error = createAuthenticationError("Auth failed", ["Custom suggestion"]);
        
        expect(error.suggestions).toEqual(["Custom suggestion"]);
      });
    });

    describe("createTimeoutError", () => {
      it("should create timeout error", () => {
        const error = createTimeoutError("Request timed out");
        
        expect(error.type).toBe(ErrorType.TIMEOUT_ERROR);
        expect(error.message).toBe("Request timed out");
        expect(error.suggestions).toEqual([
          "しばらく待ってから再度お試しください", 
          "ネットワーク接続を確認してください"
        ]);
      });
    });

    describe("createRateLimitError", () => {
      it("should create rate limit error without retry after", () => {
        const error = createRateLimitError();
        
        expect(error.type).toBe(ErrorType.RATE_LIMIT_ERROR);
        expect(error.message).toBe("Rate limit exceeded");
        expect(error.suggestions).toEqual(["しばらく待ってから再度お試しください"]);
      });

      it("should create rate limit error with retry after", () => {
        const error = createRateLimitError(60);
        
        expect(error.context).toEqual({ retryAfter: 60 });
        expect(error.suggestions).toEqual(["60秒後に再度お試しください"]);
      });
    });
  });
});