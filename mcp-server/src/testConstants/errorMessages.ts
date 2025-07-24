/**
 * Common error messages used in tests for consistent error checking
 * These messages should match the actual error messages thrown by the QdrantHandler
 */

export const ERROR_MESSAGES = {
  // Configuration errors
  NOMIC_API_KEY_MISSING: "NOMIC_API_KEY environment variable is not set",
  NOMIC_API_KEY_MISSING_PRODUCTION:
    "Embedding failed: Configuration error. Please contact support.",
  INVALID_PROVIDER: /Unsupported embedding provider: .+/,

  // Ollama errors
  OLLAMA_NOT_RUNNING_DEV:
    /Ollama failed: Ollama is not running at .+\. Please start Ollama with: 'ollama serve' and pull the model with: 'ollama pull .+'/,
  OLLAMA_NOT_RUNNING_PROD:
    "Ollama failed: Service is not available. Please contact support.",

  // HTTP errors
  AUTH_FAILED_403: /Embedding failed: 403: authentication failed/,
  UNAUTHORIZED_401: /Embedding failed: 401: unauthorized/,
  RATE_LIMIT_429: /Embedding failed: 429: rate limit exceeded/,

  // Generic errors
  EMBEDDING_FAILED: "Embedding failed:",
  OLLAMA_FAILED: "Ollama failed:",
  UNKNOWN_ERROR: "Unknown error",
} as const;
