import { describe, it, expect, vi, beforeEach } from "vitest";
import { NomicAdapter } from "../nomic.adapter";
import { EmbeddingError } from "@/interfaces/embedding.interface";
import { HttpClient, HttpError } from "@/interfaces/http.interface";

describe("NomicAdapter", () => {
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.NOMIC_API_KEY;

    // Create mock HTTP client
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
  });

  describe("constructor", () => {
    it("should throw error when API key is not provided", () => {
      expect(() => new NomicAdapter(mockHttpClient)).toThrow(
        "NOMIC_API_KEY is required",
      );
    });

    it("should use API key from config", () => {
      const adapter = new NomicAdapter(mockHttpClient, { apiKey: "test-key" });
      expect(adapter).toBeDefined();
    });

    it("should use API key from environment", () => {
      process.env.NOMIC_API_KEY = "env-key";
      const adapter = new NomicAdapter(mockHttpClient);
      expect(adapter).toBeDefined();
    });
  });

  describe("createEmbedding", () => {
    const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];

    it("should successfully create embedding", async () => {
      const mockPost = mockHttpClient.post as ReturnType<typeof vi.fn>;
      mockPost.mockResolvedValue({
        data: {
          embeddings: [mockEmbedding],
        },
        status: 200,
        statusText: "OK",
        headers: {},
      });

      const adapter = new NomicAdapter(mockHttpClient, { apiKey: "test-key" });
      const result = await adapter.createEmbedding("test text");

      expect(result).toEqual(mockEmbedding);
      expect(mockPost).toHaveBeenCalledWith(
        "https://api-atlas.nomic.ai/v1/embedding/text",
        {
          model: "nomic-embed-text-v1",
          texts: ["test text"],
        },
        {
          headers: {
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
          },
          timeout: undefined,
        },
      );
    });

    it("should handle authentication error (401)", async () => {
      const mockPost = mockHttpClient.post as ReturnType<typeof vi.fn>;
      mockPost.mockRejectedValue(
        new HttpError("Unauthorized", 401, "Unauthorized"),
      );

      const adapter = new NomicAdapter(mockHttpClient, {
        apiKey: "invalid-key",
      });

      await expect(adapter.createEmbedding("test")).rejects.toThrowError(
        "Authentication failed. Please check your NOMIC_API_KEY",
      );
    });

    it("should handle rate limit error (429)", async () => {
      const mockPost = mockHttpClient.post as ReturnType<typeof vi.fn>;
      mockPost.mockRejectedValue(
        new HttpError("Too Many Requests", 429, "Too Many Requests"),
      );

      const adapter = new NomicAdapter(mockHttpClient, { apiKey: "test-key" });

      await expect(adapter.createEmbedding("test")).rejects.toThrowError(
        "Rate limit exceeded. Please try again later",
      );
    });

    it("should handle bad request error (400)", async () => {
      const mockPost = mockHttpClient.post as ReturnType<typeof vi.fn>;
      mockPost.mockRejectedValue(
        new HttpError("Bad Request", 400, "Bad Request", {
          error: "Invalid model specified",
        }),
      );

      const adapter = new NomicAdapter(mockHttpClient, { apiKey: "test-key" });

      await expect(adapter.createEmbedding("test")).rejects.toThrowError(
        "Invalid request: Invalid model specified",
      );
    });

    it("should handle server error (500)", async () => {
      const mockPost = mockHttpClient.post as ReturnType<typeof vi.fn>;
      mockPost.mockRejectedValue(
        new HttpError("Internal Server Error", 500, "Internal Server Error"),
      );

      const adapter = new NomicAdapter(mockHttpClient, { apiKey: "test-key" });

      await expect(adapter.createEmbedding("test")).rejects.toThrowError(
        "Nomic API server error. Please try again later",
      );
    });

    it("should throw error when no embeddings returned", async () => {
      const mockPost = mockHttpClient.post as ReturnType<typeof vi.fn>;
      mockPost.mockResolvedValue({
        data: {
          embeddings: [],
        },
        status: 200,
        statusText: "OK",
        headers: {},
      });

      const adapter = new NomicAdapter(mockHttpClient, { apiKey: "test-key" });

      await expect(adapter.createEmbedding("test")).rejects.toThrowError(
        "No embeddings returned from Nomic API",
      );
    });

    it("should use custom configuration", async () => {
      const mockPost = mockHttpClient.post as ReturnType<typeof vi.fn>;
      mockPost.mockResolvedValue({
        data: {
          embeddings: [mockEmbedding],
        },
        status: 200,
        statusText: "OK",
        headers: {},
      });

      const adapter = new NomicAdapter(mockHttpClient, {
        apiKey: "test-key",
        baseUrl: "https://custom-api.com",
        model: "custom-model",
        timeout: 5000,
      });

      await adapter.createEmbedding("test");

      expect(mockPost).toHaveBeenCalledWith(
        "https://custom-api.com/v1/embedding/text",
        {
          model: "custom-model",
          texts: ["test"],
        },
        expect.objectContaining({
          timeout: 5000,
        }),
      );
    });

    it("should handle non-HTTP errors", async () => {
      const mockPost = mockHttpClient.post as ReturnType<typeof vi.fn>;
      mockPost.mockRejectedValue(new Error("Network error"));

      const adapter = new NomicAdapter(mockHttpClient, { apiKey: "test-key" });

      await expect(adapter.createEmbedding("test")).rejects.toThrowError(
        "Failed to create embedding: Network error",
      );
    });
  });
});
