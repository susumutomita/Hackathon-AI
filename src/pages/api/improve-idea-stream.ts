import { NextApiRequest, NextApiResponse } from "next";
import { parseHtmlWithLLM } from "@/lib/llmParser";
import {
  handleApiError,
  createValidationError,
  createTimeoutError,
} from "@/lib/errorHandler";
import logger from "@/lib/logger";
import {
  ImproveIdeaRequestSchema,
  validateInput,
  sanitizeString,
} from "@/lib/validation";
import {
  applyApiRateLimit,
  setRateLimitHeaders,
  createRateLimitError,
} from "@/lib/rateLimit";
import ollama from "ollama";
import Groq from "groq-sdk";

export const config = {
  runtime: "nodejs",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const startTime = Date.now();

  // CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST method is allowed",
    });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // Flush headers immediately
  // @ts-ignore - flushHeaders exists in Node's ServerResponse
  res.flushHeaders?.();

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Rate limit
    const rate = applyApiRateLimit(req);
    setRateLimitHeaders(res.setHeader.bind(res), rate);
    if (!rate.success) {
      send("error", createRateLimitError(rate));
      return res.end();
    }

    // Validate input
    const validation = validateInput(ImproveIdeaRequestSchema, req.body);
    if (!validation.success) {
      throw createValidationError(validation.error);
    }

    const { idea: rawIdea, similarProjects } = validation.data;
    const idea = sanitizeString(rawIdea);
    const sanitizedSimilarProjects = similarProjects.map((project) => ({
      ...project,
      title: sanitizeString(project.title),
      description: sanitizeString(project.description),
      howItsMade: project.howItsMade
        ? sanitizeString(project.howItsMade)
        : undefined,
    }));

    // Progress events (no chain-of-thought; only high-level states)
    send("status", { phase: "queued" });
    send("status", { phase: "preparing_prompt" });

    const prompt = `\n日本語で、以下の形式で応答してください。\n[出力形式]\n- プロジェクト名: {プロジェクト名}\n  アイデアへのフィードバック: {アイデアを改良するための説明}\n  類似点: {類似点の説明}\n\n**アイデア**: ${idea}\n\n**類似プロジェクト**:\n${sanitizedSimilarProjects
      .map((p: any) => `- ${p.title}: ${p.description}`)
      .join("\n")}`;

    send("status", { phase: "calling_llm" });

    const isProduction = process.env.NODE_ENV === "production";
    const localModel = process.env.OLLAMA_MODEL || "llama3.1";
    const groqModel = process.env.GROQ_MODEL || "llama3-8b-8192";

    let fullText = "";

    try {
      if (!isProduction) {
        // Stream from Ollama
        const stream = await ollama.chat({
          model: localModel,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        });

        for await (const part of stream) {
          const chunk = part.message?.content || "";
          if (chunk) {
            fullText += chunk;
            send("delta", { token: chunk });
          }
        }
      } else {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: groqModel,
          stream: true,
        });

        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content || "";
          if (delta) {
            fullText += delta;
            send("delta", { token: delta });
          }
        }
      }

      const duration = Date.now() - startTime;
      send("status", { phase: "formatting" });
      // Reuse existing validator via non-streaming function to sanitize final
      // Note: parseHtmlWithLLM would call the model again; we avoid that and trust validators here.
      // If you need strict validation, do it client-side as well.
      send("done", {
        text: fullText,
        metadata: {
          processingTime: duration,
          ideaLength: idea.length,
          similarProjectsAnalyzed: sanitizedSimilarProjects.length,
        },
      });
      res.end();
    } catch (streamErr: any) {
      // Try fallback once using existing non-streaming path
      try {
        send("status", { phase: "fallback" });
        const final = await parseHtmlWithLLM(idea, prompt);
        const duration = Date.now() - startTime;
        send("delta", { token: final });
        send("done", {
          text: final,
          metadata: {
            processingTime: duration,
            ideaLength: idea.length,
            similarProjectsAnalyzed: sanitizedSimilarProjects.length,
          },
        });
        res.end();
      } catch (fallbackErr: any) {
        const duration = Date.now() - startTime;
        logger.error("Streaming and fallback failed", fallbackErr);
        if (
          fallbackErr.message?.includes("timeout") ||
          fallbackErr.message?.includes("ETIMEDOUT")
        ) {
          const timeoutError = createTimeoutError(fallbackErr.message);
          send("error", { ...timeoutError, duration });
        } else {
          send("error", {
            error: "StreamingFailed",
            message: fallbackErr?.message || "Unknown error",
            duration,
          });
        }
        res.end();
      }
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    handleApiError(error, res, {
      endpoint: "/api/improve-idea-stream",
      duration,
    });
  }
}
