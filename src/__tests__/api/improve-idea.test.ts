import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/improve-idea";
import { parseHtmlWithLLM } from "@/lib/llmParser";

// Mock the LLM parser module
vi.mock("@/lib/llmParser", () => ({
  parseHtmlWithLLM: vi.fn(),
}));

const mockParseHtmlWithLLM = parseHtmlWithLLM as ReturnType<typeof vi.fn>;

// Helper function to create mock request and response
function createMockRequestResponse(method = "POST", body = {}) {
  const req = {
    method,
    headers: {},
    query: {},
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
    },
  );

  (res.json as ReturnType<typeof vi.fn>).mockImplementation((data: any) => {
    (res as any)._jsonData = data;
    return res;
  });

  return { req, res };
}

describe("/api/improve-idea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 400 when idea is missing", async () => {
    const { req, res } = createMockRequestResponse("POST", {
      similarProjects: [
        { title: "Test Project", description: "Test description" },
      ],
    });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(400);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "Missing idea or similar projects data",
    });
  });

  it("should return 400 when similarProjects is missing", async () => {
    const { req, res } = createMockRequestResponse("POST", {
      idea: "My brilliant idea",
    });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(400);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "Missing idea or similar projects data",
    });
  });

  it("should successfully process idea improvement request", async () => {
    const mockResponse = "Improved idea with detailed feedback";
    const idea = "My blockchain project idea";
    const similarProjects = [
      { title: "Project A", description: "Similar blockchain project" },
      { title: "Project B", description: "Another similar project" },
    ];

    mockParseHtmlWithLLM.mockResolvedValue(mockResponse);

    const { req, res } = createMockRequestResponse("POST", {
      idea,
      similarProjects,
    });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(200);
    expect(JSON.parse((res as any)._getData())).toEqual({
      improvedIdea: mockResponse,
    });

    // Verify the LLM parser was called with correct parameters
    expect(mockParseHtmlWithLLM).toHaveBeenCalledTimes(1);
    expect(mockParseHtmlWithLLM).toHaveBeenCalledWith(
      idea,
      expect.stringContaining(
        "あなたは、ハッカソンで何度も勝利を収めた伝説のスーパーエンジニア",
      ),
    );
  });

  it("should handle LLM parser errors and return 500", async () => {
    const errorMessage = "LLM service is unavailable";
    mockParseHtmlWithLLM.mockRejectedValue(new Error(errorMessage));

    const { req, res } = createMockRequestResponse("POST", {
      idea: "My idea",
      similarProjects: [{ title: "Test", description: "Test" }],
    });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "Failed to generate improved idea",
      details: errorMessage,
    });
  });

  it("should handle unknown errors", async () => {
    mockParseHtmlWithLLM.mockRejectedValue("Unknown error");

    const { req, res } = createMockRequestResponse("POST", {
      idea: "My idea",
      similarProjects: [{ title: "Test", description: "Test" }],
    });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "Failed to generate improved idea",
      details: "An unknown error occurred",
    });
  });

  it("should work with multiple similar projects", async () => {
    const mockResponse = "Comprehensive improvement feedback";
    const idea = "DeFi lending platform";
    const similarProjects = [
      { title: "Aave", description: "Decentralized lending protocol" },
      { title: "Compound", description: "Algorithmic money markets" },
      {
        title: "MakerDAO",
        description: "Decentralized autonomous organization",
      },
    ];

    mockParseHtmlWithLLM.mockResolvedValue(mockResponse);

    const { req, res } = createMockRequestResponse("POST", {
      idea,
      similarProjects,
    });

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(200);
    expect(JSON.parse((res as any)._getData())).toEqual({
      improvedIdea: mockResponse,
    });

    // Verify the prompt includes all similar projects
    const promptCall = mockParseHtmlWithLLM.mock.calls[0][1];
    expect(promptCall).toContain("Aave: Decentralized lending protocol");
    expect(promptCall).toContain("Compound: Algorithmic money markets");
    expect(promptCall).toContain(
      "MakerDAO: Decentralized autonomous organization",
    );
  });
});
