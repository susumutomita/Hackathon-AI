import ollama from "ollama";
import logger from "@/lib/logger";
import Groq from "groq-sdk";
import { isProduction as isProdEnv } from "@/lib/env";
import { validateLLMResponse } from "./llmResponseValidator";
import {
  handleIdeaGenerationFallback,
  sanitizeErrorForLogging,
} from "./fallbackHandler";

export async function parseHtmlWithLLM(
  idea: string,
  prompt: string,
): Promise<string> {
  logger.info("Parsing idea with LLM...");

  const isProduction = isProdEnv();
  const localOnly = process.env.LOCAL_ONLY_LLM === "true";
  const localModel = process.env.OLLAMA_MODEL || "llama3.1";
  const groqModel = process.env.GROQ_MODEL || "llama3-8b-8192";

  try {
    if (localOnly || !isProduction) {
      logger.info(`Using local LLM (Ollama) with model: ${localModel}`, {
        localOnly,
      });

      const response = await ollama.chat({
        model: localModel,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const rawContent = response.message.content;
      if (!rawContent) {
        throw new Error("LLMからの応答が空です");
      }

      return validateLLMResponse(rawContent);
    }

    logger.info(`Using cloud-based LLM (Groq) with model: ${groqModel}`);
    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groqClient.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: groqModel,
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("LLMからの応答が空です");
    }

    logger.info("Groq LLM response received");
    return validateLLMResponse(rawContent);
  } catch (error) {
    const sanitizedError = sanitizeErrorForLogging(error as Error, true);
    logger.error("Failed to parse LLM response:", sanitizedError);

    if (localOnly) {
      throw new Error(
        `LOCAL_ONLY_LLM=true のためクラウドフォールバックを行いません: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      logger.info("Attempting fallback for LLM parsing failure");
      return await handleIdeaGenerationFallback(error as Error, idea);
    } catch (fallbackError) {
      logger.error(
        "Fallback also failed:",
        sanitizeErrorForLogging(fallbackError as Error),
      );
      throw new Error("LLMの処理とフォールバック処理の両方が失敗しました");
    }
  }
}
