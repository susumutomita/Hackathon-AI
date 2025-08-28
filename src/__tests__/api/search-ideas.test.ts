import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextApiRequest, NextApiResponse } from "next";

// Mock the QdrantHandler module to prevent actual API calls
let mockCreateEmbedding = vi.fn();
let mockSearchSimilarProjects = vi.fn();
let mockGetCacheStats = vi.fn();

vi.mock("@/lib/qdrantHandler", () => ({
  QdrantHandler: vi.fn(() => ({
    createEmbedding: mockCreateEmbedding,
    searchSimilarProjects: mockSearchSimilarProjects,
    getCacheStats: mockGetCacheStats,
  })),
}));

// Mock QdrantHandlerFactory
const mockQdrantHandler = {
  createEmbedding: vi.fn(),
  searchSimilarProjects: vi.fn(),
  getCacheStats: vi.fn(() => ({ embeddingCacheSize: 0, searchCacheSize: 0 })),
};

vi.mock("@/factories/qdrantHandler.factory", () => ({
  QdrantHandlerFactory: {
    createDefault: vi.fn(() => mockQdrantHandler),
  },
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

// Mock PerformanceMonitor
const mockPerformanceMonitor = {
  recordMetrics: vi.fn(),
  getAverageMetrics: vi.fn().mockReturnValue({
    apiResponseTime: 0,
    vectorSearchTime: 0,
    embeddingTime: 0,
    totalRequestTime: 0,
    cacheHitRate: 0,
  }),
};

vi.mock("@/lib/performance", () => ({
  PerformanceMonitor: {
    getInstance: vi.fn(() => mockPerformanceMonitor),
  },
  timeOperation: vi.fn(async (name, fn) => {
    const result = await fn();
    return { result, duration: 100 };
  }),
}));

// Mock CSRF validation
vi.mock("@/lib/csrf", () => ({
  validateCSRFToken: vi.fn(() => true),
}));

// Mock rate limiting
vi.mock("@/lib/rateLimit", () => ({
  applySearchRateLimit: vi.fn(() => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 3600000,
  })),
  setRateLimitHeaders: vi.fn(),
  createRateLimitError: vi.fn((result) => ({
    error: "Rate limit exceeded",
    retryAfter: result.reset,
  })),
}));

// Mock validation
vi.mock("@/lib/validation", () => ({
  validateInput: vi.fn((schema, data) => {
    if (!data || !data.idea || data.idea.trim() === "") {
      return { success: false, error: "idea is required" };
    }
    return { success: true, data: { idea: data.idea } };
  }),
  sanitizeString: vi.fn((str) => str),
  SearchIdeasRequestSchema: {},
  validateLength: vi.fn(() => true),
}));

// Mock error handler to work with custom response object
vi.mock("@/lib/errorHandler", () => ({
  ErrorType: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
    INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  },
  handleApiError: vi.fn((error, res, options) => {
    // Check if it's an AppError with proper statusCode
    const statusCode =
      error.statusCode || (error.type === "VALIDATION_ERROR" ? 400 : 500);
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
    // Don't throw on valid methods
    if (method && allowed && !allowed.includes(method)) {
      const error = new Error(`Method ${method} not allowed`);
      (error as any).statusCode = 400;
      throw error;
    }
  }),
  validateRequired: vi.fn((data, fields) => {
    // Only throw if actually missing required fields
    const missingFields = fields.filter(
      (field: string) => !data || !data[field],
    );
    if (missingFields.length > 0) {
      const error = new Error(
        `Missing required fields: ${missingFields.join(", ")}`,
      );
      (error as any).statusCode = 400;
      (error as any).type = "VALIDATION_ERROR";
      (error as any).userMessage =
        "入力内容に問題があります。内容を確認してください。";
      (error as any).suggestions = [
        `必須項目を入力してください: ${missingFields.join(", ")}`,
      ];
      throw error;
    }
  }),
  createError: vi.fn((type, message) => {
    const error = new Error(message);
    (error as any).type = type;
    (error as any).statusCode = 500;
    (error as any).userMessage =
      "予期しないエラーが発生しました。しばらくお待ちください。";
    return error;
  }),
  createValidationError: vi.fn((message, details) => {
    const error = new Error(message);
    (error as any).type = "VALIDATION_ERROR";
    (error as any).statusCode = 400;
    (error as any).userMessage =
      "入力内容に問題があります。内容を確認してください。";
    (error as any).suggestions = details || [
      "必須項目を入力してください: idea",
    ];
    return error;
  }),
  createAuthenticationError: vi.fn((message, suggestions) => {
    const error = new Error(message);
    (error as any).type = "AUTHENTICATION_ERROR";
    (error as any).statusCode = 403;
    (error as any).userMessage = "認証に失敗しました。再度お試しください。";
    (error as any).suggestions = suggestions;
    return error;
  }),
  createTimeoutError: vi.fn((message) => {
    const error = new Error(message);
    (error as any).type = "TIMEOUT_ERROR";
    (error as any).statusCode = 504;
    (error as any).userMessage =
      "リクエストがタイムアウトしました。しばらくお待ちください。";
    return error;
  }),
}));

// Helper function to create mock request and response
function createMockRequestResponse(method = "POST", body = {}) {
  const req = {
    method,
    headers: {
      "x-csrf-token": "test-csrf-token",
    },
    query: {},
    body,
    socket: {
      remoteAddress: "127.0.0.1",
    },
  } as unknown as NextApiRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
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

describe("/api/search-ideas", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset mockQdrantHandler methods
    mockQdrantHandler.createEmbedding.mockReset();
    mockQdrantHandler.searchSimilarProjects.mockReset();
    mockQdrantHandler.getCacheStats.mockReset();
    mockQdrantHandler.getCacheStats.mockReturnValue({
      embeddingCacheSize: 0,
      searchCacheSize: 0,
    });

    mockCreateEmbedding = mockQdrantHandler.createEmbedding;
    mockSearchSimilarProjects = mockQdrantHandler.searchSimilarProjects;
    mockGetCacheStats = mockQdrantHandler.getCacheStats;

    // Reset QdrantHandler mock
    const { QdrantHandler } = await import("@/lib/qdrantHandler");
    (QdrantHandler as any).mockImplementation(() => ({
      createEmbedding: mockCreateEmbedding,
      searchSimilarProjects: mockSearchSimilarProjects,
      getCacheStats: mockGetCacheStats,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 405 for non-POST methods", async () => {
    const handler = (await import("@/pages/api/search-ideas")).default;
    const { req, res } = createMockRequestResponse("GET");

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(405);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "Method Not Allowed",
      message: "Only POST method is allowed",
    });
  });

  it("should return 400 when idea is missing", async () => {
    const handler = (await import("@/pages/api/search-ideas")).default;
    const { req, res } = createMockRequestResponse("POST", {});

    await handler(req, res);

    const actualStatus = (res as any)._getStatusCode();
    const actualData = JSON.parse((res as any)._getData());

    // Debugging - log what we actually got
    if (actualStatus !== 400) {
      console.error("Unexpected status:", actualStatus);
      console.error("Response data:", actualData);
    }

    expect(actualStatus).toBe(400);
    expect(actualData).toEqual({
      error: "入力内容に問題があります。内容を確認してください。",
      type: "VALIDATION_ERROR",
      timestamp: expect.any(String),
      suggestions: ["必須項目を入力してください: idea"],
    });
  });

  it("should successfully search for similar projects", async () => {
    const handler = (await import("@/pages/api/search-ideas")).default;
    const idea = "NFT marketplace for digital art";
    const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
    const mockSimilarProjects = [
      { id: 1, title: "OpenSea", description: "NFT marketplace", score: 0.9 },
      {
        id: 2,
        title: "SuperRare",
        description: "Digital art platform",
        score: 0.8,
      },
    ];

    mockQdrantHandler.createEmbedding.mockResolvedValue(mockEmbedding);
    mockQdrantHandler.searchSimilarProjects.mockResolvedValue(
      mockSimilarProjects,
    );

    const { req, res } = createMockRequestResponse("POST", { idea });

    try {
      await handler(req, res);
    } catch (error) {
      console.error("Handler error:", error);
      throw error;
    }

    const statusCode = (res as any)._getStatusCode();
    const responseData = (res as any)._jsonData;

    // Debug output if test fails
    if (statusCode !== 200) {
      console.error("Test failed with status:", statusCode);
      console.error("Response data:", responseData);
      console.error(
        "MockCreateEmbedding called:",
        mockQdrantHandler.createEmbedding.mock.calls,
      );
      console.error(
        "MockSearchSimilarProjects called:",
        mockQdrantHandler.searchSimilarProjects.mock.calls,
      );
    }

    expect(statusCode).toBe(200);
    expect(responseData.message).toBe("検索が正常に完了しました");
    expect(responseData.projects).toEqual(mockSimilarProjects);
    expect(responseData.metadata.resultsCount).toBe(2);
    expect(responseData.metadata.searchTime).toEqual(expect.any(Number));

    expect(mockQdrantHandler.createEmbedding).toHaveBeenCalledWith(idea);
    expect(mockQdrantHandler.searchSimilarProjects).toHaveBeenCalledWith(
      mockEmbedding,
      10,
    );
  });

  it("should handle authentication errors (403)", async () => {
    const handler = (await import("@/pages/api/search-ideas")).default;
    const idea = "My blockchain idea";
    const authError = new Error("403: authentication failed");
    mockCreateEmbedding.mockRejectedValue(authError);

    const { req, res } = createMockRequestResponse("POST", { idea });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(403);
    const responseData = JSON.parse((res as any)._getData());
    expect(responseData.error).toBe("認証に失敗しました。再度お試しください。");
    expect(responseData.type).toBe("AUTHENTICATION_ERROR");
    expect(responseData.suggestions).toContain(
      "NOMIC_API_KEYが正しく設定されているか確認してください",
    );

    expect(mockQdrantHandler.createEmbedding).toHaveBeenCalledWith(idea);
    expect(mockQdrantHandler.searchSimilarProjects).not.toHaveBeenCalled();
  });

  it("should handle generic authentication errors", async () => {
    const handler = (await import("@/pages/api/search-ideas")).default;
    const idea = "My DeFi idea";
    const authError = new Error("authentication failed - invalid key");
    mockCreateEmbedding.mockRejectedValue(authError);

    const { req, res } = createMockRequestResponse("POST", { idea });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(403);
    const responseData = JSON.parse((res as any)._getData());
    expect(responseData.error).toBe("認証に失敗しました。再度お試しください。");
    expect(responseData.type).toBe("AUTHENTICATION_ERROR");

    expect(mockQdrantHandler.createEmbedding).toHaveBeenCalledWith(idea);
    expect(mockQdrantHandler.searchSimilarProjects).not.toHaveBeenCalled();
  });

  it("should handle general errors and return 500", async () => {
    const handler = (await import("@/pages/api/search-ideas")).default;
    const idea = "My Web3 idea";
    const genericError = new Error("Network timeout");
    mockCreateEmbedding.mockRejectedValue(genericError);

    const { req, res } = createMockRequestResponse("POST", { idea });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(504);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "リクエストがタイムアウトしました。しばらくお待ちください。",
      type: "TIMEOUT_ERROR",
      timestamp: expect.any(String),
    });

    expect(mockQdrantHandler.createEmbedding).toHaveBeenCalledWith(idea);
    expect(mockQdrantHandler.searchSimilarProjects).not.toHaveBeenCalled();
  });

  it("should handle unknown errors", async () => {
    const handler = (await import("@/pages/api/search-ideas")).default;
    const idea = "My idea";
    mockCreateEmbedding.mockRejectedValue("Unknown error");

    const { req, res } = createMockRequestResponse("POST", { idea });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "予期しないエラーが発生しました。しばらくお待ちください。",
      type: "INTERNAL_SERVER_ERROR",
      timestamp: expect.any(String),
    });

    expect(mockQdrantHandler.createEmbedding).toHaveBeenCalledWith(idea);
    expect(mockQdrantHandler.searchSimilarProjects).not.toHaveBeenCalled();
  });

  it("should handle errors during embedding search", async () => {
    const handler = (await import("@/pages/api/search-ideas")).default;
    const idea = "My GameFi idea";
    const mockEmbedding = [0.1, 0.2, 0.3];
    const searchError = new Error("Vector search failed");

    mockCreateEmbedding.mockResolvedValue(mockEmbedding);
    mockSearchSimilarProjects.mockRejectedValue(searchError);

    const { req, res } = createMockRequestResponse("POST", { idea });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "Vector search failed",
      type: "INTERNAL_SERVER_ERROR",
      timestamp: expect.any(String),
    });

    expect(mockQdrantHandler.createEmbedding).toHaveBeenCalledWith(idea);
    expect(mockQdrantHandler.searchSimilarProjects).toHaveBeenCalledWith(
      mockEmbedding,
      10,
    );
  });

  it("should handle empty idea string", async () => {
    const handler = (await import("@/pages/api/search-ideas")).default;
    const { req, res } = createMockRequestResponse("POST", { idea: "" });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(400);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "入力内容に問題があります。内容を確認してください。",
      type: "VALIDATION_ERROR",
      timestamp: expect.any(String),
      suggestions: ["必須項目を入力してください: idea"],
    });
  });

  it("should work with complex idea descriptions", async () => {
    const handler = (await import("@/pages/api/search-ideas")).default;
    const complexIdea =
      "A decentralized autonomous organization (DAO) that manages cross-chain liquidity pools using automated market makers (AMMs) with dynamic fee structures based on volatility and liquidity depth metrics.";
    const mockEmbedding = Array.from({ length: 384 }, (_, i) => i * 0.001);
    const mockResults = [
      { id: 1, title: "Balancer", description: "Multi-token AMM", score: 0.85 },
      { id: 2, title: "Curve", description: "Stable coin AMM", score: 0.82 },
      {
        id: 3,
        title: "Aragon",
        description: "DAO infrastructure",
        score: 0.79,
      },
    ];

    mockQdrantHandler.createEmbedding.mockResolvedValue(mockEmbedding);
    mockQdrantHandler.searchSimilarProjects.mockResolvedValue(mockResults);

    const { req, res } = createMockRequestResponse("POST", {
      idea: complexIdea,
    });

    await handler(req, res);

    const statusCodeComplex = (res as any)._getStatusCode();
    if (statusCodeComplex !== 200) {
      const responseDataComplex = JSON.parse((res as any)._getData());
      console.log("Complex test error response:", responseDataComplex);
    }

    expect((res as any)._getStatusCode()).toBe(200);
    const responseData = JSON.parse((res as any)._getData());
    expect(responseData.message).toBe("検索が正常に完了しました");
    expect(responseData.projects).toEqual(mockResults);
    expect(responseData.metadata.resultsCount).toBe(3);
    expect(responseData.metadata.searchTime).toEqual(expect.any(Number));
  });
});
