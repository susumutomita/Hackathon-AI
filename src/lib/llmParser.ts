import ollama from "ollama";
import logger from "@/lib/logger";

export async function parseHtmlWithLLM(
  html: string,
  prompt: string,
): Promise<any> {
  logger.info("Parsing HTML with LLM...");

  try {
    const response = await ollama.chat({
      model: "llama3.1",
      messages: [{ role: "user", content: prompt }],
    });

    logger.info("LLM response received:", { response });

    return JSON.parse(response.message.content.trim());
  } catch (error) {
    logger.error("Failed to parse LLM response:", error);
    return null;
  }
}
