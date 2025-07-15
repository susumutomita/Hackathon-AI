#!/usr/bin/env node
import { config } from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { QdrantHandler } from "./qdrantClient.js";
import { z } from "zod";

// Load environment variables
config();

// Define schemas for tool parameters
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

// Initialize MCP server
const server = new Server(
  {
    name: "hackathon-database",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

// Initialize Qdrant handler
let qdrantHandler: QdrantHandler;

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
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
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!qdrantHandler) {
    qdrantHandler = new QdrantHandler();
  }

  switch (request.params.name) {
    case "search_projects": {
      try {
        const args = SearchProjectsSchema.parse(request.params.arguments);

        // Create embedding for the query
        const embedding = await qdrantHandler.createEmbedding(args.query);

        // Search for similar projects
        const results = await qdrantHandler.searchSimilarProjects(
          embedding,
          args.limit,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching projects: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "get_project": {
      try {
        const args = GetProjectByIdSchema.parse(request.params.arguments);

        // Note: This would require adding a method to QdrantHandler to get by ID
        // For now, return an error message
        return {
          content: [
            {
              type: "text",
              text: "Getting project by ID is not yet implemented. Please use search_projects instead.",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting project: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }

    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${request.params.name}`,
          },
        ],
        isError: true,
      };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "hackathon://database/info",
        name: "Database Information",
        description: "Information about the hackathon projects database",
        mimeType: "application/json",
      },
    ],
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "hackathon://database/info") {
    return {
      contents: [
        {
          uri: "hackathon://database/info",
          mimeType: "application/json",
          text: JSON.stringify(
            {
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
                "NOMIC_API_KEY - Nomic API key for embeddings",
              ],
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  return {
    contents: [],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Hackathon Database MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
