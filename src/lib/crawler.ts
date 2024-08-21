import axios from "axios";
import { parseHtmlWithLLM } from "@/lib/llmParser";
import logger from "@/lib/logger";

export async function crawlEthGlobalShowcase(prompt: string) {
  try {
    const response = await axios.get("https://ethglobal.com/showcase");
    const showcaseHtml = response.data;

    const projects = await parseHtmlWithLLM(showcaseHtml, prompt);

    if (projects) {
      logger.info("Parsed projects:", { projects }); // ログをinfoレベルで記録
    } else {
      logger.error("Failed to parse projects from HTML."); // ログをerrorレベルで記録
    }

    return projects || [];
  } catch (error) {
    logger.error("Error during crawling and parsing:", error); // エラーログを記録
    return [];
  }
}
