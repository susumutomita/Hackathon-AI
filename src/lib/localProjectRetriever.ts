import fs from "node:fs";
import path from "node:path";
import { OllamaAdapter } from "@/adapters/ollama.adapter";
import type { ProjectRetriever } from "@/interfaces/projectRetriever.interface";
import type { Project } from "@/types";

interface EmbeddedProject {
  title: string;
  embedding: number[];
}

export class LocalProjectRetriever implements ProjectRetriever {
  private readonly projectsPath: string;
  private readonly embeddingsPath: string;
  private readonly embeddingProvider: OllamaAdapter;
  private readonly projects: Project[];
  private readonly embeddings: Map<string, number[]>;

  constructor(options?: {
    projectsPath?: string;
    embeddingsPath?: string;
    embeddingModel?: string;
  }) {
    this.projectsPath =
      options?.projectsPath || path.join(process.cwd(), "data", "projects.json");
    this.embeddingsPath =
      options?.embeddingsPath ||
      path.join(process.cwd(), "data", "project-embeddings.json");
    this.embeddingProvider = new OllamaAdapter({
      model: options?.embeddingModel || process.env.OLLAMA_EMBED_MODEL,
    });
    this.projects = readJsonFile<Project[]>(this.projectsPath, []);
    const embeddedProjects = readJsonFile<EmbeddedProject[]>(
      this.embeddingsPath,
      [],
    );
    this.embeddings = new Map(
      embeddedProjects.map((item) => [item.title, item.embedding]),
    );
  }

  async createEmbedding(text: string): Promise<number[]> {
    return this.embeddingProvider.createEmbedding(text);
  }

  async searchSimilarProjects(
    embedding: number[],
    limit: number = 5,
  ): Promise<Project[]> {
    const scored = this.projects
      .map((project) => {
        const projectEmbedding = this.embeddings.get(project.title);
        if (!projectEmbedding) {
          return null;
        }
        return {
          project,
          score: cosineSimilarity(embedding, projectEmbedding),
        };
      })
      .filter(
        (
          item,
        ): item is {
          project: Project;
          score: number;
        } => item !== null,
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ project }) => project);
  }

  async getProjectsByHackathons(
    hackathons: string[],
    limitPerHackathon: number = 10,
  ): Promise<Project[]> {
    const normalized = new Set(hackathons.map((value) => value.toLowerCase()));
    const counts = new Map<string, number>();
    const result: Project[] = [];

    for (const project of this.projects) {
      const hackathon = project.hackathon?.toLowerCase();
      if (!hackathon || !normalized.has(hackathon)) {
        continue;
      }
      const count = counts.get(hackathon) || 0;
      if (count >= limitPerHackathon) {
        continue;
      }
      counts.set(hackathon, count + 1);
      result.push(project);
    }

    return result;
  }

  getProjectCount(): number {
    return this.projects.length;
  }

  getEmbeddingCount(): number {
    return this.embeddings.size;
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) {
    return fallback;
  }

  return JSON.parse(raw) as T;
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) {
    return -1;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return -1;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}
