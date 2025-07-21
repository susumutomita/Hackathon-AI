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

export class QdrantHandler {
  private client: QdrantClient;

  constructor() {
    const url = process.env.QD_URL || "http://localhost:6333";
    const apiKey = process.env.QD_API_KEY || "";
    this.client = new QdrantClient({ url, apiKey });
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

  private formatError(error: any, context: string = "Embedding"): string {
    // Handle HTTP errors
    if (error.response) {
      const status = error.response.status;
      const errorMessage =
        error.response.data?.error ||
        error.response.data?.message ||
        "Unknown error";
      return `${context} failed: ${this.formatHttpError(status, errorMessage)}`;
    }

    // Handle Ollama-specific errors
    if (context === "Ollama") {
      const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
      const ollamaModel = process.env.OLLAMA_MODEL || "nomic-embed-text";

      if (
        error.message?.includes("connection refused") ||
        error.code === "ECONNREFUSED"
      ) {
        return `${context} failed: Ollama is not running at ${ollamaUrl}. Please start Ollama with: 'ollama serve' and pull the model with: 'ollama pull ${ollamaModel}'`;
      }
      return `${context} failed: ${error.message || "Unknown Ollama error"}`;
    }

    // Handle configuration errors
    if (error.message?.includes("environment variable")) {
      return `${context} failed: Configuration error - ${error.message}`;
    }

    // Handle general errors
    return `${context} failed: ${error.message || "Unknown error"}`;
  }

  private handleOllamaError(error: any): never {
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
        } catch (ollamaError: any) {
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
    } catch (error: any) {
      // Re-throw if already formatted
      if (error.message?.includes("failed:")) {
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
