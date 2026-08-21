import fs from "node:fs";
import path from "node:path";
import { QdrantHandlerFactory } from "@/factories/qdrantHandler.factory";

async function main(): Promise<void> {
  const outputPath = path.join(process.cwd(), "data", "projects.json");
  const qdrant = QdrantHandlerFactory.createDefault();
  const projects = await qdrant.getAllProjects(10000);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(projects, null, 2)}\n`, "utf8");

  console.log(`Exported ${projects.length} projects -> ${outputPath}`);
  console.log("Commit data/projects.json after reviewing the diff.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
