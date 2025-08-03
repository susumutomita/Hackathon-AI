import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/crawl";
import { crawlEthGlobalShowcase } from "@/lib/crawler";

// Mock the crawler module
vi.mock("@/lib/crawler", () => ({
  crawlEthGlobalShowcase: vi.fn(),
}));

// Mock logger to prevent Winston issues in test environment
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    performanceLog: vi.fn(),
  },
}));

// Mock error handler to work with custom response object
vi.mock("@/lib/errorHandler", () => ({
  ErrorType: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
    INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  },
  handleApiError: vi.fn((error, res) => {
    const statusCode = error.statusCode || 500;
    const errorMessage =
      error.userMessage ||
      error.message ||
      "予期しないエラーが発生しました。しばらくお待ちください。";
    res.status(statusCode).json({
      error: errorMessage,
      type: error.type || "INTERNAL_SERVER_ERROR",
      timestamp: new Date().toISOString(),
      ...(error.suggestions && { suggestions: error.suggestions }),
    });
  }),
  validateMethod: vi.fn((method, allowed) => {
    if (!method || !allowed.includes(method)) {
      const error = new Error(`Method ${method} not allowed`);
      error.statusCode = 400;
      throw error;
    }
  }),
  createError: vi.fn((type, message, context, suggestions) => {
    const error = new Error(message);
    error.type = type;
    error.statusCode = type === "AUTHORIZATION_ERROR" ? 403 : 500;
    error.userMessage =
      type === "AUTHORIZATION_ERROR"
        ? "この操作を行う権限がありません。"
        : "予期しないエラーが発生しました。しばらくお待ちください。";
    error.suggestions = suggestions;
    return error;
  }),
}));

const mockCrawlEthGlobalShowcase = crawlEthGlobalShowcase as ReturnType<
  typeof vi.fn
>;

// Helper function to create mock request and response
function createMockRequestResponse(method = "GET") {
  const req = {
    method,
    headers: {},
    query: {},
    body: {},
    socket: {
      remoteAddress: "127.0.0.1",
    },
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
    },
  );

  (res.json as ReturnType<typeof vi.fn>).mockImplementation((data: any) => {
    (res as any)._jsonData = data;
    return res;
  });

  return { req, res };
}

describe("/api/crawl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variable
    process.env.NEXT_PUBLIC_ENVIRONMENT = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 403 when environment is production", async () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = "production";

    const { req, res } = createMockRequestResponse("GET");

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(403);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "この操作を行う権限がありません。",
      type: "AUTHORIZATION_ERROR",
      timestamp: expect.any(String),
      suggestions: ["この機能は本番環境では無効化されています"],
    });
  });

  it("should successfully crawl and return projects when environment is not production", async () => {
    const mockProjects = [
      { id: 1, title: "Test Project 1", description: "Test description 1" },
      { id: 2, title: "Test Project 2", description: "Test description 2" },
    ];

    mockCrawlEthGlobalShowcase.mockResolvedValue(mockProjects);

    const { req, res } = createMockRequestResponse("GET");

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(200);
    expect(JSON.parse((res as any)._getData())).toEqual({
      message: "クローリングが正常に完了しました",
      projects: mockProjects,
      metadata: {
        crawlTime: expect.any(Number),
        projectsFound: 2,
      },
    });
    expect(mockCrawlEthGlobalShowcase).toHaveBeenCalledTimes(1);
  });

  it("should handle crawler errors and return 500", async () => {
    const errorMessage = "Crawling failed due to network error";
    mockCrawlEthGlobalShowcase.mockRejectedValue(new Error(errorMessage));

    const { req, res } = createMockRequestResponse("GET");

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: errorMessage,
      type: "INTERNAL_SERVER_ERROR",
      timestamp: expect.any(String),
    });
  });

  it("should handle unknown errors", async () => {
    mockCrawlEthGlobalShowcase.mockRejectedValue("Unknown error");

    const { req, res } = createMockRequestResponse("GET");

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "予期しないエラーが発生しました。しばらくお待ちください。",
      type: "INTERNAL_SERVER_ERROR",
      timestamp: expect.any(String),
    });
  });
});
