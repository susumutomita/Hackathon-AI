/**
 * QdrantHandler - Secure Error Handling Guidelines
 *
 * Security Principles:
 * 1. NEVER expose API keys in error messages
 * 2. Sanitize all error messages in production environment
 * 3. Remove sensitive information: URLs, model names, service details
 * 4. Provide generic error messages to end users in production
 * 5. Log detailed errors server-side only (not in client responses)
 *
 * Environment-specific behavior:
 * - Development (NODE_ENV !== 'production'): Show detailed errors for debugging
 * - Production (NODE_ENV === 'production'): Show sanitized, generic errors
 *
 * Sensitive information that must be protected:
 * - API keys (NOMIC_API_KEY, QD_API_KEY)
 * - Internal service URLs
 * - Model names and versions
 * - File system paths
 * - Internal service names
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import axios from "axios";
import ollama from "ollama";
import { StatusCodes } from "http-status-codes";

export interface Project {
  title: string;
  description: string;
  link?: string;
  howItsMade?: string;
  sourceCode?: string;
}

// Error type interfaces
interface OllamaError {
  message?: string;
  code?: string;
}

interface HttpError {
  response?: {
    status: number;
    statusText?: string;
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

interface GeneralError {
  message?: string;
  [key: string]: unknown;
}

// Type guard functions
function isHttpError(error: unknown): error is HttpError {
  return (
    error !== null &&
    typeof error === "object" &&
    "response" in error &&
    error.response !== null &&
    typeof error.response === "object" &&
    "status" in error.response
  );
}

function isOllamaError(error: unknown): error is OllamaError {
  return (
    error !== null &&
    typeof error === "object" &&
    ("message" in error || "code" in error)
  );
}

function isGeneralError(error: unknown): error is GeneralError {
  return error !== null && typeof error === "object";
}

export class QdrantHandler {
  private client: QdrantClient;

  constructor() {
    const url = process.env.QD_URL || "http://localhost:6333";
    const apiKey = process.env.QD_API_KEY || "";
    this.client = new QdrantClient({ url, apiKey });
  }

  /**
   * Check if running in production environment
   */
  private isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  }

  /**
   * Sanitize error messages for production environment
   * Removes sensitive information like URLs, API endpoints, and model details
   */
  private sanitizeErrorMessage(message: string): string {
    if (!this.isProduction()) {
      return message;
    }

    // Remove URLs
    let sanitized = message.replace(/https?:\/\/[^\s]+/g, "[URL_REDACTED]");

    // Remove localhost references
    sanitized = sanitized.replace(/localhost:\d+/g, "[LOCAL_SERVICE]");

    // Remove model names
    sanitized = sanitized.replace(/nomic-embed-text(-v\d+)?/g, "[MODEL]");

    // Remove specific service names
    sanitized = sanitized.replace(/Ollama|Nomic|Qdrant/gi, "[SERVICE]");

    // Remove file paths
    sanitized = sanitized.replace(/\/[\w\/.-]+/g, "[PATH]");

    // Ensure no API keys are exposed (generic pattern)
    sanitized = sanitized.replace(/[A-Za-z0-9_-]{20,}/g, "[REDACTED]");

    return sanitized;
  }

  private formatHttpError(status: number, errorMessage: string): string {
    switch (status) {
      case StatusCodes.FORBIDDEN:
        return `${StatusCodes.FORBIDDEN}: authentication failed - ${errorMessage}`;
      case StatusCodes.UNAUTHORIZED:
        return `${StatusCodes.UNAUTHORIZED}: unauthorized - ${errorMessage}`;
      case StatusCodes.TOO_MANY_REQUESTS:
        return `${StatusCodes.TOO_MANY_REQUESTS}: rate limit exceeded - ${errorMessage}`;
      default:
        return `${status}: ${errorMessage}`;
    }
  }

  private formatError(error: unknown, context: string = "Embedding"): string {
    // Handle HTTP errors
    if (isHttpError(error) && error.response) {
      const status = error.response.status;
      const errorMessage =
        error.response.data?.error ||
        error.response.data?.message ||
        "Unknown error";
      const httpError = `${context} failed: ${this.formatHttpError(status, errorMessage)}`;
      return this.sanitizeErrorMessage(httpError);
    }

    // Handle Ollama-specific errors
    if (context === "Ollama" && isOllamaError(error)) {
      if (
        error.message?.includes("connection refused") ||
        error.code === "ECONNREFUSED"
      ) {
        // In production, provide generic message
        if (this.isProduction()) {
          return `${context} failed: Service is not available. Please contact support.`;
        }
        // In development, provide detailed instructions
        const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
        const ollamaModel = process.env.OLLAMA_MODEL || "nomic-embed-text";
        return `${context} failed: Ollama is not running at ${ollamaUrl}. Please start Ollama with: 'ollama serve' and pull the model with: 'ollama pull ${ollamaModel}'`;
      }
      const errorMsg = `${context} failed: ${error.message || "Unknown Ollama error"}`;
      return this.sanitizeErrorMessage(errorMsg);
    }

    // Handle configuration errors
    if (
      isGeneralError(error) &&
      error.message?.includes("environment variable")
    ) {
      // Never expose which environment variable is missing in production
      if (this.isProduction()) {
        return `${context} failed: Configuration error. Please contact support.`;
      }
      // In development, show the actual missing variable (but ensure no API key values)
      const configError = error.message.replace(
        /[A-Za-z0-9_-]{20,}/g,
        "[REDACTED]",
      );
      return `${context} failed: Configuration error - ${configError}`;
    }

    // Handle general errors
    if (isGeneralError(error)) {
      const errorMsg = `${context} failed: ${error.message || "Unknown error"}`;
      return this.sanitizeErrorMessage(errorMsg);
    }

    // Fallback for unknown error types
    return `${context} failed: ${this.isProduction() ? "An error occurred" : "Unknown error"}`;
  }

  private handleOllamaError(error: unknown): never {
    throw new Error(this.formatError(error, "Ollama"));
  }

  public async createEmbedding(text: string): Promise<number[]> {
    const embeddingProvider = process.env.EMBEDDING_PROVIDER || "nomic";

    try {
      if (embeddingProvider === "ollama") {
        // Use Ollama for embeddings
        console.log("Using Ollama for embeddings");

        const ollamaModel = process.env.OLLAMA_MODEL || "nomic-embed-text";

        try {
          const response = await ollama.embed({
            model: ollamaModel,
            input: text,
          });
          console.log(
            `Ollama embedding created successfully with model: ${ollamaModel}`,
          );
          return response.embeddings[0];
        } catch (ollamaError: unknown) {
          this.handleOllamaError(ollamaError);
        }
      } else {
        // Use Nomic API
        const url = "https://api-atlas.nomic.ai/v1/embedding/text";
        const apiKey = process.env.NOMIC_API_KEY;

        if (!apiKey) {
          throw new Error("NOMIC_API_KEY environment variable is not set");
        }

        const headers = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
        const data = {
          model: "nomic-embed-text-v1",
          texts: [text],
        };

        const response = await axios.post(url, data, {
          headers,
          timeout: 10000,
        });

        if (response.status === StatusCodes.OK) {
          return response.data.embeddings[0];
        } else {
          const error = {
            response: {
              status: response.status,
              data: { message: `Unexpected status code: ${response.status}` },
            },
          };
          throw new Error(this.formatError(error, "Embedding"));
        }
      }
    } catch (error: unknown) {
      // Re-throw if already formatted
      if (error instanceof Error && error.message?.includes("failed:")) {
        throw error;
      }
      // Format and throw with appropriate context
      const context =
        process.env.EMBEDDING_PROVIDER === "ollama" ? "Ollama" : "Embedding";
      throw new Error(this.formatError(error, context));
    }
  }

  public async searchSimilarProjects(
    embedding: number[],
    limit: number = 10,
  ): Promise<Project[]> {
    try {
      const response = await this.client.search("eth_global_showcase", {
        vector: embedding,
        limit,
      });

      return response.map((item: any) => ({
        title: item.payload.title || "",
        description: item.payload.projectDescription || "",
        link: item.payload.link,
        howItsMade: item.payload.howItsMade,
        sourceCode: item.payload.sourceCode,
      }));
    } catch (error) {
      console.error("Failed to search for similar projects:", error);
      throw error;
    }
  }
}
