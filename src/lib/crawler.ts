import axios from "axios";
import { parseHtmlWithLLM } from "./llmParser";

export async function crawlEthGlobalShowcase(prompt: string) {
  try {
    const response = await axios.get("https://ethglobal.com/showcase");
    const showcaseHtml = response.data;

    const projects = await parseHtmlWithLLM(showcaseHtml, prompt);

    if (projects) {
      console.log("Parsed projects:", projects);
    } else {
      console.error("Failed to parse projects from HTML.");
    }

    return projects || [];
  } catch (error) {
    console.error("Error during crawling and parsing:", error);
    return [];
  }
}
