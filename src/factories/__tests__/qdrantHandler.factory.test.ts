import { describe, it, expect, vi, beforeEach } from "vitest";
import { QdrantHandlerFactory } from "../qdrantHandler.factory";
import { QdrantHandler } from "@/lib/qdrantHandler";
import { EmbeddingFactory } from "../embedding.factory";
import { QdrantAdapter } from "@/adapters/qdrant.adapter";
import type { EmbeddingProvider } from "@/interfaces/embedding.interface";
import type { VectorDBClient } from "@/interfaces/vectordb.interface";

vi.mock("@/lib/qdrantHandler");
vi.mock("../embedding.factory");
vi.mock("@/adapters/qdrant.adapter");

describe("QdrantHandlerFactory", () => {
  let mockEmbeddingProvider: EmbeddingProvider;
  let mockVectorDBClient: VectorDBClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEmbeddingProvider = {
      createEmbedding: vi.fn(),
    };

    mockVectorDBClient = {
      search: vi.fn(),
      upsert: vi.fn(),
      createCollection: vi.fn(),
    };
  });

  describe("create", () => {
    it("should create QdrantHandler with default adapters when no config provided", () => {
      vi.mocked(EmbeddingFactory.create).mockReturnValue(mockEmbeddingProvider);
      (QdrantAdapter as any).mockImplementation(() => mockVectorDBClient);

      const result = QdrantHandlerFactory.create();

      expect(EmbeddingFactory.create).toHaveBeenCalledWith(undefined);
      expect(QdrantAdapter).toHaveBeenCalledWith(undefined);
      expect(QdrantHandler).toHaveBeenCalledWith(
        mockEmbeddingProvider,
        mockVectorDBClient,
      );
    });

    it("should create QdrantHandler with embedding config", () => {
      const embeddingConfig = {
        provider: "ollama",
        config: { model: "custom-model" },
      };

      vi.mocked(EmbeddingFactory.create).mockReturnValue(mockEmbeddingProvider);
      (QdrantAdapter as any).mockImplementation(() => mockVectorDBClient);

      QdrantHandlerFactory.create({ embedding: embeddingConfig });

      expect(EmbeddingFactory.create).toHaveBeenCalledWith(embeddingConfig);
      expect(QdrantHandler).toHaveBeenCalledWith(
        mockEmbeddingProvider,
        mockVectorDBClient,
      );
    });

    it("should create QdrantHandler with vector DB config", () => {
      const vectorDBConfig = {
        url: "http://custom-qdrant:6333",
        apiKey: "custom-key",
      };

      vi.mocked(EmbeddingFactory.create).mockReturnValue(mockEmbeddingProvider);
      (QdrantAdapter as any).mockImplementation(() => mockVectorDBClient);

      QdrantHandlerFactory.create({ vectorDB: vectorDBConfig });

      expect(QdrantAdapter).toHaveBeenCalledWith(vectorDBConfig);
      expect(QdrantHandler).toHaveBeenCalledWith(
        mockEmbeddingProvider,
        mockVectorDBClient,
      );
    });

    it("should use custom embedding provider when provided", () => {
      const customEmbeddingProvider: EmbeddingProvider = {
        createEmbedding: vi.fn(),
      };

      (QdrantAdapter as any).mockImplementation(() => mockVectorDBClient);

      QdrantHandlerFactory.create({
        embeddingProvider: customEmbeddingProvider,
      });

      expect(EmbeddingFactory.create).not.toHaveBeenCalled();
      expect(QdrantHandler).toHaveBeenCalledWith(
        customEmbeddingProvider,
        mockVectorDBClient,
      );
    });

    it("should use custom vector DB client when provided", () => {
      const customVectorDBClient: VectorDBClient = {
        search: vi.fn(),
        upsert: vi.fn(),
        createCollection: vi.fn(),
      };

      vi.mocked(EmbeddingFactory.create).mockReturnValue(mockEmbeddingProvider);

      QdrantHandlerFactory.create({ vectorDBClient: customVectorDBClient });

      expect(QdrantAdapter).not.toHaveBeenCalled();
      expect(QdrantHandler).toHaveBeenCalledWith(
        mockEmbeddingProvider,
        customVectorDBClient,
      );
    });

    it("should use both custom instances when provided", () => {
      const customEmbeddingProvider: EmbeddingProvider = {
        createEmbedding: vi.fn(),
      };

      const customVectorDBClient: VectorDBClient = {
        search: vi.fn(),
        upsert: vi.fn(),
        createCollection: vi.fn(),
      };

      QdrantHandlerFactory.create({
        embeddingProvider: customEmbeddingProvider,
        vectorDBClient: customVectorDBClient,
      });

      expect(EmbeddingFactory.create).not.toHaveBeenCalled();
      expect(QdrantAdapter).not.toHaveBeenCalled();
      expect(QdrantHandler).toHaveBeenCalledWith(
        customEmbeddingProvider,
        customVectorDBClient,
      );
    });
  });

  describe("createDefault", () => {
    it("should create QdrantHandler with default configuration", () => {
      vi.mocked(EmbeddingFactory.create).mockReturnValue(mockEmbeddingProvider);
      (QdrantAdapter as any).mockImplementation(() => mockVectorDBClient);

      const result = QdrantHandlerFactory.createDefault();

      expect(EmbeddingFactory.create).toHaveBeenCalledWith(undefined);
      expect(QdrantAdapter).toHaveBeenCalledWith(undefined);
      expect(QdrantHandler).toHaveBeenCalledWith(
        mockEmbeddingProvider,
        mockVectorDBClient,
      );
    });
  });
});
