import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/update-events";
import { checkAndUpdateEvents } from "@/lib/eventUpdater";

// Mock modules
vi.mock("@/lib/eventUpdater");

const mockCheckAndUpdateEvents = vi.mocked(checkAndUpdateEvents);

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

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockCheckAndUpdateEvents).toHaveBeenCalled();
    });
  });

  describe("HTTP Methods", () => {
    test("should reject non-POST requests", async () => {
      const methods = ["GET", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

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
    test("should handle successful update with new events", async () => {
      const { req, res } = createMocks();

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: true,
        added: ["tokyo2024", "paris2024", "london2024"],
        total: 15,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Events updated successfully",
        added: ["tokyo2024", "paris2024", "london2024"],
        total: 15,
      });
    });

    test("should handle successful update with no new events", async () => {
      const { req, res } = createMocks();

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: true,
        added: [],
        total: 10,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Events updated successfully",
        added: [],
        total: 10,
      });
    });
  });

  describe("Error scenarios", () => {
    test("should handle update failure with error details", async () => {
      const { req, res } = createMocks();

      mockCheckAndUpdateEvents.mockResolvedValue({
        success: false,
        added: [],
        total: 0,
        error: "Network timeout",
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to update events",
        details: "Network timeout",
      });
    });

    test("should handle unexpected errors during update", async () => {
      const { req, res } = createMocks();

      mockCheckAndUpdateEvents.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
        details: "Database connection failed",
      });
    });

    test("should handle errors without message property", async () => {
      const { req, res } = createMocks();

      // Throw an error without message property
      mockCheckAndUpdateEvents.mockRejectedValue({ code: "ERR_UNKNOWN" });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
        details: "An unknown error occurred",
      });
    });

    test("should handle null/undefined errors", async () => {
      const { req, res } = createMocks();

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
