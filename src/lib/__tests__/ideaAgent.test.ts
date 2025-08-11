import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateIdeaFromPrize } from "@/lib/ideaAgent";

// Mock the LLM to avoid real calls
vi.mock("@/lib/llmParser", () => ({
  parseHtmlWithLLM: vi.fn(async () =>
    [
      "タイトル: Prize-fit Onchain Agent",
      "One-liner: プライズ要件に最適化したAA/意図ベースのエージェントでデモを実現",
    ].join("\n"),
  ),
}));

// Mock the QdrantHandlerFactory
vi.mock("@/factories/qdrantHandler.factory", () => ({
  QdrantHandlerFactory: {
    createDefault: vi.fn(() => ({
      createEmbedding: vi.fn(async () => new Array(768).fill(0.1)),
      searchSimilarProjects: vi.fn(async (embedding, limit = 5) => 
        [
          {
            title: "Mock Project 1",
            description: "This is a mock project for testing",
            link: "https://example.com/project1",
            howItsMade: "Made with mock technology",
            sourceCode: "https://github.com/example/project1",
          },
          {
            title: "Mock Project 2",
            description: "Another mock project for testing",
            link: "https://example.com/project2",
            howItsMade: "Also made with mock technology",
            sourceCode: "https://github.com/example/project2",
          },
        ].slice(0, limit)
      ),
    })),
  },
}));

describe("ideaAgent.generateIdeaFromPrize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns synthesized idea and similar projects", async () => {
    const prize =
      "Build an onchain automation agent leveraging account abstraction and intents.";

    const result = await generateIdeaFromPrize(prize);

    expect(result.content).toContain("タイトル:");
    expect(result.similarProjects.length).toBeGreaterThan(0);
    expect(result.similarProjects[0]).toHaveProperty("title");
    expect(result.similarProjects[0]).toHaveProperty("description");
  });
});
