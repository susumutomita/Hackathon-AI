import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import logger from "@/lib/logger";

const eventsFilePath = path.join(process.cwd(), "crawledEvents.json");

interface EventsMap {
  [key: string]: boolean;
}

export async function fetchLatestEvents(): Promise<string[]> {
  try {
    logger.info("Fetching latest events from ETHGlobal...");
    const response = await axios.get("https://ethglobal.com/events");
    const $ = cheerio.load(response.data);

    const events: string[] = [];

    // ETHGlobalのイベントページからイベントIDを抽出
    $('a[href^="/events/"]').each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        const eventId = href.split("/events/")[1];
        if (eventId && !eventId.includes("/")) {
          events.push(eventId);
        }
      }
    });

    // 重複を削除
    const uniqueEvents = [...new Set(events)];
    logger.info(`Found ${uniqueEvents.length} events`);

    return uniqueEvents;
  } catch (error) {
    logger.error("Failed to fetch latest events:", error);
    throw error;
  }
}

export async function loadCurrentEvents(): Promise<EventsMap> {
  try {
    if (fs.existsSync(eventsFilePath)) {
      const rawData = fs.readFileSync(eventsFilePath, "utf-8");
      return JSON.parse(rawData);
    }
    return {};
  } catch (error) {
    logger.error("Failed to load current events:", error);
    return {};
  }
}

export async function updateEventsFile(newEvents: string[]): Promise<{
  added: string[];
  total: number;
}> {
  try {
    const currentEvents = await loadCurrentEvents();
    const added: string[] = [];

    // 新しいイベントを追加（デフォルトでfalse）
    for (const event of newEvents) {
      if (!(event in currentEvents)) {
        currentEvents[event] = false;
        added.push(event);
        logger.info(`Added new event: ${event}`);
      }
    }

    if (added.length > 0) {
      // ファイルを更新
      fs.writeFileSync(
        eventsFilePath,
        JSON.stringify(currentEvents, null, 2) + "\n",
        "utf-8",
      );
      logger.info(`Updated events file with ${added.length} new events`);
    } else {
      logger.info("No new events found");
    }

    return {
      added,
      total: Object.keys(currentEvents).length,
    };
  } catch (error) {
    logger.error("Failed to update events file:", error);
    throw error;
  }
}

export async function checkAndUpdateEvents(): Promise<{
  success: boolean;
  added: string[];
  total: number;
  error?: string;
}> {
  try {
    const latestEvents = await fetchLatestEvents();
    const result = await updateEventsFile(latestEvents);

    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    logger.error("Event update process failed:", error);
    return {
      success: false,
      added: [],
      total: 0,
      error: error.message || "Unknown error",
    };
  }
}
