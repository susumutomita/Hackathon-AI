#!/usr/bin/env node
import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { QdrantHandler, Project } from "./qdrantClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
config({ path: join(__dirname, "../../.env") });

interface SearchOptions {
  query: string;
  limit?: number;
}

async function testSearch(options: SearchOptions): Promise<void> {
  console.log("Testing MCP server functionality...\n");

  try {
    // Initialize handler
    const handler = new QdrantHandler();

    // Search parameters
    const { query, limit = 5 } = options;
    console.log(`Searching for: "${query}"`);
    console.log(`Limit: ${limit}\n`);

    // Create embedding
    console.log("Creating embedding...");
    const embedding = await handler.createEmbedding(query);
    console.log(`✓ Embedding created (length: ${embedding.length})\n`);

    // Search for similar projects
    console.log("Searching for similar projects...");
    const results: Project[] = await handler.searchSimilarProjects(
      embedding,
      limit,
    );

    if (results.length === 0) {
      console.log("No results found. The database might be empty.");
    } else {
      console.log(`✓ Found ${results.length} similar projects:\n`);

      results.forEach((project, index) => {
        console.log(`${index + 1}. ${project.title}`);
        console.log(
          `   Description: ${project.description.substring(0, 100)}...`,
        );
        if (project.link) {
          console.log(`   Link: ${project.link}`);
        }
        if (project.sourceCode) {
          console.log(`   Source: ${project.sourceCode}`);
        }
        console.log("");
      });
    }
  } catch (error: any) {
    console.error("Error during test:", error.message);
    if (
      error.message.includes("403") ||
      error.message.includes("authentication")
    ) {
      console.error(
        "\nAuthentication failed. Please check your API keys in the .env file.",
      );
    } else if (error.message.includes("Ollama")) {
      console.error("\nMake sure Ollama is running: ollama serve");
    }
  }
}

// Parse command line arguments
function parseArgs(): SearchOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run test:search "<query>" [limit]');
    console.error('Example: npm run test:search "NFT marketplace" 10');
    process.exit(1);
  }

  const query = args[0];
  const limit = args[1] ? parseInt(args[1], 10) : undefined;

  if (limit && isNaN(limit)) {
    console.error("Error: Limit must be a number");
    process.exit(1);
  }

  return { query, limit };
}

// Main execution
const options = parseArgs();
testSearch(options).catch(console.error);
