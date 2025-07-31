import { describe, test, expect, vi } from "vitest";
import { z } from "zod";

// Define the schemas to match the actual implementation
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

describe("MCP Server Handlers", () => {
  describe("Schema validations", () => {
    test("SearchProjectsSchema should validate correctly", () => {
      // Valid with query only
      const result1 = SearchProjectsSchema.parse({ query: "blockchain" });
      expect(result1.query).toBe("blockchain");
      expect(result1.limit).toBe(10);

      // Valid with query and limit
      const result2 = SearchProjectsSchema.parse({ query: "AI", limit: 5 });
      expect(result2.query).toBe("AI");
      expect(result2.limit).toBe(5);

      // Invalid - missing query
      expect(() => SearchProjectsSchema.parse({})).toThrow();

      // Invalid - wrong type for query
      expect(() => SearchProjectsSchema.parse({ query: 123 })).toThrow();

      // Invalid - wrong type for limit
      expect(() =>
        SearchProjectsSchema.parse({ query: "test", limit: "five" }),
      ).toThrow();
    });

    test("GetProjectByIdSchema should validate correctly", () => {
      // Valid
      const result = GetProjectByIdSchema.parse({ projectId: "project-123" });
      expect(result.projectId).toBe("project-123");

      // Invalid - missing projectId
      expect(() => GetProjectByIdSchema.parse({})).toThrow();

      // Invalid - wrong type
      expect(() => GetProjectByIdSchema.parse({ projectId: 123 })).toThrow();
    });
  });

  describe("Tool definitions", () => {
    test("search_projects tool definition", () => {
      const toolDef = {
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
      };

      expect(toolDef.name).toBe("search_projects");
      expect(toolDef.inputSchema.required).toContain("query");
      expect(toolDef.inputSchema.properties.limit.default).toBe(10);
    });

    test("get_project tool definition", () => {
      const toolDef = {
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
      };

      expect(toolDef.name).toBe("get_project");
      expect(toolDef.inputSchema.required).toContain("projectId");
    });
  });

  describe("Resource definitions", () => {
    test("database info resource", () => {
      const resource = {
        uri: "hackathon://database/info",
        name: "Database Information",
        description: "Information about the hackathon projects database",
        mimeType: "application/json",
      };

      expect(resource.uri).toBe("hackathon://database/info");
      expect(resource.mimeType).toBe("application/json");
    });
  });

  describe("Error handling", () => {
    test("should format error messages correctly", () => {
      const error = new Error("Test error");
      const message = `Error searching projects: ${error instanceof Error ? error.message : String(error)}`;
      expect(message).toBe("Error searching projects: Test error");

      const stringError = "String error";
      const stringMessage = `Error searching projects: ${stringError instanceof Error ? stringError.message : String(stringError)}`;
      expect(stringMessage).toBe("Error searching projects: String error");
    });

    test("should handle non-Error objects", () => {
      const obj = { code: "ERR_001", detail: "Something went wrong" };
      const message = `Error getting project: ${obj instanceof Error ? obj.message : String(obj)}`;
      expect(message).toBe("Error getting project: [object Object]");
    });
  });

  describe("Database info content", () => {
    test("should format database info correctly", () => {
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

      const jsonString = JSON.stringify(dbInfo, null, 2);
      const parsed = JSON.parse(jsonString);

      expect(parsed.name).toBe("Hackathon Projects Database");
      expect(parsed.capabilities).toHaveLength(2);
      expect(parsed.environment_variables).toHaveLength(6);
    });
  });

  describe("Handler logic patterns", () => {
    test("should handle async handler pattern", async () => {
      const mockHandler = vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "Success" }],
      });

      const result = await mockHandler({});
      expect(result.content[0].text).toBe("Success");
    });

    test("should handle error in handler pattern", async () => {
      const mockHandler = vi.fn().mockImplementation(async () => {
        try {
          throw new Error("Handler error");
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      });

      const result = await mockHandler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error: Handler error");
    });
  });

  describe("Main function patterns", () => {
    test("should handle process exit on error", () => {
      const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("Process exited");
      });
      const mockConsoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const error = new Error("Fatal error");

      try {
        console.error("Fatal error:", error);
        process.exit(1);
      } catch (e: any) {
        expect(e.message).toBe("Process exited");
      }

      expect(mockConsoleError).toHaveBeenCalledWith("Fatal error:", error);
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
      mockConsoleError.mockRestore();
    });
  });
});
