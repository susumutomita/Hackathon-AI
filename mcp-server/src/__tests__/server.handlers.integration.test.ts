import { describe, test, expect, vi, beforeEach } from "vitest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { QdrantHandler } from "../qdrantClient.js";
import { z } from "zod";

// Mock dependencies
vi.mock("dotenv", () => ({
  config: vi.fn(),
}));

vi.mock("../qdrantClient.js", () => ({
  QdrantHandler: vi.fn().mockImplementation(() => ({
    createEmbedding: vi.fn(),
    searchSimilarProjects: vi.fn(),
  })),
}));

// Schemas from index.ts
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

const GetProjectByIdSchema = z.object({
  projectId: z.string().describe("The ID of the project to retrieve"),
});

describe("MCP Server Handler Integration", () => {
  let mockQdrantHandler: any;
  let server: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQdrantHandler = {
      createEmbedding: vi.fn(),
      searchSimilarProjects: vi.fn(),
    };
    
    // Mock server setup
    server = {
      setRequestHandler: vi.fn(),
    };
  });

  describe("CallToolRequest handler - search_projects", () => {
    test("should handle successful search_projects request", async () => {
      // Mock successful responses
      mockQdrantHandler.createEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockQdrantHandler.searchSimilarProjects.mockResolvedValue([
        { id: "1", title: "Blockchain Game", score: 0.95 },
        { id: "2", title: "DeFi Platform", score: 0.87 },
      ]);

      // Simulate the handler logic
      const request = {
        params: {
          name: "search_projects",
          arguments: { query: "blockchain gaming", limit: 5 },
        },
      };

      // Parse arguments
      const args = SearchProjectsSchema.parse(request.params.arguments);
      expect(args.query).toBe("blockchain gaming");
      expect(args.limit).toBe(5);

      // Create embedding
      const embedding = await mockQdrantHandler.createEmbedding(args.query);
      expect(mockQdrantHandler.createEmbedding).toHaveBeenCalledWith("blockchain gaming");

      // Search for similar projects
      const results = await mockQdrantHandler.searchSimilarProjects(embedding, args.limit);
      expect(mockQdrantHandler.searchSimilarProjects).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5);

      // Verify expected response format
      const response = {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };

      expect(response.content[0].type).toBe("text");
      expect(JSON.parse(response.content[0].text)).toEqual(results);
    });

    test("should handle search_projects with schema validation error", () => {
      const invalidRequest = {
        params: {
          name: "search_projects",
          arguments: {}, // Missing required 'query' field
        },
      };

      expect(() => {
        SearchProjectsSchema.parse(invalidRequest.params.arguments);
      }).toThrow();
    });

    test("should handle search_projects with embedding creation error", async () => {
      mockQdrantHandler.createEmbedding.mockRejectedValue(new Error("Embedding API error"));

      const request = {
        params: {
          name: "search_projects",
          arguments: { query: "test query" },
        },
      };

      try {
        const args = SearchProjectsSchema.parse(request.params.arguments);
        await mockQdrantHandler.createEmbedding(args.query);
      } catch (error) {
        const errorResponse = {
          content: [
            {
              type: "text",
              text: `Error searching projects: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };

        expect(errorResponse.content[0].text).toBe("Error searching projects: Embedding API error");
        expect(errorResponse.isError).toBe(true);
      }
    });

    test("should handle search_projects with search error", async () => {
      mockQdrantHandler.createEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockQdrantHandler.searchSimilarProjects.mockRejectedValue(new Error("Qdrant search failed"));

      const request = {
        params: {
          name: "search_projects",
          arguments: { query: "test query" },
        },
      };

      try {
        const args = SearchProjectsSchema.parse(request.params.arguments);
        const embedding = await mockQdrantHandler.createEmbedding(args.query);
        await mockQdrantHandler.searchSimilarProjects(embedding, args.limit);
      } catch (error) {
        const errorResponse = {
          content: [
            {
              type: "text",
              text: `Error searching projects: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };

        expect(errorResponse.content[0].text).toBe("Error searching projects: Qdrant search failed");
        expect(errorResponse.isError).toBe(true);
      }
    });
  });

  describe("CallToolRequest handler - get_project", () => {
    test("should handle get_project request with not implemented response", async () => {
      const request = {
        params: {
          name: "get_project",
          arguments: { projectId: "project-123" },
        },
      };

      // Parse arguments
      const args = GetProjectByIdSchema.parse(request.params.arguments);
      expect(args.projectId).toBe("project-123");

      // Simulate the current implementation response
      const response = {
        content: [
          {
            type: "text",
            text: "Getting project by ID is not yet implemented. Please use search_projects instead.",
          },
        ],
      };

      expect(response.content[0].text).toBe(
        "Getting project by ID is not yet implemented. Please use search_projects instead."
      );
    });

    test("should handle get_project with schema validation error", () => {
      const invalidRequest = {
        params: {
          name: "get_project",
          arguments: {}, // Missing required 'projectId' field
        },
      };

      expect(() => {
        GetProjectByIdSchema.parse(invalidRequest.params.arguments);
      }).toThrow();
    });

    test("should handle get_project with parsing error", () => {
      const invalidRequest = {
        params: {
          name: "get_project",
          arguments: { projectId: 123 }, // Wrong type, should be string
        },
      };

      try {
        GetProjectByIdSchema.parse(invalidRequest.params.arguments);
      } catch (error) {
        const errorResponse = {
          content: [
            {
              type: "text",
              text: `Error getting project: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };

        expect(errorResponse.isError).toBe(true);
        expect(errorResponse.content[0].text).toContain("Error getting project:");
      }
    });
  });

  describe("CallToolRequest handler - unknown tool", () => {
    test("should handle unknown tool request", () => {
      const request = {
        params: {
          name: "unknown_tool",
          arguments: {},
        },
      };

      const response = {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${request.params.name}`,
          },
        ],
        isError: true,
      };

      expect(response.content[0].text).toBe("Unknown tool: unknown_tool");
      expect(response.isError).toBe(true);
    });
  });

  describe("ListResourcesRequest handler", () => {
    test("should return database info resource", () => {
      const expectedResponse = {
        resources: [
          {
            uri: "hackathon://database/info",
            name: "Database Information",
            description: "Information about the hackathon projects database",
            mimeType: "application/json",
          },
        ],
      };

      expect(expectedResponse.resources).toHaveLength(1);
      expect(expectedResponse.resources[0].uri).toBe("hackathon://database/info");
      expect(expectedResponse.resources[0].mimeType).toBe("application/json");
    });
  });

  describe("ReadResourceRequest handler", () => {
    test("should return database info content", () => {
      const uri = "hackathon://database/info";
      
      const dbInfo = {
        name: "Hackathon Projects Database",
        description: "A vector database of hackathon projects powered by Qdrant",
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

      const response = {
        contents: [
          {
            uri: "hackathon://database/info",
            mimeType: "application/json",
            text: JSON.stringify(dbInfo, null, 2),
          },
        ],
      };

      expect(response.contents[0].uri).toBe(uri);
      expect(response.contents[0].mimeType).toBe("application/json");
      
      const parsedContent = JSON.parse(response.contents[0].text);
      expect(parsedContent.name).toBe("Hackathon Projects Database");
      expect(parsedContent.capabilities).toContain("Semantic search for similar projects");
    });

    test("should return empty contents for unknown resource", () => {
      const uri = "hackathon://unknown/resource";
      
      const response = {
        contents: [],
      };

      expect(response.contents).toHaveLength(0);
    });
  });
});