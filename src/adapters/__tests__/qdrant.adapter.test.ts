import { describe, test, expect, vi, beforeEach } from "vitest";
import { QdrantAdapter } from "../qdrant.adapter";
import { QdrantClient } from "@qdrant/js-client-rest";
import { VectorDBError } from "@/interfaces/vectordb.interface";
import { getValidatedEnv } from "@/lib/env";

// Mock QdrantClient
vi.mock("@qdrant/js-client-rest", () => ({
  QdrantClient: vi.fn(),
}));

// Mock getValidatedEnv
vi.mock("@/lib/env", () => ({
  getValidatedEnv: vi.fn(),
}));

describe("QdrantAdapter", () => {
  let adapter: QdrantAdapter;
  let mockQdrantClient: any;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();

    // Mock getValidatedEnv with default values
    vi.mocked(getValidatedEnv).mockReturnValue({
      QD_URL: "http://localhost:6333",
      QD_API_KEY: "",
      NOMIC_API_KEY: "test-key",
      NODE_ENV: "test",
      NEXT_PUBLIC_ENVIRONMENT: "test",
    } as any);

    // Create mock Qdrant client
    mockQdrantClient = {
      search: vi.fn(),
      upsert: vi.fn(),
      createCollection: vi.fn(),
      delete: vi.fn(),
    };

    // Mock QdrantClient constructor
    (QdrantClient as any).mockImplementation(() => mockQdrantClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("constructor", () => {
    test("should create client with default config", () => {
      delete process.env.QD_URL;
      delete process.env.QD_API_KEY;

      // Mock getValidatedEnv to return default values
      vi.mocked(getValidatedEnv).mockReturnValue({
        QD_URL: "http://localhost:6333",
        QD_API_KEY: "",
        NOMIC_API_KEY: "test-key",
        NODE_ENV: "test",
        NEXT_PUBLIC_ENVIRONMENT: "test",
      } as any);

      adapter = new QdrantAdapter();

      expect(QdrantClient).toHaveBeenCalledWith({
        url: "http://localhost:6333",
        apiKey: "",
        timeout: undefined,
      });
    });

    test("should create client with custom config", () => {
      const config = {
        url: "http://custom:6333",
        apiKey: "test-key",
        timeout: 5000,
      };

      adapter = new QdrantAdapter(config);

      expect(QdrantClient).toHaveBeenCalledWith({
        url: "http://custom:6333",
        apiKey: "test-key",
        timeout: 5000,
      });
    });

    test("should use environment variables", () => {
      process.env.QD_URL = "http://env-url:6333";
      process.env.QD_API_KEY = "env-api-key";

      // Mock getValidatedEnv to return the environment variables
      vi.mocked(getValidatedEnv).mockReturnValue({
        QD_URL: "http://env-url:6333",
        QD_API_KEY: "env-api-key",
        NOMIC_API_KEY: "test-key",
        NODE_ENV: "test",
        NEXT_PUBLIC_ENVIRONMENT: "test",
      } as any);

      adapter = new QdrantAdapter();

      expect(QdrantClient).toHaveBeenCalledWith({
        url: "http://env-url:6333",
        apiKey: "env-api-key",
        timeout: undefined,
      });
    });

    test("should prefer config over environment variables", () => {
      process.env.QD_URL = "http://env-url:6333";
      process.env.QD_API_KEY = "env-api-key";

      // Mock getValidatedEnv to return the environment variables
      vi.mocked(getValidatedEnv).mockReturnValue({
        QD_URL: "http://env-url:6333",
        QD_API_KEY: "env-api-key",
        NOMIC_API_KEY: "test-key",
        NODE_ENV: "test",
        NEXT_PUBLIC_ENVIRONMENT: "test",
      } as any);

      const config = {
        url: "http://config-url:6333",
        apiKey: "config-api-key",
      };

      adapter = new QdrantAdapter(config);

      expect(QdrantClient).toHaveBeenCalledWith({
        url: "http://config-url:6333",
        apiKey: "config-api-key",
        timeout: undefined,
      });
    });
  });

  describe("search", () => {
    beforeEach(() => {
      adapter = new QdrantAdapter();
    });

    test("should search successfully", async () => {
      const mockResponse = [
        { id: "1", score: 0.95, payload: { name: "Item 1" } },
        { id: "2", score: 0.85, payload: { name: "Item 2" } },
      ];

      mockQdrantClient.search.mockResolvedValue(mockResponse);

      const query = {
        vector: [1, 2, 3],
        limit: 10,
        scoreThreshold: 0.8,
        filter: { must: [{ key: "type", match: { value: "document" } }] },
      };

      const results = await adapter.search("test-collection", query);

      expect(mockQdrantClient.search).toHaveBeenCalledWith("test-collection", {
        vector: [1, 2, 3],
        limit: 10,
        score_threshold: 0.8,
        filter: { must: [{ key: "type", match: { value: "document" } }] },
      });

      expect(results).toEqual([
        { id: "1", score: 0.95, payload: { name: "Item 1" } },
        { id: "2", score: 0.85, payload: { name: "Item 2" } },
      ]);
    });

    test("should handle search error", async () => {
      const error = new Error("Search failed");
      mockQdrantClient.search.mockRejectedValue(error);

      await expect(
        adapter.search("test-collection", { vector: [1, 2, 3] }),
      ).rejects.toThrow(VectorDBError);
    });
  });

  describe("upsert", () => {
    beforeEach(() => {
      adapter = new QdrantAdapter();
    });

    test("should upsert points successfully", async () => {
      const points = [
        { id: "1", vector: [1, 2, 3], payload: { name: "Item 1" } },
        { id: "2", vector: [4, 5, 6], payload: { name: "Item 2" } },
      ];

      mockQdrantClient.upsert.mockResolvedValue(undefined);

      await adapter.upsert("test-collection", points);

      expect(mockQdrantClient.upsert).toHaveBeenCalledWith("test-collection", {
        points: [
          { id: "1", vector: [1, 2, 3], payload: { name: "Item 1" } },
          { id: "2", vector: [4, 5, 6], payload: { name: "Item 2" } },
        ],
      });
    });

    test("should handle points without payload", async () => {
      const points = [{ id: "1", vector: [1, 2, 3] }];

      mockQdrantClient.upsert.mockResolvedValue(undefined);

      await adapter.upsert("test-collection", points);

      expect(mockQdrantClient.upsert).toHaveBeenCalledWith("test-collection", {
        points: [{ id: "1", vector: [1, 2, 3], payload: {} }],
      });
    });

    test("should handle upsert error", async () => {
      const error = new Error("Upsert failed");
      mockQdrantClient.upsert.mockRejectedValue(error);

      await expect(adapter.upsert("test-collection", [])).rejects.toThrow(
        VectorDBError,
      );
    });
  });

  describe("createCollection", () => {
    beforeEach(() => {
      adapter = new QdrantAdapter();
    });

    test("should create collection successfully", async () => {
      mockQdrantClient.createCollection.mockResolvedValue(undefined);

      await adapter.createCollection("test-collection", {
        vectorSize: 768,
        distance: "Euclidean",
      });

      expect(mockQdrantClient.createCollection).toHaveBeenCalledWith(
        "test-collection",
        {
          vectors: {
            size: 768,
            distance: "Euclidean",
          },
        },
      );
    });

    test("should use default distance metric", async () => {
      mockQdrantClient.createCollection.mockResolvedValue(undefined);

      await adapter.createCollection("test-collection", {
        vectorSize: 768,
      });

      expect(mockQdrantClient.createCollection).toHaveBeenCalledWith(
        "test-collection",
        {
          vectors: {
            size: 768,
            distance: "Cosine",
          },
        },
      );
    });

    test("should throw error when vector size is missing", async () => {
      await expect(
        adapter.createCollection("test-collection", {}),
      ).rejects.toThrow("Vector size is required for collection creation");
    });

    test("should throw error when config is missing", async () => {
      await expect(adapter.createCollection("test-collection")).rejects.toThrow(
        "Vector size is required for collection creation",
      );
    });

    test("should handle creation error", async () => {
      const error = new Error("Creation failed");
      mockQdrantClient.createCollection.mockRejectedValue(error);

      await expect(
        adapter.createCollection("test-collection", { vectorSize: 768 }),
      ).rejects.toThrow(VectorDBError);
    });
  });

  describe("delete", () => {
    beforeEach(() => {
      adapter = new QdrantAdapter();
    });

    test("should delete points successfully", async () => {
      mockQdrantClient.delete.mockResolvedValue(undefined);

      await adapter.delete("test-collection", ["1", "2", "3"]);

      expect(mockQdrantClient.delete).toHaveBeenCalledWith("test-collection", {
        points: ["1", "2", "3"],
      });
    });

    test("should handle delete error", async () => {
      const error = new Error("Delete failed");
      mockQdrantClient.delete.mockRejectedValue(error);

      await expect(adapter.delete("test-collection", ["1"])).rejects.toThrow(
        VectorDBError,
      );
    });
  });

  describe("wrapError", () => {
    beforeEach(() => {
      adapter = new QdrantAdapter();
    });

    test("should handle connection refused error", async () => {
      const error = new Error("connect ECONNREFUSED");
      mockQdrantClient.search.mockRejectedValue(error);

      try {
        await adapter.search("test-collection", { vector: [1, 2, 3] });
      } catch (err) {
        expect(err).toBeInstanceOf(VectorDBError);
        expect(err.code).toBe("CONNECTION_ERROR");
        expect(err.message).toContain("Qdrant server is not available");
      }
    });

    test("should handle authentication error (401)", async () => {
      const error = new Error("401 Unauthorized");
      mockQdrantClient.search.mockRejectedValue(error);

      try {
        await adapter.search("test-collection", { vector: [1, 2, 3] });
      } catch (err) {
        expect(err).toBeInstanceOf(VectorDBError);
        expect(err.code).toBe("AUTH_ERROR");
        expect(err.message).toContain("Authentication failed");
      }
    });

    test("should handle authentication error (403)", async () => {
      const error = new Error("403 Forbidden");
      mockQdrantClient.search.mockRejectedValue(error);

      try {
        await adapter.search("test-collection", { vector: [1, 2, 3] });
      } catch (err) {
        expect(err).toBeInstanceOf(VectorDBError);
        expect(err.code).toBe("AUTH_ERROR");
        expect(err.message).toContain("Authentication failed");
      }
    });

    test("should handle collection not found error", async () => {
      const error = new Error("Collection test-collection not found");
      mockQdrantClient.search.mockRejectedValue(error);

      try {
        await adapter.search("test-collection", { vector: [1, 2, 3] });
      } catch (err) {
        expect(err).toBeInstanceOf(VectorDBError);
        expect(err.code).toBe("NOT_FOUND");
        expect(err.message).toContain("Collection not found");
      }
    });

    test("should handle 404 error", async () => {
      const error = new Error("404 Not Found");
      mockQdrantClient.search.mockRejectedValue(error);

      try {
        await adapter.search("test-collection", { vector: [1, 2, 3] });
      } catch (err) {
        expect(err).toBeInstanceOf(VectorDBError);
        expect(err.code).toBe("NOT_FOUND");
        expect(err.message).toContain("Collection not found");
      }
    });

    test("should handle generic error", async () => {
      const error = new Error("Something went wrong");
      mockQdrantClient.search.mockRejectedValue(error);

      try {
        await adapter.search("test-collection", { vector: [1, 2, 3] });
      } catch (err) {
        expect(err).toBeInstanceOf(VectorDBError);
        expect(err.code).toBe("QDRANT_ERROR");
        expect(err.message).toContain("Something went wrong");
      }
    });

    test("should handle non-Error object", async () => {
      mockQdrantClient.search.mockRejectedValue("String error");

      try {
        await adapter.search("test-collection", { vector: [1, 2, 3] });
      } catch (err) {
        expect(err).toBeInstanceOf(VectorDBError);
        expect(err.code).toBe("UNKNOWN_ERROR");
        expect(err.message).toContain("Unknown error occurred");
      }
    });

    test("should handle server version error", async () => {
      const error = new Error("Failed to obtain server version");
      mockQdrantClient.search.mockRejectedValue(error);

      try {
        await adapter.search("test-collection", { vector: [1, 2, 3] });
      } catch (err) {
        expect(err).toBeInstanceOf(VectorDBError);
        expect(err.code).toBe("CONNECTION_ERROR");
        expect(err.message).toContain("Qdrant server is not available");
      }
    });
  });
});
