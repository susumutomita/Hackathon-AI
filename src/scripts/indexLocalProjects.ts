import fs from "node:fs";
import path from "node:path";
import { OllamaAdapter } from "@/adapters/ollama.adapter";
import type { Project } from "@/types";

interface EmbeddedProject {
  title: string;
  embedding: number[];
}

async function main(): Promise<void> {
  const projectsPath = path.join(process.cwd(), "data", "projects.json");
  const embeddingsPath = path.join(
    process.cwd(),
    "data",
    "project-embeddings.json",
  );

  if (!fs.existsSync(projectsPath)) {
    throw new Error(`Project dataset not found: ${projectsPath}`);
  }

  const projects = JSON.parse(fs.readFileSync(projectsPath, "utf8")) as Project[];
  const existing = fs.existsSync(embeddingsPath)
    ? (JSON.parse(fs.readFileSync(embeddingsPath, "utf8")) as EmbeddedProject[])
    : [];
  const cache = new Map(existing.map((item) => [item.title, item.embedding]));

  const embeddingProvider = new OllamaAdapter({
    model: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
  });

  for (const [index, project] of projects.entries()) {
    if (cache.has(project.title)) {
      console.log(`[${index + 1}/${projects.length}] cached: ${project.title}`);
      continue;
    }

    const text = [
      project.title,
      project.description,
      project.howItsMade,
      project.hackathon,
    ]
      .filter(Boolean)
      .join("\n");

    console.log(`[${index + 1}/${projects.length}] embedding: ${project.title}`);
    const embedding = await embeddingProvider.createEmbedding(text);
    cache.set(project.title, embedding);

    // Persist after each item so an interrupted run can resume safely.
    writeEmbeddings(embeddingsPath, cache);
  }

  writeEmbeddings(embeddingsPath, cache);
  console.log(`Indexed ${cache.size} projects -> ${embeddingsPath}`);
}

function writeEmbeddings(
  filePath: string,
  cache: Map<string, number[]>,
): void {
  const data: EmbeddedProject[] = Array.from(cache.entries()).map(
    ([title, embedding]) => ({ title, embedding }),
  );
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
