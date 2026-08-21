import fs from "node:fs";
import path from "node:path";
import type { QdrantHandler } from "@/lib/qdrantHandler";
import { AgenticIdeaGenerationAgent } from "@/lib/agenticIdeaGenerationAgent";
import { LocalProjectRetriever } from "@/lib/localProjectRetriever";
import type { PrizeInfo } from "@/types/agent.types";

interface CliInput {
  prizeInfo: PrizeInfo;
  focusArea?: string;
  constraints?: string[];
  preferredTech?: string[];
}

async function main(): Promise<void> {
  // Hard force local-only execution for this command.
  process.env.LOCAL_ONLY_LLM = "true";
  process.env.EMBEDDING_PROVIDER = "ollama";
  process.env.NODE_ENV = "development";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error(
      "Usage: pnpm agent:local ./path/to/prize.json [./path/to/report.json]",
    );
  }

  const resolvedInputPath = path.resolve(process.cwd(), inputPath);
  const outputPath = path.resolve(
    process.cwd(),
    process.argv[3] || "agent-report.json",
  );

  const input = JSON.parse(fs.readFileSync(resolvedInputPath, "utf8")) as CliInput;
  if (!input.prizeInfo?.sponsor || !input.prizeInfo?.prizeName) {
    throw new Error("Input JSON must contain prizeInfo.sponsor and prizeInfo.prizeName");
  }

  const retriever = new LocalProjectRetriever();
  console.log(
    `Local dataset: ${retriever.getProjectCount()} projects / ${retriever.getEmbeddingCount()} embeddings`,
  );

  if (retriever.getProjectCount() > 0 && retriever.getEmbeddingCount() === 0) {
    throw new Error(
      "No local embeddings found. Run: pnpm data:index-local",
    );
  }

  // IdeaGenerationAgent currently accepts QdrantHandler, but only relies on the
  // three retrieval methods implemented by LocalProjectRetriever. Keep this cast
  // isolated here until the existing agent is migrated to ProjectRetriever.
  const agent = new AgenticIdeaGenerationAgent(
    retriever as unknown as QdrantHandler,
  );

  const startedAt = Date.now();
  const result = await agent.generateWinningIdea(input.prizeInfo, {
    focusArea: input.focusArea,
    constraints: input.constraints,
    preferredTech: input.preferredTech,
  });

  const report = {
    generatedAt: new Date().toISOString(),
    execution: {
      mode: "local-only",
      llm: process.env.OLLAMA_MODEL || "llama3.1",
      embeddingModel: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
      projectCount: retriever.getProjectCount(),
      elapsedMs: Date.now() - startedAt,
    },
    input,
    result,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("\n=== Final Judge ===");
  console.log(`approved: ${result.judge.approved}`);
  console.log(`score: ${result.judge.score}/10`);
  console.log(`winningProbability: ${result.judge.winningProbability}%`);
  console.log(`revised: ${result.revised}`);
  console.log(result.judge.summary);
  console.log(`\nReport: ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
