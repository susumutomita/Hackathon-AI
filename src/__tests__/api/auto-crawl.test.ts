import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/auto-crawl";
import { checkAndUpdateEvents } from "@/lib/eventUpdater";
import { crawlEthGlobalShowcase } from "@/lib/crawler";

// Mock modules
vi.mock("@/lib/eventUpdater");
vi.mock("@/lib/crawler");

const mockCheckAndUpdateEvents = vi.mocked(checkAndUpdateEvents);
const mockCrawlEthGlobalShowcase = vi.mocked(crawlEthGlobalShowcase);

// Helper to create mock request and response
function createMocks(
  method: string = "POST",
  headers: Record<string, string> = {},
) {
  const req = {
    method,
    headers,
  } as unknown as NextApiRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as NextApiResponse;

  return { req, res };
}

describe("/api/auto-crawl", () => {
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
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
      expect(mockCheckAndUpdateEvents).not.toHaveBeenCalled();
    });

    test("should reject requests with invalid auth token", async () => {
      process.env.CRON_SECRET = "test-secret";
      const { req, res } = createMocks("POST", {
        authorization: "Bearer wrong-token",
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
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
      mockCrawlEthGlobalShowcase.mockResolvedValue([]);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockCheckAndUpdateEvents).toHaveBeenCalled();
    });

    test("should allow requests when no secret is set", async () => {
      delete process.env.CRON_SECRET;
      const { req, res } = createMocks();

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: true,
        added: [],
        total: 0,
      });
      mockCrawlEthGlobalShowcase.mockResolvedValue([]);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockCheckAndUpdateEvents).toHaveBeenCalled();
    });
  });

  describe("HTTP Methods", () => {
    test("should reject non-POST requests", async () => {
      const methods = ["GET", "PUT", "DELETE", "PATCH"];

      for (const method of methods) {
        const { req, res } = createMocks(method);
        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
        expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
        expect(mockCheckAndUpdateEvents).not.toHaveBeenCalled();
      }
    });
  });

  describe("Success scenarios", () => {
    test("should handle successful crawl with new events", async () => {
      const { req, res } = createMocks();

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: true,
        added: ["tokyo2024", "paris2024"],
        total: 10,
      });

      const mockProjects = [
        { title: "Project 1", description: "Test project 1" },
        { title: "Project 2", description: "Test project 2" },
        { title: "Project 3", description: "Test project 3" },
      ];
      mockCrawlEthGlobalShowcase.mockResolvedValue(mockProjects);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Auto crawl completed successfully",
        eventsUpdate: {
          added: ["tokyo2024", "paris2024"],
          total: 10,
        },
        crawlResult: {
          projectsCount: 3,
        },
      });
    });

    test("should handle successful crawl with no new events", async () => {
      const { req, res } = createMocks();

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: true,
        added: [],
        total: 8,
      });

      mockCrawlEthGlobalShowcase.mockResolvedValue([]);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Auto crawl completed successfully",
        eventsUpdate: {
          added: [],
          total: 8,
        },
        crawlResult: {
          projectsCount: 0,
        },
      });
    });
  });

  describe("Error scenarios", () => {
    test("should handle event update failure", async () => {
      const { req, res } = createMocks();

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: false,
        added: [],
        total: 0,
        error: "Network error",
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to update events",
        details: "Network error",
      });
      expect(mockCrawlEthGlobalShowcase).not.toHaveBeenCalled();
    });

    test("should handle crawl failure after successful event update", async () => {
      const { req, res } = createMocks();

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: true,
        added: ["event1"],
        total: 5,
      });

      mockCrawlEthGlobalShowcase.mockRejectedValue(new Error("Crawl failed"));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Auto crawl failed",
        details: "Crawl failed",
      });
    });

    test("should handle unknown errors", async () => {
      const { req, res } = createMocks();

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: true,
        added: [],
        total: 0,
      });

      // Throw an error without message property
      mockCrawlEthGlobalShowcase.mockRejectedValue({ code: "UNKNOWN" });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Auto crawl failed",
        details: "An unknown error occurred",
      });
    });
  });
});
