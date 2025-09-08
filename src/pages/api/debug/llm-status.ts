import { NextApiRequest, NextApiResponse } from "next";
import ollama from "ollama";
import Groq from "groq-sdk";
import { isProduction as isProdEnv } from "@/lib/env";
import logger from "@/lib/logger";

// Ensure Node.js runtime on Vercel/Next with extended timeout
export const config = {
  runtime: "nodejs",
  maxDuration: 60, // 1 minute should be sufficient for diagnostic checks
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only GET method is allowed",
    });
  }

  const isProduction = isProdEnv();
  const diagnostics: any = {
    environment: process.env.NODE_ENV,
    isProduction,
    timestamp: new Date().toISOString(),
    llmConfig: {
      ollamaModel: process.env.OLLAMA_MODEL || "llama3.1",
      groqModel: process.env.GROQ_MODEL || "llama3-8b-8192",
      hasGroqKey: !!process.env.GROQ_API_KEY,
    },
  };

  try {
    if (!isProduction) {
      // Test Ollama connection
      try {
        logger.info("Testing Ollama connection...");
        const models = await ollama.list();
        const targetModel = process.env.OLLAMA_MODEL || "llama3.1";
        const modelExists = models.models.some((m) =>
          m.name.includes(targetModel),
        );

        diagnostics.ollama = {
          status: "connected",
          availableModels: models.models.map((m) => m.name),
          targetModel,
          targetModelExists: modelExists,
          modelsCount: models.models.length,
        };

        if (!modelExists) {
          diagnostics.ollama.warning = `Target model ${targetModel} not found. Available models: ${models.models.map((m) => m.name).join(", ")}`;
        }
      } catch (error) {
        diagnostics.ollama = {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          suggestion:
            "Make sure Ollama is running and accessible. Try: ollama serve",
        };
      }
    } else {
      // Test Groq connection
      try {
        if (!process.env.GROQ_API_KEY) {
          throw new Error("GROQ_API_KEY environment variable is not set");
        }

        const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // Simple test request
        const testResponse = await groqClient.chat.completions.create({
          messages: [
            { role: "user", content: "Hello, please respond with 'OK'" },
          ],
          model: process.env.GROQ_MODEL || "llama3-8b-8192",
          max_tokens: 10,
        });

        diagnostics.groq = {
          status: "connected",
          model: process.env.GROQ_MODEL || "llama3-8b-8192",
          testResponse:
            testResponse.choices[0]?.message?.content || "No response",
        };
      } catch (error) {
        diagnostics.groq = {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          suggestion:
            "Check GROQ_API_KEY environment variable and network connectivity",
        };
      }
    }

    res.status(200).json({
      success: true,
      diagnostics,
    });
  } catch (error) {
    logger.error("LLM status check failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      diagnostics,
    });
  }
}
