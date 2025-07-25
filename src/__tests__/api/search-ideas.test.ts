import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/search-ideas";
import { QdrantHandler } from "@/lib/qdrantHandler";

// Mock the QdrantHandler module to prevent actual API calls
jest.mock("@/lib/qdrantHandler", () => {
  const mockCreateEmbedding = jest.fn();
  const mockSearchSimilarProjects = jest.fn();

  return {
    QdrantHandler: jest.fn().mockImplementation(() => ({
      createEmbedding: mockCreateEmbedding,
      searchSimilarProjects: mockSearchSimilarProjects,
    })),
    __mockCreateEmbedding: mockCreateEmbedding,
    __mockSearchSimilarProjects: mockSearchSimilarProjects,
  };
});

const MockedQdrantHandler = QdrantHandler as jest.MockedClass<
  typeof QdrantHandler
>;

// Helper function to create mock request and response
function createMockRequestResponse(method = "POST", body = {}) {
  const req = {
    method,
    headers: {},
    query: {},
    body,
  } as unknown as NextApiRequest;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
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
  (res.status as jest.Mock).mockImplementation((code: number) => {
    (res as any)._statusCode = code;
    return res;
  });

  (res.json as jest.Mock).mockImplementation((data: any) => {
    (res as any)._jsonData = data;
    return res;
  });

  return { req, res };
}

describe("/api/search-ideas", () => {
  let mockCreateEmbedding: jest.MockedFunction<any>;
  let mockSearchSimilarProjects: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateEmbedding = jest.fn();
    mockSearchSimilarProjects = jest.fn();

    MockedQdrantHandler.mockImplementation(
      () =>
        ({
          createEmbedding: mockCreateEmbedding,
          searchSimilarProjects: mockSearchSimilarProjects,
        }) as any,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 405 for non-POST methods", async () => {
    const { req, res } = createMockRequestResponse("GET");

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(405);
    expect(JSON.parse((res as any)._getData())).toEqual({
      message: "Method not allowed",
    });
  });

  it("should return 400 when idea is missing", async () => {
    const { req, res } = createMockRequestResponse("POST", {});

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(400);
    expect(JSON.parse((res as any)._getData())).toEqual({
      message: "Idea is required",
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
      message: "Search completed successfully",
      projects: mockSimilarProjects,
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
    expect(responseData.message).toBe("Authentication failed");
    expect(responseData.error).toBe("403: authentication failed");
    expect(responseData.suggestion).toContain("NOMIC_API_KEY");

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
    expect(responseData.message).toBe("Authentication failed");
    expect(responseData.error).toBe("authentication failed - invalid key");

    expect(mockCreateEmbedding).toHaveBeenCalledWith(idea);
    expect(mockSearchSimilarProjects).not.toHaveBeenCalled();
  });

  it("should handle general errors and return 500", async () => {
    const idea = "My Web3 idea";
    const genericError = new Error("Network timeout");
    mockCreateEmbedding.mockRejectedValue(genericError);

    const { req, res } = createMockRequestResponse("POST", { idea });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual({
      message: "Search failed",
      error: "Network timeout",
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
      message: "Search failed",
      error: "An unknown error occurred",
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
      message: "Search failed",
      error: "Vector search failed",
    });

    expect(mockCreateEmbedding).toHaveBeenCalledWith(idea);
    expect(mockSearchSimilarProjects).toHaveBeenCalledWith(mockEmbedding);
  });

  it("should handle empty idea string", async () => {
    const { req, res } = createMockRequestResponse("POST", { idea: "" });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(400);
    expect(JSON.parse((res as any)._getData())).toEqual({
      message: "Idea is required",
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
      message: "Search completed successfully",
      projects: mockResults,
    });
  });
});
