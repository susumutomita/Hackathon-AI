import ollama from "ollama";
import logger from "@/lib/logger";
import Groq from "groq-sdk";

export async function parseHtmlWithLLM(
  idea: string,
  prompt: string,
): Promise<string> {
  logger.info("Parsing idea with LLM...");

  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === "production";

  try {
    let response;

    if (!isProduction) {
      logger.info("Using local LLM (Ollama) for idea parsing.");
      response = await ollama.chat({
        model: "llama3.1",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });
      logger.info("Local LLM response received:", { response });
      return response.message.content.trim();
    } else {
      logger.info("Using cloud-based LLM (Groq) for idea parsing.");
      const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

      response = await groqClient.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama3-8b-8192",
      });

      const fullResponse = response.choices[0]?.message?.content || "";
      logger.info("Groq LLM response received:", { response: fullResponse });
      return fullResponse.trim();
    }
  } catch (error) {
    logger.error("Failed to parse LLM response:", error);
    throw new Error("Failed to parse LLM response");
  }
}
