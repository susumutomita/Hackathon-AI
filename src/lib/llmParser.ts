// src/lib/llmParser.ts

import ollama from "ollama";
import logger from "@/lib/logger";

export async function parseHtmlWithLLM(
  idea: string,
  prompt: string,
): Promise<string> {
  logger.info("Parsing idea with LLM...");

  try {
    const response = await ollama.chat({
      model: "llama3.1",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    logger.info("LLM response received:", { response });

    return response.message.content.trim();
  } catch (error) {
    logger.error("Failed to parse LLM response:", error);
    throw new Error("Failed to parse LLM response");
  }
}
