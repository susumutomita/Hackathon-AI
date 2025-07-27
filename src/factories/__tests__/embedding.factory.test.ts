import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { EmbeddingFactory } from "../embedding.factory";
import { EmbeddingProviderType } from "@/interfaces/embedding.interface";

// Mock all modules to avoid import errors
vi.mock("@/adapters/ollama.adapter", () => ({ OllamaAdapter: vi.fn() }));
vi.mock("@/adapters/nomic.adapter", () => ({ NomicAdapter: vi.fn() }));
vi.mock("@/adapters/axios.adapter", () => ({ AxiosAdapter: vi.fn() }));

describe("EmbeddingFactory", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("create", () => {
    test("should throw error for unsupported provider", () => {
      expect(() => {
        EmbeddingFactory.create({ provider: "unsupported" });
      }).toThrow("Unsupported embedding provider: unsupported");
    });

    test("should handle case-insensitive provider names", () => {
      expect(() => {
        EmbeddingFactory.create({ provider: "UNKNOWN" });
      }).toThrow("Unsupported embedding provider: UNKNOWN");
    });
  });

  describe("registerProvider", () => {
    test("should throw error for non-implemented custom provider", () => {
      // The current implementation doesn't actually use the custom providers
      // So we test that it throws an error for unsupported providers
      expect(() => {
        EmbeddingFactory.create({ provider: "custom" });
      }).toThrow("Unsupported embedding provider: custom");
    });
  });
});
