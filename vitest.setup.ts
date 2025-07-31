import { vi } from "vitest";

// Try to load dotenv if available
try {
  const { config } = await import("dotenv");
  config({ path: ".env.test" });
} catch {
  // dotenv not available, continue without it
}

// Mock environment variables for tests
process.env.NEXT_PUBLIC_ENVIRONMENT = "test";
process.env.NODE_ENV = "test";

// Ensure API keys are set to test values to prevent actual API calls
process.env.NOMIC_API_KEY = "test-api-key-for-testing";
process.env.QD_API_KEY = "test-qdrant-api-key";
process.env.EMBEDDING_PROVIDER = "ollama"; // Use Ollama to avoid Nomic API calls

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep error and warn for debugging
  error: vi.fn(console.error),
  warn: vi.fn(console.warn),
  // Silence log output during tests
  log: vi.fn(),
};
