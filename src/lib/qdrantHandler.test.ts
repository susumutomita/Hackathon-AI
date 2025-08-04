import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QdrantHandler } from "./qdrantHandler";
import { QdrantClient } from "@qdrant/js-client-rest";
import axios from "axios";
import ollama from "ollama";
import logger from "@/lib/logger";
import { getValidatedEnv, isProduction } from "@/lib/env";

vi.mock("@qdrant/js-client-rest");
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    isAxiosError: vi.fn(),
  },
  isAxiosError: vi.fn(),
}));
vi.mock("ollama");
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  getValidatedEnv: vi.fn(),
  isProduction: vi.fn(),
}));

vi.mock("uuid", () => ({
  v4: () => "test-uuid-123",
}));

describe("QdrantHandler", () => {
  let handler: QdrantHandler;
  let mockQdrantClient: any;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env = { ...originalEnv };
    // Clear specific env vars that might be set from other tests
    delete process.env.QD_URL;
    delete process.env.QD_API_KEY;

    // Setup default mock implementations
    vi.mocked(getValidatedEnv).mockReturnValue({
      QD_URL: process.env.QD_URL || "http://localhost:6333",
      QD_API_KEY: process.env.QD_API_KEY || "",
      NOMIC_API_KEY: process.env.NOMIC_API_KEY || "test-api-key",
      NODE_ENV: process.env.NODE_ENV || "test",
      NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || "test",
    } as any);
    vi.mocked(isProduction).mockReturnValue(false);

    mockQdrantClient = {
      getCollection: vi.fn(),
      createCollection: vi.fn(),
      upsert: vi.fn(),
      search: vi.fn(),
      scroll: vi.fn(),
      retrieve: vi.fn(),
    };

    (QdrantClient as any).mockImplementation(() => mockQdrantClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original environment
    process.env = originalEnv;
  });

  describe("constructor and ensureCollectionExists", () => {
    it("should create QdrantClient with correct URL and API key", async () => {
      // Setup mock BEFORE creating handler
      vi.mocked(getValidatedEnv).mockReturnValue({
        QD_URL: "http://test-qdrant:6333",
        QD_API_KEY: "test-api-key",
        NOMIC_API_KEY: "test-api-key",
        NODE_ENV: "test",
        NEXT_PUBLIC_ENVIRONMENT: "test",
      } as any);

      handler = new QdrantHandler();

      expect(QdrantClient).toHaveBeenCalledWith({
        url: "http://test-qdrant:6333",
        apiKey: "test-api-key",
      });
    });

    it("should use default values when environment variables are not set", async () => {
      // Setup mock with default values
      vi.mocked(getValidatedEnv).mockReturnValue({
        QD_URL: "http://localhost:6333",
        QD_API_KEY: "",
        NOMIC_API_KEY: "test-api-key",
        NODE_ENV: "test",
        NEXT_PUBLIC_ENVIRONMENT: "test",
      } as any);

      handler = new QdrantHandler();

      expect(QdrantClient).toHaveBeenCalledWith({
        url: "http://localhost:6333",
        apiKey: "",
      });
    });

    it("should check if collection exists on initialization", async () => {
      mockQdrantClient.getCollection.mockResolvedValue({});

      handler = new QdrantHandler();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockQdrantClient.getCollection).toHaveBeenCalledWith(
        "eth_global_showcase",
      );
      expect(logger.info).toHaveBeenCalledWith(
        "Collection 'eth_global_showcase' exists.",
      );
    });

    it("should create collection if it does not exist", async () => {
      mockQdrantClient.getCollection.mockRejectedValue(new Error("Not found"));
      mockQdrantClient.createCollection.mockResolvedValue({});

      handler = new QdrantHandler();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockQdrantClient.createCollection).toHaveBeenCalledWith(
        "eth_global_showcase",
        {
          vectors: {
            size: 768,
            distance: "Cosine",
          },
        },
      );
      expect(logger.info).toHaveBeenCalledWith(
        "Collection not found, creating a new one.",
      );
      expect(logger.info).toHaveBeenCalledWith(
        "Collection 'eth_global_showcase' created successfully.",
      );
    });
  });

  describe("addProject", () => {
    beforeEach(() => {
      mockQdrantClient.getCollection.mockResolvedValue({});
    });

    it("should add project successfully", async () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      const mockEmbedding = Array(768).fill(0.1);

      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [mockEmbedding],
      } as any);

      // Mock findProjectByLink to return null (no existing project)
      mockQdrantClient.scroll.mockResolvedValue({ points: [] });
      mockQdrantClient.upsert.mockResolvedValue({});

      handler = new QdrantHandler();
      await handler.addProject(
        "Test Project",
        "Test Description",
        "How its made",
        "https://github.com/test",
        "https://test.com",
        "ETHGlobal 2024",
      );

      expect(mockQdrantClient.upsert).toHaveBeenCalledWith(
        "eth_global_showcase",
        {
          wait: true,
          points: [
            {
              id: "test-uuid-123",
              vector: mockEmbedding,
              payload: {
                title: "Test Project",
                projectDescription: "Test Description",
                howItsMade: "How its made",
                sourceCode: "https://github.com/test",
                link: "https://test.com",
                hackathon: "ETHGlobal 2024",
                lastUpdated: expect.any(String),
              },
            },
          ],
        },
      );

      expect(logger.info).toHaveBeenCalledWith(
        "Project 'Test Project' from event 'ETHGlobal 2024' upserted to the 'eth_global_showcase'.",
      );
    });

    it("should handle errors when adding project", async () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

      // Mock scroll to return no existing project
      mockQdrantClient.scroll.mockResolvedValue({ points: [] });
      vi.mocked(ollama.embed).mockRejectedValue(new Error("Embedding failed"));

      handler = new QdrantHandler();
      await handler.addProject(
        "Test Project",
        "Test Description",
        "How its made",
        "https://github.com/test",
        "https://test.com",
        "ETHGlobal 2024",
      );

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to add/update project:",
        expect.any(Error),
      );
    });
  });

  describe("createEmbedding", () => {
    beforeEach(() => {
      mockQdrantClient.getCollection.mockResolvedValue({});
    });

    describe("development environment (Ollama)", () => {
      beforeEach(() => {
        process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      });

      it("should create embedding using Ollama in development", async () => {
        const mockEmbedding = Array(768).fill(0.1);
        vi.mocked(ollama.embed).mockResolvedValue({
          embeddings: [mockEmbedding],
        } as any);

        handler = new QdrantHandler();
        const result = await handler.createEmbedding("Test text");

        expect(ollama.embed).toHaveBeenCalledWith({
          model: "nomic-embed-text",
          input: "Test text",
        });
        expect(result).toEqual(mockEmbedding);
        expect(logger.info).toHaveBeenCalledWith(
          "Using Ollama for local embeddings",
        );
        expect(logger.info).toHaveBeenCalledWith(
          "Ollama embedding created successfully",
        );
      });

      it("should handle Ollama connection refused error", async () => {
        const error = new Error("connection refused");
        error.code = "ECONNREFUSED";
        vi.mocked(ollama.embed).mockRejectedValue(error);

        handler = new QdrantHandler();

        await expect(handler.createEmbedding("Test text")).rejects.toThrow(
          "Ollama is not running. Please start Ollama with: 'ollama serve' and pull the model with: 'ollama pull nomic-embed-text'",
        );
      });

      it("should handle other Ollama errors", async () => {
        vi.mocked(ollama.embed).mockRejectedValue(new Error("Model not found"));

        handler = new QdrantHandler();

        await expect(handler.createEmbedding("Test text")).rejects.toThrow(
          "Ollama embedding failed: Model not found",
        );
      });
    });

    describe("production environment (Nomic API)", () => {
      beforeEach(() => {
        process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
        process.env.NOMIC_API_KEY = "test-nomic-key";
        vi.mocked(isProduction).mockReturnValue(true);
        vi.mocked(getValidatedEnv).mockReturnValue({
          QD_URL: process.env.QD_URL || "http://localhost:6333",
          QD_API_KEY: process.env.QD_API_KEY || "",
          NOMIC_API_KEY: "test-nomic-key",
          NODE_ENV: process.env.NODE_ENV || "test",
          NEXT_PUBLIC_ENVIRONMENT: "production",
        } as any);
      });

      it("should create embedding using Nomic API in production", async () => {
        const mockEmbedding = Array(768).fill(0.2);
        vi.mocked(axios.post).mockResolvedValue({
          status: 200,
          data: { embeddings: [mockEmbedding] },
        });

        handler = new QdrantHandler();
        const result = await handler.createEmbedding("Test text");

        expect(axios.post).toHaveBeenCalledWith(
          "https://api-atlas.nomic.ai/v1/embedding/text",
          {
            model: "nomic-embed-text-v1",
            texts: ["Test text"],
          },
          {
            headers: {
              Authorization: "Bearer test-nomic-key",
              "Content-Type": "application/json",
            },
            timeout: 10000,
          },
        );
        expect(result).toEqual(mockEmbedding);
      });

      it("should handle 403 authentication error", async () => {
        const mockError = {
          response: {
            status: 403,
            data: { error: "Invalid API key" },
          },
        };
        vi.mocked(axios.post).mockRejectedValue(mockError);
        vi.mocked(axios.isAxiosError).mockReturnValue(true);

        handler = new QdrantHandler();

        await expect(handler.createEmbedding("Test text")).rejects.toThrow(
          "Nomic API authentication failed (403): Invalid API key. Please check your NOMIC_API_KEY.",
        );
      });

      it("should handle 401 unauthorized error", async () => {
        const mockError = {
          response: {
            status: 401,
            data: { message: "Unauthorized" },
          },
        };
        vi.mocked(axios.post).mockRejectedValue(mockError);
        vi.mocked(axios.isAxiosError).mockReturnValue(true);

        handler = new QdrantHandler();

        await expect(handler.createEmbedding("Test text")).rejects.toThrow(
          "Nomic API unauthorized (401): Unauthorized. API key may be invalid.",
        );
      });

      it("should handle 429 rate limit error", async () => {
        const mockError = {
          response: {
            status: 429,
            data: { error: "Rate limit exceeded" },
          },
        };
        vi.mocked(axios.post).mockRejectedValue(mockError);
        vi.mocked(axios.isAxiosError).mockReturnValue(true);

        handler = new QdrantHandler();

        await expect(handler.createEmbedding("Test text")).rejects.toThrow(
          "Nomic API rate limit exceeded (429): Rate limit exceeded",
        );
      });

      it("should handle generic API errors", async () => {
        const mockError = {
          response: {
            status: 500,
            data: { error: "Internal server error" },
          },
        };
        vi.mocked(axios.post).mockRejectedValue(mockError);
        vi.mocked(axios.isAxiosError).mockReturnValue(true);

        handler = new QdrantHandler();

        await expect(handler.createEmbedding("Test text")).rejects.toThrow(
          "Nomic API error (500): Internal server error",
        );
      });

      it("should handle non-200 response status", async () => {
        vi.mocked(axios.post).mockResolvedValue({
          status: 500,
          data: { error: "Server error" },
        });

        handler = new QdrantHandler();

        await expect(handler.createEmbedding("Test text")).rejects.toThrow(
          "Failed to create embedding",
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Failed to create embedding: ",
          { error: "Server error" },
        );
      });
    });
  });

  describe("searchSimilarProjects", () => {
    beforeEach(() => {
      mockQdrantClient.getCollection.mockResolvedValue({});
    });

    it("should search and return similar projects", async () => {
      const mockSearchResults = [
        {
          payload: {
            title: "Project 1",
            projectDescription: "Description 1",
            link: "https://project1.com",
            howItsMade: "Made with love",
            sourceCode: "https://github.com/project1",
          },
        },
        {
          payload: {
            title: "Project 2",
            projectDescription: "Description 2",
            link: "https://project2.com",
            howItsMade: "Made with care",
            sourceCode: "https://github.com/project2",
          },
        },
      ];

      mockQdrantClient.search.mockResolvedValue(mockSearchResults);

      handler = new QdrantHandler();
      const embedding = Array(768).fill(0.1);
      const results = await handler.searchSimilarProjects(embedding, 10);

      expect(mockQdrantClient.search).toHaveBeenCalledWith(
        "eth_global_showcase",
        {
          vector: embedding,
          limit: 10,
        },
      );

      expect(results).toEqual([
        {
          title: "Project 1",
          description: "Description 1",
          link: "https://project1.com",
          howItsMade: "Made with love",
          sourceCode: "https://github.com/project1",
        },
        {
          title: "Project 2",
          description: "Description 2",
          link: "https://project2.com",
          howItsMade: "Made with care",
          sourceCode: "https://github.com/project2",
        },
      ]);
    });

    it("should use default limit of 5 when not specified", async () => {
      mockQdrantClient.search.mockResolvedValue([]);

      handler = new QdrantHandler();
      const embedding = Array(768).fill(0.1);
      await handler.searchSimilarProjects(embedding);

      expect(mockQdrantClient.search).toHaveBeenCalledWith(
        "eth_global_showcase",
        {
          vector: embedding,
          limit: 5,
        },
      );
    });

    it("should handle search errors and return empty array", async () => {
      mockQdrantClient.search.mockRejectedValue(new Error("Search failed"));

      handler = new QdrantHandler();
      const embedding = Array(768).fill(0.1);
      const results = await handler.searchSimilarProjects(embedding);

      expect(results).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to search for similar projects:",
        expect.any(Error),
      );
    });
  });

  describe("findProjectByLink", () => {
    it("should return null when no project is found", async () => {
      // Mock scroll to return empty points (line 107)
      mockQdrantClient.scroll.mockResolvedValue({ points: [] });

      handler = new QdrantHandler();

      // Access private method using bracket notation
      const result = await (handler as any).findProjectByLink(
        "https://nonexistent.com",
      );

      expect(result).toBeNull();
      expect(mockQdrantClient.scroll).toHaveBeenCalledWith(
        "eth_global_showcase",
        {
          filter: {
            must: [
              {
                key: "link",
                match: {
                  value: "https://nonexistent.com",
                },
              },
            ],
          },
          limit: 1,
        },
      );
    });

    it("should handle findProjectByLink errors and return null", async () => {
      // Mock scroll to throw error (lines 111-113)
      mockQdrantClient.scroll.mockRejectedValue(new Error("Database error"));

      handler = new QdrantHandler();

      // Access private method using bracket notation
      const result = await (handler as any).findProjectByLink(
        "https://test.com",
      );

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to find project by link:",
        expect.any(Error),
      );
    });

    it("should return project when found", async () => {
      const mockProject = {
        id: "test-project-id",
        payload: {
          title: "Test Project",
          link: "https://test.com",
        },
      };

      mockQdrantClient.scroll.mockResolvedValue({ points: [mockProject] });

      handler = new QdrantHandler();

      // Access private method using bracket notation
      const result = await (handler as any).findProjectByLink(
        "https://test.com",
      );

      expect(result).toEqual(mockProject);
    });
  });

  describe("createEmbedding Nomic API edge cases", () => {
    beforeEach(() => {
      mockQdrantClient.getCollection.mockResolvedValue({});
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.NOMIC_API_KEY = "test-nomic-key";
      // Setup production mocks
      vi.mocked(isProduction).mockReturnValue(true);
      vi.mocked(getValidatedEnv).mockReturnValue({
        QD_URL: "http://localhost:6333",
        QD_API_KEY: "",
        NOMIC_API_KEY: "test-nomic-key",
        NODE_ENV: "production",
        NEXT_PUBLIC_ENVIRONMENT: "production",
      } as any);
    });

    it("should handle Nomic API error with unknown error fallback", async () => {
      // Test line 181: "Unknown error" fallback
      const mockError = {
        response: {
          status: 500,
          data: {}, // No error or message field
        },
      };
      vi.mocked(axios.post).mockRejectedValue(mockError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      handler = new QdrantHandler();

      await expect(handler.createEmbedding("Test text")).rejects.toThrow(
        "Nomic API error (500): Unknown error",
      );
    });

    it("should handle Nomic API error with message field", async () => {
      const mockError = {
        response: {
          status: 429,
          data: { message: "Rate limit exceeded" },
        },
      };
      vi.mocked(axios.post).mockRejectedValue(mockError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      handler = new QdrantHandler();

      await expect(handler.createEmbedding("Test text")).rejects.toThrow(
        "Nomic API rate limit exceeded (429): Rate limit exceeded",
      );
    });

    it("should handle Nomic API error with error field", async () => {
      const mockError = {
        response: {
          status: 400,
          data: { error: "Invalid input" },
        },
      };
      vi.mocked(axios.post).mockRejectedValue(mockError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      handler = new QdrantHandler();

      await expect(handler.createEmbedding("Test text")).rejects.toThrow(
        "Nomic API error (400): Invalid input",
      );
    });
  });
});
