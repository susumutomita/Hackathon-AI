import { QdrantClient } from "@qdrant/js-client-rest";
import axios from "axios";
import ollama from "ollama";

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

  public async createEmbedding(text: string): Promise<number[]> {
    const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === "production";

    try {
      if (!isProduction) {
        // Use Ollama for local embeddings in development
        console.log("Using Ollama for local embeddings");

        try {
          const response = await ollama.embed({
            model: "nomic-embed-text",
            input: text,
          });
          console.log("Ollama embedding created successfully");
          return response.embeddings[0];
        } catch (ollamaError: any) {
          if (
            ollamaError.message?.includes("connection refused") ||
            ollamaError.code === "ECONNREFUSED"
          ) {
            throw new Error(
              "Ollama is not running. Please start Ollama with: 'ollama serve' and pull the model with: 'ollama pull nomic-embed-text'",
            );
          }
          throw new Error(`Ollama embedding failed: ${ollamaError.message}`);
        }
      } else {
        // Use Nomic API in production
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

        if (response.status === 200) {
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

        if (status === 403) {
          throw new Error(`403: authentication failed - ${errorMessage}`);
        } else if (status === 401) {
          throw new Error(`401: unauthorized - ${errorMessage}`);
        } else if (status === 429) {
          throw new Error(`429: rate limit exceeded - ${errorMessage}`);
        } else {
          throw new Error(`${status}: ${errorMessage}`);
        }
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
