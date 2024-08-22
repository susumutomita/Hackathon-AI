import { QdrantClient } from "@qdrant/js-client-rest";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import logger from "@/lib/logger";
import { Project } from "@/types";

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
      const embedding = await this.createEmbedding(projectDescription);
      const point = {
        id: uuidv4(),
        vector: embedding,
        payload: {
          title,
          projectDescription,
          howItsMade,
          sourceCode,
          link,
          hackathon,
        },
      };
      await this.client.upsert("eth_global_showcase", {
        wait: true,
        points: [point],
      });
      logger.info(
        `Project '${title}' from event '${hackathon}' added to the 'eth_global_showcase'.`,
      );
    } catch (error) {
      logger.error("Failed to add project:", error);
    }
  }

  public async createEmbedding(text: string): Promise<number[]> {
    const url = "https://api-atlas.nomic.ai/v1/embedding/text";
    const headers = {
      Authorization: `Bearer ${process.env.NOMIC_API_KEY}`,
      "Content-Type": "application/json",
    };
    const data = {
      model: "nomic-embed-text-v1",
      texts: [text],
    };
    try {
      const response = await axios.post(url, data, { headers, timeout: 10000 });
      if (response.status === 200) {
        return response.data.embeddings[0];
      } else {
        logger.error("Failed to create embedding: ", response.data);
        throw new Error("Failed to create embedding");
      }
    } catch (error) {
      logger.error("Error during embedding creation: ", error);
      throw new Error("Error during embedding creation");
    }
  }
  public async searchSimilarProjects(embedding: number[]): Promise<Project[]> {
    try {
      const response = await this.client.search("eth_global_showcase", {
        vector: embedding,
        limit: 5,
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
