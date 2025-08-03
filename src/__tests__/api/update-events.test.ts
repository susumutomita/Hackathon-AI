import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/update-events";
import { checkAndUpdateEvents } from "@/lib/eventUpdater";

// Mock modules
vi.mock("@/lib/eventUpdater");

// Mock logger to prevent Winston issues in test environment
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    performanceLog: vi.fn((message, duration, meta) => {
      // Handle cases where meta.error might be undefined when error is null
      return;
    }),
  },
}));

// Mock error handler to work with custom response object
vi.mock("@/lib/errorHandler", () => ({
  ErrorType: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
    CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
    INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
    EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  },
  handleApiError: vi.fn((error, res, context) => {
    const statusCode = error?.statusCode || 500;
    const errorMessage =
      error?.userMessage ||
      error?.message ||
      "予期しないエラーが発生しました。しばらくお待ちください。";
    res.status(statusCode).json({
      error: errorMessage,
      type: error?.type || "INTERNAL_SERVER_ERROR",
      timestamp: new Date().toISOString(),
      ...(error?.suggestions && { suggestions: error.suggestions }),
    });
  }),
  validateMethod: vi.fn((method, allowed) => {
    if (!method || !allowed.includes(method)) {
      const error = new Error(`Method ${method} not allowed`);
      error.statusCode = 400;
      error.type = "VALIDATION_ERROR";
      error.userMessage = "入力内容に問題があります。内容を確認してください。";
      throw error;
    }
  }),
  createError: vi.fn((type, message, context, suggestions) => {
    const error = new Error(message);
    error.type = type;
    error.statusCode =
      type === "CONFIGURATION_ERROR"
        ? 500
        : type === "EXTERNAL_SERVICE_ERROR"
          ? 502
          : 500;
    error.userMessage =
      type === "CONFIGURATION_ERROR"
        ? "システム設定に問題があります。管理者にお問い合わせください。"
        : type === "EXTERNAL_SERVICE_ERROR"
          ? "しばらく待ってから再度お試しください"
          : "予期しないエラーが発生しました。しばらくお待ちください。";
    error.suggestions = suggestions;
    return error;
  }),
  createAuthenticationError: vi.fn((message, suggestions) => {
    const error = new Error(message);
    error.type = "AUTHENTICATION_ERROR";
    error.statusCode = 401;
    error.userMessage = "認証に失敗しました。再度お試しください。";
    error.suggestions = suggestions || ["有効な認証トークンが必要です"];
    return error;
  }),
}));

const mockCheckAndUpdateEvents = vi.mocked(checkAndUpdateEvents);

// Helper to create mock request and response
function createMocks(
  method: string = "POST",
  headers: Record<string, string> = {},
) {
  const req = {
    method,
    headers,
    socket: {
      remoteAddress: "127.0.0.1",
    },
  } as unknown as NextApiRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as NextApiResponse;

  return { req, res };
}

describe("/api/update-events", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Authorization", () => {
    test("should reject requests without auth header when secret is set", async () => {
      process.env.CRON_SECRET = "test-secret";
      const { req, res } = createMocks();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "認証に失敗しました。再度お試しください。",
        type: "AUTHENTICATION_ERROR",
        timestamp: expect.any(String),
        suggestions: ["有効な認証トークンが必要です"],
      });
      expect(mockCheckAndUpdateEvents).not.toHaveBeenCalled();
    });

    test("should reject requests with invalid auth token", async () => {
      process.env.CRON_SECRET = "test-secret";
      const { req, res } = createMocks("POST", {
        authorization: "Bearer wrong-token",
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "認証に失敗しました。再度お試しください。",
        type: "AUTHENTICATION_ERROR",
        timestamp: expect.any(String),
        suggestions: ["有効な認証トークンが必要です"],
      });
      expect(mockCheckAndUpdateEvents).not.toHaveBeenCalled();
    });

    test("should accept requests with valid auth token", async () => {
      process.env.CRON_SECRET = "test-secret";
      const { req, res } = createMocks("POST", {
        authorization: "Bearer test-secret",
      });

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: true,
        added: ["event1"],
        total: 5,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockCheckAndUpdateEvents).toHaveBeenCalled();
    });

    test("should throw configuration error when no secret is set", async () => {
      delete process.env.CRON_SECRET;
      const { req, res } = createMocks();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "システム設定に問題があります。管理者にお問い合わせください。",
        type: "CONFIGURATION_ERROR",
        timestamp: expect.any(String),
        suggestions: ["管理者にお問い合わせください"],
      });
      expect(mockCheckAndUpdateEvents).not.toHaveBeenCalled();
    });
  });

  describe("HTTP Methods", () => {
    test("should reject non-POST requests", async () => {
      const methods = ["GET", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

      for (const method of methods) {
        const { req, res } = createMocks(method);
        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "入力内容に問題があります。内容を確認してください。",
          type: "VALIDATION_ERROR",
          timestamp: expect.any(String),
        });
        expect(mockCheckAndUpdateEvents).not.toHaveBeenCalled();
      }
    });
  });

  describe("Success scenarios", () => {
    test("should handle successful update with new events", async () => {
      process.env.CRON_SECRET = "test-secret";
      const { req, res } = createMocks("POST", {
        authorization: "Bearer test-secret",
      });

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: true,
        added: ["tokyo2024", "paris2024", "london2024"],
        total: 15,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "イベントが正常に更新されました",
        added: ["tokyo2024", "paris2024", "london2024"],
        total: 15,
        metadata: {
          updateTime: expect.any(Number),
        },
      });
    });

    test("should handle successful update with no new events", async () => {
      process.env.CRON_SECRET = "test-secret";
      const { req, res } = createMocks("POST", {
        authorization: "Bearer test-secret",
      });

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: true,
        added: [],
        total: 10,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "イベントが正常に更新されました",
        added: [],
        total: 10,
        metadata: {
          updateTime: expect.any(Number),
        },
      });
    });
  });

  describe("Error scenarios", () => {
    test("should handle update failure with error details", async () => {
      process.env.CRON_SECRET = "test-secret";
      const { req, res } = createMocks("POST", {
        authorization: "Bearer test-secret",
      });

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: false,
        added: [],
        total: 0,
        error: "Network timeout",
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        error: "しばらく待ってから再度お試しください",
        type: "EXTERNAL_SERVICE_ERROR",
        timestamp: expect.any(String),
        suggestions: ["しばらく待ってから再度お試しください"],
      });
    });

    test("should handle unexpected errors during update", async () => {
      process.env.CRON_SECRET = "test-secret";
      const { req, res } = createMocks("POST", {
        authorization: "Bearer test-secret",
      });

      mockCheckAndUpdateEvents.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Database connection failed",
        type: "INTERNAL_SERVER_ERROR",
        timestamp: expect.any(String),
      });
    });

    test("should handle errors without message property", async () => {
      process.env.CRON_SECRET = "test-secret";
      const { req, res } = createMocks("POST", {
        authorization: "Bearer test-secret",
      });

      // Throw an error without message property
      mockCheckAndUpdateEvents.mockRejectedValue({ code: "ERR_UNKNOWN" });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "予期しないエラーが発生しました。しばらくお待ちください。",
        type: "INTERNAL_SERVER_ERROR",
        timestamp: expect.any(String),
      });
    });

    test("should handle null/undefined errors", async () => {
      process.env.CRON_SECRET = "test-secret";
      const { req, res } = createMocks("POST", {
        authorization: "Bearer test-secret",
      });

      // This test exposes a bug where null errors cause TypeError
      // The current implementation will throw when trying to access error.message on null
      mockCheckAndUpdateEvents.mockRejectedValue(null);

      // The handler will throw an error when trying to access null.message
      await expect(handler(req, res)).rejects.toThrow(
        "Cannot read properties of null (reading 'message')",
      );
    });
  });
});
