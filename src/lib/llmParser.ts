import ollama from "ollama";
import logger from "@/lib/logger";

export async function parseHtmlWithLLM(
  cleanedData: string,
  prompt: string,
): Promise<any> {
  logger.info("Parsing cleaned data with LLM...");
  logger.info(cleanedData);
  try {
    const response = await ollama.chat({
      model: "llama3.1",
      messages: [
        {
          role: "user",
          content: `${prompt} Here is the cleaned data: ${cleanedData}`,
        },
      ],
    });

    logger.info("LLM response received:", { response });

    return JSON.parse(response.message.content.trim());
  } catch (error) {
    logger.error("Failed to parse LLM response:", error);
    return null;
  }
}
