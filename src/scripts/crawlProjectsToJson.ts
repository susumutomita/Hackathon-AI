import axios from "axios";
import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import type { Project } from "@/types";

const EVENTS_PATH = path.join(process.cwd(), "crawledEvents.json");
const OUTPUT_PATH = path.join(process.cwd(), "data", "projects.json");
const BASE_URL = "https://ethglobal.com/showcase/";
const FINALIST_IMAGE_URL =
  "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";

function getEnabledEvents(): string {
  if (!fs.existsSync(EVENTS_PATH)) {
    return "";
  }

  const raw = fs.readFileSync(EVENTS_PATH, "utf8");
  const events = JSON.parse(raw) as Record<string, boolean>;
  return Object.entries(events)
    .filter(([, enabled]) => enabled)
    .map(([event]) => event)
    .join(",");
}

function loadProjects(): Project[] {
  if (!fs.existsSync(OUTPUT_PATH)) {
    return [];
  }

  const raw = fs.readFileSync(OUTPUT_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Project[]) : [];
}

function projectKey(project: Project): string {
  if (project.link) {
    return `link:${project.link}`;
  }

  return `title:${project.title.trim().toLowerCase()}|hackathon:${(
    project.hackathon || ""
  )
    .trim()
    .toLowerCase()}`;
}

function mergeProjects(existing: Project[], incoming: Project[]): Project[] {
  const merged = new Map<string, Project>();

  for (const project of existing) {
    merged.set(projectKey(project), project);
  }

  for (const project of incoming) {
    const key = projectKey(project);
    const previous = merged.get(key);
    merged.set(key, previous ? { ...previous, ...project } : project);
  }

  return Array.from(merged.values()).sort((a, b) =>
    `${a.hackathon || ""}:${a.title}`.localeCompare(
      `${b.hackathon || ""}:${b.title}`,
    ),
  );
}

function saveProjects(projects: Project[]): void {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const temporaryPath = `${OUTPUT_PATH}.tmp`;
  fs.writeFileSync(
    temporaryPath,
    `${JSON.stringify(projects, null, 2)}\n`,
    "utf8",
  );
  fs.renameSync(temporaryPath, OUTPUT_PATH);
}

function extractProjects(html: string): Project[] {
  const $ = cheerio.load(html);
  const projects: Project[] = [];

  $(".block.border-2.border-black.rounded.overflow-hidden.relative").each(
    (_index, element) => {
      const isFinalist =
        $(element).find(`img[src="${FINALIST_IMAGE_URL}"]`).length > 0;

      if (!isFinalist) {
        return;
      }

      const link = $(element).attr("href") || "";
      const title = $(element).find("h2").text().trim();
      const description = $(element).find("p").text().trim();
      const hackathon = $(element)
        .find(".inline-flex.overflow.font-semibold.items-center")
        .text()
        .trim();

      if (!title || !link) {
        return;
      }

      projects.push({
        title,
        description,
        prize: true,
        link,
        hackathon,
      });
    },
  );

  return projects;
}

async function fetchProjectDetails(project: Project): Promise<Project> {
  if (!project.link) {
    return project;
  }

  const url = new URL(project.link, "https://ethglobal.com").toString();

  try {
    const response = await axios.get<string>(url, { timeout: 20_000 });
    const $ = cheerio.load(response.data);

    return {
      ...project,
      sourceCode: $('a:contains("Source Code")').attr("href") || "",
      projectDescription: $('h3:contains("Project Description")')
        .next("div.text-black-500")
        .text()
        .trim(),
      howItsMade: $('h3:contains("How it\'s Made")')
        .next("div.text-black-500")
        .text()
        .trim(),
    };
  } catch (error) {
    console.warn(
      `Could not fetch details for ${project.title}:`,
      error instanceof Error ? error.message : error,
    );
    return project;
  }
}

async function main(): Promise<void> {
  const reset = process.argv.includes("--reset");
  const eventFilter = getEnabledEvents();
  let projects = reset ? [] : loadProjects();
  let page = 1;

  console.log(`Events: ${eventFilter || "all"}`);
  console.log(`Existing projects: ${projects.length}`);

  while (true) {
    const url = `${BASE_URL}?events=${encodeURIComponent(eventFilter)}&page=${page}`;
    console.log(`Crawling page ${page}: ${url}`);

    const response = await axios.get<string>(url, { timeout: 20_000 });
    if (response.data.includes("No results found...")) {
      break;
    }

    const summaries = extractProjects(response.data);
    if (summaries.length === 0) {
      console.warn(`No finalist projects found on page ${page}; stopping.`);
      break;
    }

    const detailed: Project[] = [];
    for (const project of summaries) {
      detailed.push(await fetchProjectDetails(project));
    }

    projects = mergeProjects(projects, detailed);
    saveProjects(projects);
    console.log(`Checkpointed ${projects.length} projects.`);
    page += 1;
  }

  saveProjects(projects);
  console.log(`Saved ${projects.length} projects -> ${OUTPUT_PATH}`);
  console.log("Next: pnpm data:index-local");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
