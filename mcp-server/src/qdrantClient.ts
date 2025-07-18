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

  private handleOllamaError(
    error: any,
    ollamaUrl: string,
    ollamaModel: string,
  ): never {
    if (
      error.message?.includes("connection refused") ||
      error.code === "ECONNREFUSED"
    ) {
      throw new Error(
        `Ollama is not running at ${ollamaUrl}. Please start Ollama with: 'ollama serve' and pull the model with: 'ollama pull ${ollamaModel}'`,
      );
    }
    throw new Error(`Ollama embedding failed: ${error.message}`);
  }

  public async createEmbedding(text: string): Promise<number[]> {
    const embeddingProvider = process.env.EMBEDDING_PROVIDER || "nomic";

    try {
      if (embeddingProvider === "ollama") {
        // Use Ollama for embeddings
        console.log("Using Ollama for embeddings");

        const ollamaModel = process.env.OLLAMA_MODEL || "nomic-embed-text";
        const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";

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
          this.handleOllamaError(ollamaError, ollamaUrl, ollamaModel);
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
          throw new Error(`Failed to create embedding: ${response.status}`);
        }
      }
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          "Unknown error";

        throw new Error(this.formatHttpError(status, errorMessage));
      }
      throw error;
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
