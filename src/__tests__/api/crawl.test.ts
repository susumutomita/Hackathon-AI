import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/crawl";
import { crawlEthGlobalShowcase } from "@/lib/crawler";

// Mock the crawler module
vi.mock("@/lib/crawler", () => ({
  crawlEthGlobalShowcase: vi.fn(),
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
      error: "This API is disabled in the production environment.",
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
      message: "Crawling completed successfully",
      projects: mockProjects,
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
      error: "Crawling failed",
      details: errorMessage,
    });
  });

  it("should handle unknown errors", async () => {
    mockCrawlEthGlobalShowcase.mockRejectedValue("Unknown error");

    const { req, res } = createMockRequestResponse("GET");

    await handler(req, res);

    expect((res as any)._getStatusCode()).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual({
      error: "Crawling failed",
      details: "An unknown error occurred",
    });
  });
});
