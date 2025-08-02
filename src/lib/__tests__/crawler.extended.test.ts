import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { crawlEthGlobalShowcase } from "../crawler";
import axios from "axios";
import fs from "fs";
import path from "path";
import logger from "@/lib/logger";
import { QdrantHandler } from "@/lib/qdrantHandler";

// Mock dependencies
vi.mock("axios");
vi.mock("fs");
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock("@/lib/qdrantHandler", () => ({
  QdrantHandler: vi.fn().mockImplementation(() => ({
    addProject: vi.fn().mockResolvedValue(undefined),
  })),
}));

const mockAxios = axios as any;
const mockFs = fs as any;
const mockLogger = logger as any;

describe("Crawler Extended Tests", () => {
  let mockQdrantHandler: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a more stable mock for QdrantHandler
    const mockAddProject = vi.fn().mockResolvedValue(undefined);
    mockQdrantHandler = {
      addProject: mockAddProject,
    };

    // Ensure the QdrantHandler constructor returns our mock
    (QdrantHandler as any).mockImplementation(() => mockQdrantHandler);

    // Mock file system operations
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({
        event1: true,
        event2: false,
        event3: true,
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getEventFilters functionality", () => {
    it("should correctly filter enabled events", async () => {
      const showcaseHtml = `<div>No results found...</div>`;

      mockAxios.get.mockResolvedValue({ data: showcaseHtml });

      await crawlEthGlobalShowcase();

      // Check that the URL was built with correct event filters
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("events=event1,event3"),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Event filter: event1,event3",
      );
    });

    it("should handle empty event filters", async () => {
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({
          event1: false,
          event2: false,
        }),
      );

      const showcaseHtml = `<div>No results found...</div>`;
      mockAxios.get.mockResolvedValue({ data: showcaseHtml });

      await crawlEthGlobalShowcase();

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("events="),
      );
      expect(mockLogger.info).toHaveBeenCalledWith("Event filter: ");
    });

    it("should handle malformed crawledEvents.json", async () => {
      mockFs.readFileSync.mockReturnValue("invalid json");

      mockAxios.get.mockResolvedValueOnce({ data: "No results found..." });

      const result = await crawlEthGlobalShowcase();

      // Should return empty array when event filters fail
      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error reading event filters:",
        expect.any(Error),
      );
    });

    it("should handle missing crawledEvents.json", async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error("ENOENT: no such file or directory");
      });

      mockAxios.get.mockResolvedValueOnce({ data: "No results found..." });

      const result = await crawlEthGlobalShowcase();

      // Should return empty array when event filters fail
      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error reading event filters:",
        expect.any(Error),
      );
    });
  });

  describe("extractProjectDetails edge cases", () => {
    it("should handle projects without prize images", async () => {
      const showcaseHtml = `
        <div class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <h2>Project Without Prize</h2>
          <p>Description without prize</p>
          <div class="inline-flex overflow font-semibold items-center">Hackathon Name</div>
        </div>
      `;

      mockAxios.get
        .mockResolvedValueOnce({ data: showcaseHtml })
        .mockResolvedValueOnce({ data: "No results found..." });

      const result = await crawlEthGlobalShowcase();

      expect(result).toHaveLength(0);
      expect(mockQdrantHandler.addProject).not.toHaveBeenCalled();
    });

    it("should handle projects with missing elements", async () => {
      const finalistImageUrl =
        "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
      const showcaseHtml = `
        <a class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <img src="${finalistImageUrl}" />
          <h2></h2>
          <p></p>
          <div class="inline-flex overflow font-semibold items-center"></div>
        </a>
      `;

      mockAxios.get
        .mockResolvedValueOnce({ data: showcaseHtml }) // page 1
        .mockResolvedValueOnce({ data: "<html><body></body></html>" }) // Project detail page
        .mockResolvedValueOnce({ data: "No results found..." }); // page 2

      const result = await crawlEthGlobalShowcase();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("");
      expect(result[0].description).toBe("");
      expect(result[0].hackathon).toBe("");
    });

    it("should handle projects with complex HTML in descriptions", async () => {
      const finalistImageUrl =
        "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
      const showcaseHtml = `
        <a class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <img src="${finalistImageUrl}" />
          <h2>Project with <span>HTML</span> in title</h2>
          <p>Description with <strong>bold</strong> and <em>italic</em> text</p>
          <div class="inline-flex overflow font-semibold items-center">Hackathon <span>Name</span></div>
        </a>
      `;

      mockAxios.get
        .mockResolvedValueOnce({ data: showcaseHtml }) // page 1
        .mockResolvedValueOnce({ data: "<html><body></body></html>" }) // Project detail page
        .mockResolvedValueOnce({ data: "No results found..." }); // page 2

      const result = await crawlEthGlobalShowcase();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Project with HTML in title");
      expect(result[0].description).toBe(
        "Description with bold and italic text",
      );
      expect(result[0].hackathon).toBe("Hackathon Name");
    });
  });

  describe("fetchProjectDetailPage edge cases", () => {
    it("should handle projects with missing source code link", async () => {
      const finalistImageUrl =
        "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
      const showcaseHtml = `
        <a class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <img src="${finalistImageUrl}" />
          <h2>Test Project</h2>
          <p>Test Description</p>
          <div class="inline-flex overflow font-semibold items-center">Test Hackathon</div>
        </a>
      `;

      const projectDetailHtml = `
        <html>
          <body>
            <h3>Project Description</h3>
            <div class="text-black-500">Detailed project description</div>
            <h3>How it's Made</h3>
            <div class="text-black-500">Technical details</div>
            <!-- No Source Code link -->
          </body>
        </html>
      `;

      mockAxios.get
        .mockResolvedValueOnce({ data: showcaseHtml }) // page 1
        .mockResolvedValueOnce({ data: projectDetailHtml }) // Project detail page
        .mockResolvedValueOnce({ data: "No results found..." }); // page 2

      const result = await crawlEthGlobalShowcase();

      expect(result).toHaveLength(1);
      expect(result[0].sourceCode).toBe("");
      expect(result[0].projectDescription).toBe("Detailed project description");
      expect(result[0].howItsMade).toBe("Technical details");
    });

    it("should handle network errors when fetching project details", async () => {
      const finalistImageUrl =
        "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
      const showcaseHtml = `
        <a class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <img src="${finalistImageUrl}" />
          <h2>Test Project</h2>
          <p>Test Description</p>
          <div class="inline-flex overflow font-semibold items-center">Test Hackathon</div>
        </a>
      `;

      mockAxios.get
        .mockResolvedValueOnce({ data: showcaseHtml }) // page 1
        .mockRejectedValueOnce(new Error("Network error")) // Project detail page
        .mockResolvedValueOnce({ data: "No results found..." }); // page 2

      const result = await crawlEthGlobalShowcase();

      expect(result).toHaveLength(1);
      expect(result[0].sourceCode).toBeUndefined();
      expect(result[0].projectDescription).toBeUndefined();
      expect(result[0].howItsMade).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to fetch details"),
        expect.any(Error),
      );
    });

    it("should handle malformed HTML in project detail page", async () => {
      const finalistImageUrl =
        "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
      const showcaseHtml = `
        <a class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <img src="${finalistImageUrl}" />
          <h2>Test Project</h2>
        </a>
      `;

      const malformedHtml = `<html><body><h3>Project Description</h3><div class="text-black-500">Description`;

      mockAxios.get
        .mockResolvedValueOnce({ data: showcaseHtml }) // page 1
        .mockResolvedValueOnce({ data: malformedHtml }) // Project detail page
        .mockResolvedValueOnce({ data: "No results found..." }); // page 2

      const result = await crawlEthGlobalShowcase();

      expect(result).toHaveLength(1);
      expect(result[0].projectDescription).toBe("Description");
    });
  });

  describe("QdrantHandler integration", () => {
    it("should handle QdrantHandler errors gracefully", async () => {
      const finalistImageUrl =
        "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
      const showcaseHtml = `
        <a class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <img src="${finalistImageUrl}" />
          <h2>Test Project</h2>
          <p>Test Description</p>
          <div class="inline-flex overflow font-semibold items-center">Test Hackathon</div>
        </a>
      `;

      mockQdrantHandler.addProject.mockRejectedValue(new Error("Qdrant error"));

      mockAxios.get
        .mockResolvedValueOnce({ data: showcaseHtml }) // page 1
        .mockResolvedValueOnce({ data: "<html></html>" }) // Project detail page
        .mockResolvedValueOnce({ data: "No results found..." }); // page 2

      // Should not throw error, but continue processing
      const result = await crawlEthGlobalShowcase();

      expect(result).toHaveLength(1);
      expect(mockQdrantHandler.addProject).toHaveBeenCalled();
    });

    it("should call addProject with correct parameters", async () => {
      const finalistImageUrl =
        "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
      const showcaseHtml = `
        <a class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <img src="${finalistImageUrl}" />
          <h2>Test Project</h2>
          <p>Test Description</p>
          <div class="inline-flex overflow font-semibold items-center">Test Hackathon</div>
        </a>
      `;

      const projectDetailHtml = `
        <html>
          <body>
            <a href="https://github.com/test/repo">Source Code</a>
            <h3>Project Description</h3>
            <div class="text-black-500">Detailed description</div>
            <h3>How it's Made</h3>
            <div class="text-black-500">Technical details</div>
          </body>
        </html>
      `;

      mockAxios.get
        .mockResolvedValueOnce({ data: showcaseHtml }) // page 1
        .mockResolvedValueOnce({ data: projectDetailHtml }) // Project detail page
        .mockResolvedValueOnce({ data: "No results found..." }); // page 2

      await crawlEthGlobalShowcase();

      expect(mockQdrantHandler.addProject).toHaveBeenCalledWith(
        "Test Project",
        "Detailed description",
        "Technical details",
        "https://github.com/test/repo",
        "/project1",
        "Test Hackathon",
      );
    });

    it("should handle null/undefined values in addProject call", async () => {
      const finalistImageUrl =
        "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
      const showcaseHtml = `
        <a class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <img src="${finalistImageUrl}" />
          <h2>Test Project</h2>
          <p></p>
          <div class="inline-flex overflow font-semibold items-center"></div>
        </a>
      `;

      mockAxios.get
        .mockResolvedValueOnce({ data: showcaseHtml }) // page 1
        .mockResolvedValueOnce({ data: "No results found..." }) // page 2
        .mockResolvedValueOnce({ data: "<html></html>" }); // Project detail page

      await crawlEthGlobalShowcase();

      expect(mockQdrantHandler.addProject).toHaveBeenCalledWith(
        "Test Project",
        "",
        "",
        "",
        "/project1",
        "",
      );
    });
  });

  describe("Pagination and termination", () => {
    it("should handle multiple pages correctly", async () => {
      const finalistImageUrl =
        "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
      const page1Html = `
        <a class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <img src="${finalistImageUrl}" />
          <h2>Project 1</h2>
          <p>Description 1</p>
          <div class="inline-flex overflow font-semibold items-center">Hackathon 1</div>
        </a>
      `;
      const page2Html = `
        <a class="block border-2 border-black rounded overflow-hidden relative" href="/project2">
          <img src="${finalistImageUrl}" />
          <h2>Project 2</h2>
          <p>Description 2</p>
          <div class="inline-flex overflow font-semibold items-center">Hackathon 2</div>
        </a>
      `;
      const noResultsHtml = "No results found...";

      mockAxios.get
        .mockResolvedValueOnce({ data: page1Html }) // page 1
        .mockResolvedValueOnce({ data: "<html></html>" }) // Project 1 detail page
        .mockResolvedValueOnce({ data: page2Html }) // page 2
        .mockResolvedValueOnce({ data: "<html></html>" }) // Project 2 detail page
        .mockResolvedValueOnce({ data: noResultsHtml }); // page 3

      const result = await crawlEthGlobalShowcase();

      expect(result).toHaveLength(2);
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("page=1"),
      );
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("page=2"),
      );
      expect(mockLogger.info).toHaveBeenCalledWith("Crawling page 1...");
      expect(mockLogger.info).toHaveBeenCalledWith("Crawling page 2...");
    });

    it("should handle immediate no results scenario", async () => {
      mockAxios.get.mockResolvedValueOnce({ data: "No results found..." });

      const result = await crawlEthGlobalShowcase();

      expect(result).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "No more results found. Stopping crawl.",
      );
    });

    it("should handle network errors during showcase page fetch", async () => {
      mockAxios.get.mockRejectedValueOnce(new Error("Network error"));

      const result = await crawlEthGlobalShowcase();

      expect(result).toHaveLength(0);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error occurred during crawling:",
        expect.any(Error),
      );
    });
  });

  describe("Logging and monitoring", () => {
    it("should log all major steps", async () => {
      mockAxios.get.mockResolvedValueOnce({ data: "No results found..." });

      await crawlEthGlobalShowcase();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Event filter:"),
      );
      expect(mockLogger.info).toHaveBeenCalledWith("Crawling page 1...");
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Fetching page from"),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "No more results found. Stopping crawl.",
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Crawling complete and projects saved.",
      );
    });

    it("should log project extraction details", async () => {
      const finalistImageUrl =
        "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
      const showcaseHtml = `
        <div class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <img src="${finalistImageUrl}" />
          <h2>Test Project</h2>
          <p>Test Description</p>
          <div class="inline-flex overflow font-semibold items-center">Test Hackathon</div>
        </div>
      `;

      mockAxios.get
        .mockResolvedValueOnce({ data: showcaseHtml }) // page 1
        .mockResolvedValueOnce({ data: "No results found..." }) // page 2
        .mockResolvedValueOnce({ data: "<html></html>" }); // Project detail page

      await crawlEthGlobalShowcase();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Extracted project details: %s",
        expect.stringContaining("Test Project"),
      );
    });

    it("should log project detail page fetching", async () => {
      const finalistImageUrl =
        "https://ethglobal.b-cdn.net/organizations/xdat5/square-logo/default.png";
      const showcaseHtml = `
        <div class="block border-2 border-black rounded overflow-hidden relative" href="/project1">
          <img src="${finalistImageUrl}" />
          <h2>Test Project</h2>
          <p>Test Description</p>
          <div class="inline-flex overflow font-semibold items-center">Test Hackathon</div>
        </div>
      `;

      mockAxios.get
        .mockResolvedValueOnce({ data: showcaseHtml }) // page 1
        .mockResolvedValueOnce({ data: "No results found..." }) // page 2
        .mockResolvedValueOnce({ data: "<html></html>" }); // Project detail page

      await crawlEthGlobalShowcase();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          "Fetching details from https://ethglobal.com/project1",
        ),
      );
    });
  });
});
