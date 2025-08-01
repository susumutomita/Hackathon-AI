import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import fs from "fs";
import path from "path";
import {
  fetchLatestEvents,
  loadCurrentEvents,
  updateEventsFile,
  checkAndUpdateEvents,
} from "../eventUpdater";
import logger from "@/lib/logger";

// Mock modules
vi.mock("axios");
vi.mock("fs");
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axios);
const mockedFs = vi.mocked(fs);

describe("eventUpdater", () => {
  const eventsFilePath = path.join(process.cwd(), "crawledEvents.json");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchLatestEvents", () => {
    test("should fetch and parse events successfully", async () => {
      const mockHtml = `
        <html>
          <body>
            <a href="/events/tokyo2024">Tokyo 2024</a>
            <a href="/events/paris2024">Paris 2024</a>
            <a href="/events/london2024">London 2024</a>
            <a href="/events/tokyo2024">Tokyo 2024 (duplicate)</a>
            <a href="/events/invalid/path">Invalid</a>
            <a href="/other/path">Other</a>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      const events = await fetchLatestEvents();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://ethglobal.com/events",
      );
      expect(events).toEqual(["tokyo2024", "paris2024", "london2024"]);
      expect(logger.info).toHaveBeenCalledWith(
        "Fetching latest events from ETHGlobal...",
      );
      expect(logger.info).toHaveBeenCalledWith("Found 3 events");
    });

    test("should handle fetch errors", async () => {
      const mockError = new Error("Network error");
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(fetchLatestEvents()).rejects.toThrow("Network error");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch latest events:",
        mockError,
      );
    });

    test("should handle empty response", async () => {
      mockedAxios.get.mockResolvedValue({ data: "<html></html>" });

      const events = await fetchLatestEvents();

      expect(events).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith("Found 0 events");
    });
  });

  describe("loadCurrentEvents", () => {
    test("should load existing events file", async () => {
      const mockEvents = {
        tokyo2024: true,
        paris2024: false,
        london2024: true,
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockEvents));

      const events = await loadCurrentEvents();

      expect(mockedFs.existsSync).toHaveBeenCalledWith(eventsFilePath);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(
        eventsFilePath,
        "utf-8",
      );
      expect(events).toEqual(mockEvents);
    });

    test("should return empty object when file doesn't exist", async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const events = await loadCurrentEvents();

      expect(events).toEqual({});
      expect(mockedFs.readFileSync).not.toHaveBeenCalled();
    });

    test("should handle file read errors", async () => {
      const mockError = new Error("File read error");
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw mockError;
      });

      const events = await loadCurrentEvents();

      expect(events).toEqual({});
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to load current events:",
        mockError,
      );
    });

    test("should handle JSON parse errors", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue("invalid json");

      const events = await loadCurrentEvents();

      expect(events).toEqual({});
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to load current events:",
        expect.any(Error),
      );
    });
  });

  describe("updateEventsFile", () => {
    test("should add new events to empty file", async () => {
      mockedFs.existsSync.mockReturnValue(false);
      const newEvents = ["tokyo2024", "paris2024"];

      const result = await updateEventsFile(newEvents);

      expect(result.added).toEqual(["tokyo2024", "paris2024"]);
      expect(result.total).toBe(2);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        eventsFilePath,
        JSON.stringify({ tokyo2024: false, paris2024: false }, null, 2) + "\n",
        "utf-8",
      );
      expect(logger.info).toHaveBeenCalledWith("Added new event: tokyo2024");
      expect(logger.info).toHaveBeenCalledWith("Added new event: paris2024");
      expect(logger.info).toHaveBeenCalledWith(
        "Updated events file with 2 new events",
      );
    });

    test("should add only new events to existing file", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({ tokyo2024: true }),
      );

      const newEvents = ["tokyo2024", "paris2024", "london2024"];
      const result = await updateEventsFile(newEvents);

      expect(result.added).toEqual(["paris2024", "london2024"]);
      expect(result.total).toBe(3);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        eventsFilePath,
        JSON.stringify(
          { tokyo2024: true, paris2024: false, london2024: false },
          null,
          2,
        ) + "\n",
        "utf-8",
      );
    });

    test("should handle no new events", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({ tokyo2024: true, paris2024: false }),
      );

      const newEvents = ["tokyo2024", "paris2024"];
      const result = await updateEventsFile(newEvents);

      expect(result.added).toEqual([]);
      expect(result.total).toBe(2);
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith("No new events found");
    });

    test("should handle write errors", async () => {
      const mockError = new Error("Write error");
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.writeFileSync.mockImplementation(() => {
        throw mockError;
      });

      await expect(updateEventsFile(["tokyo2024"])).rejects.toThrow(
        "Write error",
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to update events file:",
        mockError,
      );
    });
  });

  describe("checkAndUpdateEvents", () => {
    test("should successfully update events", async () => {
      const mockHtml = `
        <html>
          <body>
            <a href="/events/tokyo2024">Tokyo 2024</a>
            <a href="/events/paris2024">Paris 2024</a>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: mockHtml });
      mockedFs.existsSync.mockReturnValue(false);

      const result = await checkAndUpdateEvents();

      expect(result.success).toBe(true);
      expect(result.added).toEqual(["tokyo2024", "paris2024"]);
      expect(result.total).toBe(2);
      expect(result.error).toBeUndefined();
    });

    test("should handle fetch errors gracefully", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));

      const result = await checkAndUpdateEvents();

      expect(result.success).toBe(false);
      expect(result.added).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.error).toBe("Network error");
      expect(logger.error).toHaveBeenCalledWith(
        "Event update process failed:",
        expect.any(Error),
      );
    });

    test("should handle update errors gracefully", async () => {
      const mockHtml = `
        <html>
          <body>
            <a href="/events/tokyo2024">Tokyo 2024</a>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: mockHtml });
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error("File error");
      });

      const result = await checkAndUpdateEvents();

      // Since loadCurrentEvents catches errors and returns {},
      // the update will succeed with the new event
      expect(result.success).toBe(true);
      expect(result.added).toEqual(["tokyo2024"]);
      expect(result.total).toBe(1);
    });

    test("should handle unknown errors", async () => {
      mockedAxios.get.mockRejectedValue({ someError: "unknown" });

      const result = await checkAndUpdateEvents();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });
  });
});
