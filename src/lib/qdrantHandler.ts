import { QdrantClient } from "@qdrant/js-client-rest";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import logger from "@/lib/logger";
import { Project } from "@/types";
import ollama from "ollama";

export class QdrantHandler {
  private client: QdrantClient;

  constructor() {
    const url = process.env.QD_URL || "http://localhost:6333";
    const apiKey = process.env.QD_API_KEY || "";
    this.client = new QdrantClient({ url, apiKey });
    this.ensureCollectionExists();
  }

  private async ensureCollectionExists() {
    try {
      await this.client.getCollection("eth_global_showcase");
      logger.info("Collection 'eth_global_showcase' exists.");
    } catch (e) {
      logger.info("Collection not found, creating a new one.");
      await this.client.createCollection("eth_global_showcase", {
        vectors: {
          size: 768,
          distance: "Cosine",
        },
      });
      logger.info("Collection 'eth_global_showcase' created successfully.");
    }
  }

  public async addProject(
    title: string,
    projectDescription: string,
    howItsMade: string,
    sourceCode: string,
    link: string,
    hackathon: string,
  ) {
    try {
      // 既存のプロジェクトをリンクで検索
      const existingProject = await this.findProjectByLink(link);

      let projectId: string;
      if (existingProject) {
        // 既存のプロジェクトが見つかった場合、そのIDを使用
        projectId = existingProject.id;
        logger.info(
          `Found existing project '${title}' with ID: ${projectId}. Updating...`,
        );
      } else {
        // 新規プロジェクトの場合
        // 後方互換性のため、UUIDを使用（既存システムとの互換性維持）
        projectId = uuidv4();
        logger.info(`Creating new project '${title}' with ID: ${projectId}`);
      }

      const embedding = await this.createEmbedding(projectDescription);
      const point = {
        id: projectId,
        vector: embedding,
        payload: {
          title,
          projectDescription,
          howItsMade,
          sourceCode,
          link,
          hackathon,
          lastUpdated: new Date().toISOString(),
        },
      };

      await this.client.upsert("eth_global_showcase", {
        wait: true,
        points: [point],
      });

      logger.info(
        `Project '${title}' from event '${hackathon}' upserted to the 'eth_global_showcase'.`,
      );
    } catch (error) {
      logger.error("Failed to add/update project:", error);
    }
  }

  private async findProjectByLink(link: string): Promise<any | null> {
    try {
      // ペイロードフィルターを使用してリンクで検索
      const searchResult = await this.client.scroll("eth_global_showcase", {
        filter: {
          must: [
            {
              key: "link",
              match: {
                value: link,
              },
            },
          ],
        },
        limit: 1,
      });

      if (searchResult.points && searchResult.points.length > 0) {
        return searchResult.points[0];
      }

      return null;
    } catch (error) {
      logger.error("Failed to find project by link:", error);
      return null;
    }
  }

  public async createEmbedding(text: string): Promise<number[]> {
    const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === "production";

    try {
      if (!isProduction) {
        // Use Ollama for local embeddings in development
        logger.info("Using Ollama for local embeddings");

        // First, check if Ollama is running and the model is available
        try {
          const response = await ollama.embed({
            model: "nomic-embed-text",
            input: text,
          });
          logger.info("Ollama embedding created successfully");
          return response.embeddings[0];
        } catch (ollamaError: any) {
          // If Ollama fails, provide helpful error message
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

        // Debug log to check if API key is loaded
        logger.info("Nomic API Key present:", !!apiKey);

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
          logger.error("Failed to create embedding: ", response.data);
          throw new Error("Failed to create embedding");
        }
      }
    } catch (error: any) {
      logger.error("Error during embedding creation: ", error);

      // Check if it's an axios error with response
      if (error.response) {
        const status = error.response.status;
        const errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          "Unknown error";

        if (status === 403) {
          throw new Error(
            `Nomic API authentication failed (403): ${errorMessage}. Please check your NOMIC_API_KEY.`,
          );
        } else if (status === 401) {
          throw new Error(
            `Nomic API unauthorized (401): ${errorMessage}. API key may be invalid.`,
          );
        } else if (status === 429) {
          throw new Error(
            `Nomic API rate limit exceeded (429): ${errorMessage}`,
          );
        } else {
          throw new Error(`Nomic API error (${status}): ${errorMessage}`);
        }
      }

      throw new Error(`Error during embedding creation: ${error.message}`);
    }
  }
  public async searchSimilarProjects(
    embedding: number[],
    limit: number = 5,
  ): Promise<Project[]> {
    try {
      const response = await this.client.search("eth_global_showcase", {
        vector: embedding,
        limit,
      });

      console.log("Full response object:", JSON.stringify(response, null, 2));
      return response.map((item: any) => ({
        title: item.payload.title,
        description: item.payload.projectDescription,
        link: item.payload.link,
        howItsMade: item.payload.howItsMade,
        sourceCode: item.payload.sourceCode,
      }));
    } catch (error) {
      logger.error("Failed to search for similar projects:", error);
      return [];
    }
  }
}
