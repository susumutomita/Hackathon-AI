import ollama from "ollama";
import logger from "@/lib/logger";
import Groq from "groq-sdk";
import { isProduction as isProdEnv } from "@/lib/env";
import { validateLLMResponse } from "./llmResponseValidator";
import { safeJsonParseWithFallback } from "./safeJsonParser";
import {
  handleIdeaGenerationFallback,
  sanitizeErrorForLogging,
} from "./fallbackHandler";

export async function parseHtmlWithLLM(
  idea: string,
  prompt: string,
): Promise<string> {
  logger.info("Parsing idea with LLM...");

  // Use shared environment detection to align server behavior with deployment
  const isProduction = isProdEnv();
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
      logger.info("Local LLM response received");

      const rawContent = response.message.content;
      if (!rawContent) {
        throw new Error("LLMからの応答が空です");
      }

      // LLMレスポンスを検証・サニタイズ
      const validatedContent = validateLLMResponse(rawContent);
      return validatedContent;
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

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        throw new Error("LLMからの応答が空です");
      }

      logger.info("Groq LLM response received");

      // LLMレスポンスを検証・サニタイズ
      const validatedContent = validateLLMResponse(rawContent);
      return validatedContent;
    }
  } catch (error) {
    const sanitizedError = sanitizeErrorForLogging(error as Error, true);
    logger.error("Failed to parse LLM response:", sanitizedError);

    // フォールバック処理を実行
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
