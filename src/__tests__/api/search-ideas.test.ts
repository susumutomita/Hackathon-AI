import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/search-ideas";
import { QdrantHandler } from "@/lib/qdrantHandler";

// Mock the QdrantHandler module to prevent actual API calls
vi.mock("@/lib/qdrantHandler", () => {
  const mockCreateEmbedding = vi.fn();
  const mockSearchSimilarProjects = vi.fn();

  return {
    QdrantHandler: vi.fn().mockImplementation(() => ({
      createEmbedding: mockCreateEmbedding,
      searchSimilarProjects: mockSearchSimilarProjects,
    })),
    __mockCreateEmbedding: mockCreateEmbedding,
    __mockSearchSimilarProjects: mockSearchSimilarProjects,
  };
});

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
  validateRequired: vi.fn((data, fields) => {
    const missingFields = fields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      const error = new Error(
        `Missing required fields: ${missingFields.join(", ")}`,
      );
      error.statusCode = 400;
      error.type = "VALIDATION_ERROR";
      error.userMessage = "入力内容に問題があります。内容を確認してください。";
      error.suggestions = [
        `必須項目を入力してください: ${missingFields.join(", ")}`,
      ];
      throw error;
    }
  }),
  createError: vi.fn((type, message) => {
    const error = new Error(message);
    error.type = type;
    error.statusCode = 500;
    error.userMessage =
      "予期しないエラーが発生しました。しばらくお待ちください。";
    return error;
  }),
  createValidationError: vi.fn((message) => {
    const error = new Error(message);
    error.type = "VALIDATION_ERROR";
    error.statusCode = 400;
    error.userMessage = "入力内容に問題があります。内容を確認してください。";
    return error;
  }),
  createAuthenticationError: vi.fn((message, suggestions) => {
    const error = new Error(message);
    error.type = "AUTHENTICATION_ERROR";
    error.statusCode = 403;
    error.userMessage = "認証に失敗しました。再度お試しください。";
    error.suggestions = suggestions;
    return error;
  }),
  createTimeoutError: vi.fn((message) => {
    const error = new Error(message);
    error.type = "TIMEOUT_ERROR";
    error.statusCode = 504;
    error.userMessage =
      "リクエストがタイムアウトしました。しばらくお待ちください。";
    return error;
  }),
}));

const MockedQdrantHandler = QdrantHandler as ReturnType<typeof vi.fn>;

// Helper function to create mock request and response
function createMockRequestResponse(method = "POST", body = {}) {
  const req = {
    method,
    headers: {},
    query: {},
    body,
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

describe("/api/search-ideas", () => {
  let mockCreateEmbedding: ReturnType<typeof vi.fn>;
  let mockSearchSimilarProjects: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateEmbedding = vi.fn();
    mockSearchSimilarProjects = vi.fn();

    MockedQdrantHandler.mockImplementation(
      () =>
        ({
          createEmbedding: mockCreateEmbedding,
          searchSimilarProjects: mockSearchSimilarProjects,
        }) as any,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 405 for non-POST methods", async () => {
    const { req, res } = createMockRequestResponse("GET");

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(400);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: expect.stringContaining("Method"),
      type: "INTERNAL_SERVER_ERROR",
      timestamp: expect.any(String),
    });
  });

  it("should return 400 when idea is missing", async () => {
    const { req, res } = createMockRequestResponse("POST", {});

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(400);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "入力内容に問題があります。内容を確認してください。",
      type: "VALIDATION_ERROR",
      timestamp: expect.any(String),
      suggestions: ["必須項目を入力してください: idea"],
    });
  });

  it("should successfully search for similar projects", async () => {
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

    mockCreateEmbedding.mockResolvedValue(mockEmbedding);
    mockSearchSimilarProjects.mockResolvedValue(mockSimilarProjects);

    const { req, res } = createMockRequestResponse("POST", { idea });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(200);
    expect(JSON.parse((res as any)._getData())).toEqual({
      message: "検索が正常に完了しました",
      projects: mockSimilarProjects,
      metadata: {
        searchTime: expect.any(Number),
        resultsCount: 2,
      },
    });

    expect(mockCreateEmbedding).toHaveBeenCalledWith(idea);
    expect(mockSearchSimilarProjects).toHaveBeenCalledWith(mockEmbedding);
  });

  it("should handle authentication errors (403)", async () => {
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

    expect(mockCreateEmbedding).toHaveBeenCalledWith(idea);
    expect(mockSearchSimilarProjects).not.toHaveBeenCalled();
  });

  it("should handle generic authentication errors", async () => {
    const idea = "My DeFi idea";
    const authError = new Error("authentication failed - invalid key");
    mockCreateEmbedding.mockRejectedValue(authError);

    const { req, res } = createMockRequestResponse("POST", { idea });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(403);
    const responseData = JSON.parse((res as any)._getData());
    expect(responseData.error).toBe("認証に失敗しました。再度お試しください。");
    expect(responseData.type).toBe("AUTHENTICATION_ERROR");

    expect(mockCreateEmbedding).toHaveBeenCalledWith(idea);
    expect(mockSearchSimilarProjects).not.toHaveBeenCalled();
  });

  it("should handle general errors and return 500", async () => {
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

    expect(mockCreateEmbedding).toHaveBeenCalledWith(idea);
    expect(mockSearchSimilarProjects).not.toHaveBeenCalled();
  });

  it("should handle unknown errors", async () => {
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

    expect(mockCreateEmbedding).toHaveBeenCalledWith(idea);
    expect(mockSearchSimilarProjects).not.toHaveBeenCalled();
  });

  it("should handle errors during embedding search", async () => {
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

    expect(mockCreateEmbedding).toHaveBeenCalledWith(idea);
    expect(mockSearchSimilarProjects).toHaveBeenCalledWith(mockEmbedding);
  });

  it("should handle empty idea string", async () => {
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

    mockCreateEmbedding.mockResolvedValue(mockEmbedding);
    mockSearchSimilarProjects.mockResolvedValue(mockResults);

    const { req, res } = createMockRequestResponse("POST", {
      idea: complexIdea,
    });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(200);
    expect(JSON.parse((res as any)._getData())).toEqual({
      message: "検索が正常に完了しました",
      projects: mockResults,
      metadata: {
        searchTime: expect.any(Number),
        resultsCount: 3,
      },
    });
  });
});
