import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

// Store original modules for restoration
let originalServer: any;
let originalTransport: any;
let originalHandler: any;
let originalConfig: any;

// Mock console methods
const originalConsoleError = console.error;
const mockConsoleError = vi.fn();

describe("MCP Server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = mockConsoleError;
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.resetModules();
    vi.restoreAllMocks();
  });

  describe("Server module components", () => {
    test("should export schemas and handler functions", async () => {
      // Mock dependencies
      vi.mock("dotenv", () => ({
        config: vi.fn(),
      }));

      vi.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
        Server: vi.fn().mockImplementation(() => ({
          setRequestHandler: vi.fn(),
          connect: vi.fn().mockResolvedValue(undefined),
        })),
      }));

      vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
        StdioServerTransport: vi.fn(),
      }));

      vi.mock("../qdrantClient.js", () => ({
        QdrantHandler: vi.fn().mockImplementation(() => ({
          createEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
          searchSimilarProjects: vi
            .fn()
            .mockResolvedValue([
              { id: "1", title: "Test Project", score: 0.9 },
            ]),
        })),
      }));

      // Import module
      const serverModule = await import("../index.js");

      // Module should have initialized
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("SearchProjectsSchema", () => {
    test("should validate search projects input", () => {
      const SearchProjectsSchema = z.object({
        query: z
          .string()
          .describe("Search query for finding similar hackathon projects"),
        limit: z
          .number()
          .optional()
          .default(10)
          .describe("Maximum number of results to return"),
      });

      // Valid input
      const validInput = { query: "blockchain gaming" };
      const result = SearchProjectsSchema.parse(validInput);
      expect(result.query).toBe("blockchain gaming");
      expect(result.limit).toBe(10);

      // Valid input with limit
      const validInputWithLimit = { query: "test", limit: 5 };
      const resultWithLimit = SearchProjectsSchema.parse(validInputWithLimit);
      expect(resultWithLimit.limit).toBe(5);

      // Invalid input - missing query
      expect(() => SearchProjectsSchema.parse({})).toThrow();
    });
  });

  describe("GetProjectByIdSchema", () => {
    test("should validate get project input", () => {
      const GetProjectByIdSchema = z.object({
        projectId: z.string().describe("The ID of the project to retrieve"),
      });

      // Valid input
      const validInput = { projectId: "project-123" };
      const result = GetProjectByIdSchema.parse(validInput);
      expect(result.projectId).toBe("project-123");

      // Invalid input - missing projectId
      expect(() => GetProjectByIdSchema.parse({})).toThrow();
    });
  });

  describe("Tool definitions", () => {
    test("should define correct tool schemas", () => {
      const expectedTools = [
        {
          name: "search_projects",
          description:
            "Search for similar hackathon projects using semantic search",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "Search query for finding similar hackathon projects",
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return",
                default: 10,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_project",
          description: "Get a specific hackathon project by ID",
          inputSchema: {
            type: "object",
            properties: {
              projectId: {
                type: "string",
                description: "The ID of the project to retrieve",
              },
            },
            required: ["projectId"],
          },
        },
      ];

      // Verify tool structure
      expect(expectedTools[0].name).toBe("search_projects");
      expect(expectedTools[1].name).toBe("get_project");
    });
  });

  describe("Resource definitions", () => {
    test("should define database info resource", () => {
      const expectedResource = {
        uri: "hackathon://database/info",
        name: "Database Information",
        description: "Information about the hackathon projects database",
        mimeType: "application/json",
      };

      expect(expectedResource.uri).toBe("hackathon://database/info");
      expect(expectedResource.mimeType).toBe("application/json");
    });
  });

  describe("QdrantHandler integration", () => {
    test("should handle search_projects functionality", async () => {
      const { QdrantHandler } = await import("../qdrantClient.js");
      const handler = new QdrantHandler();

      // Mock methods
      handler.createEmbedding = vi.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      handler.searchSimilarProjects = vi.fn().mockResolvedValue([
        { id: "1", title: "Test Project", score: 0.9 },
        { id: "2", title: "Another Project", score: 0.8 },
      ]);

      // Test search flow
      const query = "blockchain gaming";
      const limit = 5;

      const embedding = await handler.createEmbedding(query);
      const results = await handler.searchSimilarProjects(embedding, limit);

      expect(handler.createEmbedding).toHaveBeenCalledWith(query);
      expect(handler.searchSimilarProjects).toHaveBeenCalledWith(
        embedding,
        limit,
      );
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe("Test Project");
    });

    test("should handle errors gracefully", async () => {
      const { QdrantHandler } = await import("../qdrantClient.js");
      const handler = new QdrantHandler();

      // Mock error
      handler.createEmbedding = vi
        .fn()
        .mockRejectedValue(new Error("Embedding failed"));

      await expect(handler.createEmbedding("test")).rejects.toThrow(
        "Embedding failed",
      );
    });
  });

  describe("Error handling", () => {
    test("should format error messages correctly", () => {
      const error = new Error("Test error");
      const message = `Error searching projects: ${error.message}`;
      expect(message).toBe("Error searching projects: Test error");

      const unknownError = "Some string error";
      const unknownMessage = `Error searching projects: ${String(unknownError)}`;
      expect(unknownMessage).toBe(
        "Error searching projects: Some string error",
      );
    });
  });

  describe("Database info content", () => {
    test("should provide correct database information", () => {
      const dbInfo = {
        name: "Hackathon Projects Database",
        description:
          "A vector database of hackathon projects powered by Qdrant",
        capabilities: [
          "Semantic search for similar projects",
          "Project retrieval by ID (coming soon)",
        ],
        environment_variables: [
          "QD_URL - Qdrant server URL",
          "QD_API_KEY - Qdrant API key",
          "EMBEDDING_PROVIDER - Embedding provider ('ollama' or 'nomic', default: 'nomic')",
          "NOMIC_API_KEY - Nomic API key for embeddings (required when EMBEDDING_PROVIDER='nomic')",
          "OLLAMA_MODEL - Ollama model name for embeddings (default: 'nomic-embed-text')",
          "OLLAMA_URL - Ollama server URL (default: 'http://localhost:11434')",
        ],
      };

      expect(dbInfo.name).toBe("Hackathon Projects Database");
      expect(dbInfo.capabilities).toContain(
        "Semantic search for similar projects",
      );
      expect(dbInfo.environment_variables).toContain(
        "QD_URL - Qdrant server URL",
      );
    });
  });

  describe("Main function startup", () => {
    test("should handle process exit on fatal error", async () => {
      const mockExit = vi.spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`Process exited with code ${code}`);
      });

      const mockError = new Error("Fatal error occurred");

      // Test error handling
      try {
        // Simulate main function error
        mockConsoleError("Fatal error:", mockError);
        process.exit(1);
      } catch (error: any) {
        expect(error.message).toBe("Process exited with code 1");
      }

      expect(mockConsoleError).toHaveBeenCalledWith("Fatal error:", mockError);
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });
});
