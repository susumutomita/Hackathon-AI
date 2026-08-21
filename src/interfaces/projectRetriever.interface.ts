import type { Project } from "@/types";

export interface ProjectRetriever {
  createEmbedding(text: string): Promise<number[]>;
  searchSimilarProjects(embedding: number[], limit?: number): Promise<Project[]>;
  getProjectsByHackathons(
    hackathons: string[],
    limitPerHackathon?: number,
  ): Promise<Project[]>;
}
