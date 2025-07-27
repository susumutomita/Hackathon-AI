/**
 * Interface for vector database clients
 * Defines the contract for vector similarity search operations
 */
export interface VectorDBClient {
  /**
   * Searches for similar vectors in a collection
   * @param collection The name of the collection to search in
   * @param query The search query containing the vector and parameters
   * @returns A promise that resolves to an array of search results
   * @throws VectorDBError if the search fails
   */
  search<T = any>(
    collection: string,
    query: VectorSearchQuery,
  ): Promise<VectorSearchResult<T>[]>;

  /**
   * Upserts (inserts or updates) vectors into a collection
   * @param collection The name of the collection
   * @param points The points to upsert
   * @returns A promise that resolves when the operation completes
   * @throws VectorDBError if the operation fails
   */
  upsert?(collection: string, points: VectorPoint[]): Promise<void>;

  /**
   * Creates a new collection
   * @param collection The name of the collection to create
   * @param config Collection configuration
   * @returns A promise that resolves when the collection is created
   * @throws VectorDBError if the creation fails
   */
  createCollection?(
    collection: string,
    config?: CollectionConfig,
  ): Promise<void>;

  /**
   * Deletes vectors from a collection
   * @param collection The name of the collection
   * @param ids The IDs of the vectors to delete
   * @returns A promise that resolves when the deletion completes
   * @throws VectorDBError if the deletion fails
   */
  delete?(collection: string, ids: string[]): Promise<void>;
}

/**
 * Query parameters for vector search
 */
export interface VectorSearchQuery {
  /**
   * The vector to search for similar vectors
   */
  vector: number[];

  /**
   * Maximum number of results to return
   */
  limit: number;

  /**
   * Optional filter conditions
   */
  filter?: Record<string, any>;

  /**
   * Optional score threshold
   */
  scoreThreshold?: number;
}

/**
 * Result of a vector search
 */
export interface VectorSearchResult<T = any> {
  /**
   * Unique identifier of the result
   */
  id: string | number;

  /**
   * Similarity score (higher is more similar)
   */
  score: number;

  /**
   * The payload/data associated with the vector
   */
  payload?: T;
}

/**
 * Vector point for insertion
 */
export interface VectorPoint {
  /**
   * Unique identifier for the vector
   */
  id: string | number;

  /**
   * The vector values
   */
  vector: number[];

  /**
   * Optional payload to store with the vector
   */
  payload?: Record<string, any>;
}

/**
 * Collection configuration
 */
export interface CollectionConfig {
  /**
   * Dimension of the vectors
   */
  vectorSize: number;

  /**
   * Distance metric to use
   */
  distance?: "Cosine" | "Euclidean" | "Dot";

  /**
   * Additional configuration options
   */
  [key: string]: any;
}

/**
 * Error that can be thrown by vector database operations
 */
export class VectorDBError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "VectorDBError";
  }
}
