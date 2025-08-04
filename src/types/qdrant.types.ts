import { Project } from "@/types";

export interface QdrantPoint {
  id: string | number;
  vector?: number[] | null;
  payload?: QdrantPayload | Record<string, unknown> | null;
}

export interface QdrantPayload extends Partial<Project> {
  lastUpdated?: string;
}

export interface QdrantSearchResult {
  id: string | number;
  version?: number;
  score?: number;
  payload: QdrantPayload;
  vector?: number[];
}

export interface OllamaEmbeddingResponse {
  embeddings: number[][];
}

export interface OllamaError {
  message: string;
  code?: string;
  status?: number;
}
