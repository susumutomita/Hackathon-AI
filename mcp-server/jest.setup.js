// jest.setup.js for mcp-server
// Load test environment variables
import { config } from "dotenv";
config({ path: "../.env.test" });

// Mock environment variables for tests
process.env.NODE_ENV = "test";
process.env.EMBEDDING_PROVIDER = "ollama"; // Use Ollama to avoid API calls
process.env.OLLAMA_URL = "http://localhost:11434";
process.env.OLLAMA_MODEL = "nomic-embed-text";
process.env.QD_URL = "http://localhost:6333";
process.env.QD_API_KEY = "test-qdrant-api-key";
