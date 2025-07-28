import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import * as fs from "fs";
import { QdrantHandler } from "@/lib/qdrantHandler";
import logger from "@/lib/logger";
import { crawlEthGlobalShowcase } from "./crawler";

// Mock modules
vi.mock("axios");
vi.mock("fs");
vi.mock("@/lib/qdrantHandler");
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const mockProjectHTML = `
<div class="block border-2 border-black rounded overflow-hidden relative" href="/showcase/test-project">
  <img src="https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png" />
  <h2>Test Project</h2>
  <p>Test Description</p>
  <div class="inline-flex overflow font-semibold items-center">ETHGlobal 2024</div>
</div>
`;

const mockProjectDetailHTML = `
<a href="https://github.com/test/test-project">Source Code</a>
<h3>Project Description</h3>
<div class="text-black-500">Detailed project description</div>
<h3>How it's Made</h3>
<div class="text-black-500">Detailed how it's made</div>
`;

const mockNoResultsHTML = `
<div>No results found...</div>
`;

describe("crawlEthGlobalShowcase", () => {
  let mockAddProject: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set default mock value
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        "ethglobal-2024": true,
        "ethglobal-2023": false,
      }),
    );

    // Mock QdrantHandler
    mockAddProject = vi.fn().mockResolvedValue(undefined);
    vi.mocked(QdrantHandler).mockImplementation(
      () =>
        ({
          addProject: mockAddProject,
        }) as any,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully crawl and add projects to Qdrant", async () => {
    // Mock axios responses
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: mockProjectHTML }) // Page 1
      .mockResolvedValueOnce({ data: mockProjectDetailHTML }) // Project detail
      .mockResolvedValueOnce({ data: mockNoResultsHTML }); // Page 2 (no results)

    const results = await crawlEthGlobalShowcase();

    // Verify event filter was applied
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining("crawledEvents.json"),
      "utf-8",
    );

    // Verify correct URLs were fetched
    expect(axios.get).toHaveBeenCalledWith(
      "https://ethglobal.com/showcase/?events=ethglobal-2024&page=1",
    );
    expect(axios.get).toHaveBeenCalledWith(
      "https://ethglobal.com/showcase/test-project",
    );

    // Verify project was added to Qdrant
    expect(mockAddProject).toHaveBeenCalledWith(
      "Test Project",
      "Detailed project description",
      "Detailed how it's made",
      "https://github.com/test/test-project",
      "/showcase/test-project",
      "ETHGlobal 2024",
    );

    // Verify results
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "Test Project",
      description: "Test Description",
      prize: true,
      link: "/showcase/test-project",
      hackathon: "ETHGlobal 2024",
      sourceCode: "https://github.com/test/test-project",
      projectDescription: "Detailed project description",
      howItsMade: "Detailed how it's made",
    });

    expect(logger.info).toHaveBeenCalledWith(
      "Crawling complete and projects saved.",
    );
  });

  it("should handle errors during crawling", async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error("Network error"));

    const results = await crawlEthGlobalShowcase();

    expect(results).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      "Error occurred during crawling:",
      expect.any(Error),
    );
  });

  it("should handle errors when fetching project details", async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: mockProjectHTML }) // Page 1
      .mockRejectedValueOnce(new Error("Failed to fetch project details")) // Project detail error
      .mockResolvedValueOnce({ data: mockNoResultsHTML }); // Page 2

    const results = await crawlEthGlobalShowcase();

    // Project should still be added but with empty details
    expect(mockAddProject).toHaveBeenCalledWith(
      "Test Project",
      "",
      "",
      "",
      "/showcase/test-project",
      "ETHGlobal 2024",
    );

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to fetch details from https://ethglobal.com/showcase/test-project:",
      expect.any(Error),
    );
  });

  it("should extract multiple projects from HTML", async () => {
    const multipleProjectsHTML = `
      <div class="block border-2 border-black rounded overflow-hidden relative" href="/showcase/project-1">
        <img src="https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png" />
        <h2>Project 1</h2>
        <p>Description 1</p>
        <div class="inline-flex overflow font-semibold items-center">Event 1</div>
      </div>
      <div class="block border-2 border-black rounded overflow-hidden relative" href="/showcase/project-2">
        <img src="https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png" />
        <h2>Project 2</h2>
        <p>Description 2</p>
        <div class="inline-flex overflow font-semibold items-center">Event 2</div>
      </div>
    `;

    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: multipleProjectsHTML })
      .mockResolvedValueOnce({ data: mockProjectDetailHTML }) // Project 1 detail
      .mockResolvedValueOnce({ data: mockProjectDetailHTML }) // Project 2 detail
      .mockResolvedValueOnce({ data: mockNoResultsHTML });

    const results = await crawlEthGlobalShowcase();

    expect(results).toHaveLength(2);
    expect(mockAddProject).toHaveBeenCalledTimes(2);
  });

  it("should skip non-finalist projects", async () => {
    const nonFinalistHTML = `
      <div class="block border-2 border-black rounded overflow-hidden relative" href="/showcase/non-finalist">
        <!-- No finalist image -->
        <h2>Non-Finalist Project</h2>
        <p>Description</p>
        <div class="inline-flex overflow font-semibold items-center">Event</div>
      </div>
    `;

    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: nonFinalistHTML })
      .mockResolvedValueOnce({ data: mockNoResultsHTML });

    const results = await crawlEthGlobalShowcase();

    expect(results).toHaveLength(0);
    expect(mockAddProject).not.toHaveBeenCalled();
  });

  it("should handle multiple pages correctly", async () => {
    // First page has projects
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: mockProjectHTML })
      .mockResolvedValueOnce({ data: mockProjectDetailHTML })
      // Second page also has projects
      .mockResolvedValueOnce({ data: mockProjectHTML })
      .mockResolvedValueOnce({ data: mockProjectDetailHTML })
      // Third page has no results
      .mockResolvedValueOnce({ data: mockNoResultsHTML });

    const results = await crawlEthGlobalShowcase();

    expect(results).toHaveLength(2);
    expect(axios.get).toHaveBeenCalledWith(
      "https://ethglobal.com/showcase/?events=ethglobal-2024&page=1",
    );
    expect(axios.get).toHaveBeenCalledWith(
      "https://ethglobal.com/showcase/?events=ethglobal-2024&page=2",
    );
    expect(axios.get).toHaveBeenCalledWith(
      "https://ethglobal.com/showcase/?events=ethglobal-2024&page=3",
    );
  });

  it("should handle empty event filters", async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        "ethglobal-2024": false,
        "ethglobal-2023": false,
      }),
    );

    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockNoResultsHTML });

    await crawlEthGlobalShowcase();

    // Should still make a request but with empty events filter
    expect(axios.get).toHaveBeenCalledWith(
      "https://ethglobal.com/showcase/?events=&page=1",
    );
  });
});
