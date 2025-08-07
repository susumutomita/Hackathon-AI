import ollama from "ollama";
import logger from "@/lib/logger";
import Groq from "groq-sdk";

export async function parseHtmlWithLLM(
  idea: string,
  prompt: string,
): Promise<string> {
  logger.info("Parsing idea with LLM...");

  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === "production";
  // Allow custom model specification via environment variable
  const localModel = process.env.OLLAMA_MODEL || "llama3.1";
  const groqModel = process.env.GROQ_MODEL || "llama3-8b-8192";

  try {
    let response;

    if (!isProduction) {
      logger.info(`Using local LLM (Ollama) with model: ${localModel}`);
      response = await ollama.chat({
        model: localModel,
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
      logger.info(`Using cloud-based LLM (Groq) with model: ${groqModel}`);
      const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

      response = await groqClient.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: groqModel,
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
