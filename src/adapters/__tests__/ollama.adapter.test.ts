import { describe, it, expect, vi, beforeEach } from "vitest";
import { OllamaAdapter } from "../ollama.adapter";
import { EmbeddingError } from "@/interfaces/embedding.interface";

// Mock the ollama module
vi.mock("ollama", () => ({
  default: {
    embed: vi.fn(),
  },
}));

import ollama from "ollama";

describe("OllamaAdapter", () => {
  const mockEmbed = ollama.embed as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.OLLAMA_MODEL;
    delete process.env.OLLAMA_URL;
  });

  describe("constructor", () => {
    it("should use default model when not configured", () => {
      const adapter = new OllamaAdapter();
      expect(adapter).toBeDefined();
    });

    it("should use configured model", () => {
      const adapter = new OllamaAdapter({ model: "custom-model" });
      expect(adapter).toBeDefined();
    });

    it("should use environment variable for model", () => {
      process.env.OLLAMA_MODEL = "env-model";
      const adapter = new OllamaAdapter();
      expect(adapter).toBeDefined();
    });
  });

  describe("createEmbedding", () => {
    it("should successfully create embedding", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      mockEmbed.mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      const adapter = new OllamaAdapter();
      const result = await adapter.createEmbedding("test text");

      expect(result).toEqual(mockEmbedding);
      expect(mockEmbed).toHaveBeenCalledWith({
        model: "nomic-embed-text",
        input: "test text",
      });
    });

    it("should use custom model", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      mockEmbed.mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      const adapter = new OllamaAdapter({ model: "custom-model" });
      await adapter.createEmbedding("test");

      expect(mockEmbed).toHaveBeenCalledWith({
        model: "custom-model",
        input: "test",
      });
    });

    it("should throw error when no embeddings returned", async () => {
      mockEmbed.mockResolvedValue({
        embeddings: [],
      });

      const adapter = new OllamaAdapter();

      await expect(adapter.createEmbedding("test")).rejects.toThrow(
        "No embeddings returned from Ollama",
      );
    });

    it("should handle connection refused error", async () => {
      const connectionError = new Error("connect ECONNREFUSED 127.0.0.1:11434");
      mockEmbed.mockRejectedValue(connectionError);

      const adapter = new OllamaAdapter();

      await expect(adapter.createEmbedding("test")).rejects.toThrow(
        EmbeddingError,
      );
      await expect(adapter.createEmbedding("test")).rejects.toThrowError(
        /Ollama is not running.*Please start Ollama/,
      );
    });

    it("should handle model not found error", async () => {
      const modelError = new Error("model not found");
      mockEmbed.mockRejectedValue(modelError);

      const adapter = new OllamaAdapter({ model: "missing-model" });

      await expect(adapter.createEmbedding("test")).rejects.toThrowError(
        /Model 'missing-model' not found.*ollama pull missing-model/,
      );
    });

    it("should handle generic errors", async () => {
      const genericError = new Error("Unknown error");
      mockEmbed.mockRejectedValue(genericError);

      const adapter = new OllamaAdapter();

      await expect(adapter.createEmbedding("test")).rejects.toThrowError(
        "Ollama embedding failed: Unknown error",
      );
    });

    it("should set OLLAMA_HOST when baseUrl is provided", async () => {
      const mockEmbedding = [0.1, 0.2];
      mockEmbed.mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      const adapter = new OllamaAdapter({ baseUrl: "http://custom:11434" });
      await adapter.createEmbedding("test");

      expect(process.env.OLLAMA_HOST).toBe("http://custom:11434");
    });
  });
});
