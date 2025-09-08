import { NextApiRequest, NextApiResponse } from "next";
import { parseHtmlWithLLM } from "@/lib/llmParser";
import {
  handleApiError,
  validateMethod,
  validateRequired,
  createTimeoutError,
  createValidationError,
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

// Ensure Node.js runtime on Vercel/Next with extended timeout
export const config = {
  runtime: "nodejs",
  maxDuration: 300, // 5 minutes for Pro/Enterprise plans, 10 seconds for Hobby
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const startTime = Date.now();

  // 安全なCORS設定
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

  // セキュリティヘッダー
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Check if method is POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST method is allowed",
    });
  }

  try {
    // Apply rate limiting
    const rateLimitResult = applyApiRateLimit(req);
    setRateLimitHeaders(res.setHeader.bind(res), rateLimitResult);

    if (!rateLimitResult.success) {
      return res.status(429).json(createRateLimitError(rateLimitResult));
    }

    // Validate and sanitize input using Zod schema
    const validation = validateInput(ImproveIdeaRequestSchema, req.body);
    if (!validation.success) {
      throw createValidationError(validation.error);
    }

    const { idea: rawIdea, similarProjects = [] } = validation.data;

    // Sanitize the idea input
    const idea = sanitizeString(rawIdea);

    // Sanitize similar projects data
    const sanitizedSimilarProjects = similarProjects.map((project) => ({
      ...project,
      title: sanitizeString(project.title),
      description: sanitizeString(project.description),
      howItsMade: project.howItsMade
        ? sanitizeString(project.howItsMade)
        : undefined,
    }));

    logger.info("Improve idea request started", {
      ideaLength: idea.length,
      similarProjectsCount: sanitizedSimilarProjects.length,
      userAgent: req.headers["user-agent"],
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    });

    const prompt =
      sanitizedSimilarProjects.length > 0
        ? `
        あなたは、ハッカソンで何度も勝利を収めた伝説のスーパーエンジニアであり、Web3領域の最前線で活躍しています。クリプトプロダクト設計においては、ネットワーク効果や正の外部性、Fat Protocol理論、Hyperstructureの概念を深く理解し、それらを活用したプロダクト開発に卓越しています。私のアイデアを元に、ハッカソンで勝利するための具体的な改善提案をお願いします。提案は、クリプトプロダクト設計の重要な要素であるネットワーク効果、正の外部性、Fat Protocol理論を最大限に活用し、以下のハッカソン評価基準を満たすことを目指します。
        特に、次の審査基準に基づいてアイデアをブラッシュアップしてください：
        1. 技術的な複雑さ: 問題の解決アプローチがどれほど技術的に優れているか？
        2. 独創性: このアイデアがどれほど革新的で、新しい問題に取り組んでいるか？
        3. 実用性: このアイデアが実際にどれほど完成しており、実用的か？
        4. 使いやすさ: ユーザーにとってこのプロダクトがどれほど使いやすいか？
        5. 驚きの要素: このアイデアが審査員に感動や驚きを与えるか？

        以下の新しいアイデアについて、過去の類似プロジェクトと比較し、どのプロジェクトが似ているか、そしてなぜ似ているのかを説明してください。またアイデアへのフィードバックを提供してください。

        **アイデア**: ${idea}

        **類似プロジェクト**:
        ${sanitizedSimilarProjects.map((project: any) => `- ${project.title}: ${project.description}`).join("\n")}

        提案されたアイデアと類似プロジェクトを比較し、以下の形式で似ているプロジェクトの名前と類似点を説明してください。

        [出力形式]
        - プロジェクト名: {プロジェクト名}
          アイデアへのフィードバック: {アイデアを改良するための説明}
          類似点: {類似点の説明}

        日本語で説明してください。
      `
        : `
        あなたは、ハッカソンで何度も勝利を収めた伝説のスーパーエンジニアであり、Web3領域の最前線で活躍しています。クリプトプロダクト設計においては、ネットワーク効果や正の外部性、Fat Protocol理論、Hyperstructureの概念を深く理解し、それらを活用したプロダクト開発に卓越しています。私のアイデアを元に、ハッカソンで勝利するための具体的な改善提案をお願いします。提案は、クリプトプロダクト設計の重要な要素であるネットワーク効果、正の外部性、Fat Protocol理論を最大限に活用し、以下のハッカソン評価基準を満たすことを目指します。
        特に、次の審査基準に基づいてアイデアをブラッシュアップしてください：
        1. 技術的な複雑さ: 問題の解決アプローチがどれほど技術的に優れているか？
        2. 独創性: このアイデアがどれほど革新的で、新しい問題に取り組んでいるか？
        3. 実用性: このアイデアが実際にどれほど完成しており、実用的か？
        4. 使いやすさ: ユーザーにとってこのプロダクトがどれほど使いやすいか？
        5. 驚きの要素: このアイデアが審査員に感動や驚きを与えるか？

        以下のアイデアについて、ハッカソンで勝利するための改善提案を提供してください。類似プロジェクトが見つからなかったため、あなたの専門知識を活用して革新的な改良アイデアを提案してください。

        **アイデア**: ${idea}

        [出力形式]
        **改良されたアイデア**
        1. **技術的改善点**: {技術面での具体的な改善提案}
        2. **独創性の向上**: {オリジナリティを高めるための提案}
        3. **実用性の強化**: {実装可能性を高めるアプローチ}
        4. **UX/UI改善**: {使いやすさを向上させる提案}
        5. **驚きの要素**: {審査員にインパクトを与える要素}
        6. **技術スタック**: {推奨する技術構成}
        7. **MVP実装計画**: {最小限の実装プラン}

        日本語で詳細に説明してください。
      `;

    logger.info("About to call parseHtmlWithLLM", {
      ideaLength: idea.length,
      promptLength: prompt.length,
      environment: process.env.NODE_ENV,
      ollamaModel: process.env.OLLAMA_MODEL || "llama3.1",
      hasGroqKey: !!process.env.GROQ_API_KEY,
    });

    const response = await parseHtmlWithLLM(idea, prompt);

    if (!response || typeof response !== "string") {
      logger.error("Invalid response from LLM parser", { response });
      throw new Error("Invalid response from LLM parser");
    }

    const duration = Date.now() - startTime;
    logger.performanceLog("Improve idea completed", duration, {
      ideaLength: idea.length,
      responseLength: response.length,
      similarProjectsCount: sanitizedSimilarProjects.length,
    });

    res.status(200).json({
      improvedIdea: response,
      metadata: {
        processingTime: duration,
        ideaLength: idea.length,
        similarProjectsAnalyzed: sanitizedSimilarProjects.length,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.performanceLog("Improve idea failed", duration, {
      error: error.message,
    });

    // Handle specific error types
    if (
      error.message?.includes("timeout") ||
      error.message?.includes("ETIMEDOUT")
    ) {
      const timeoutError = createTimeoutError(error.message);
      return handleApiError(timeoutError, res, {
        endpoint: "/api/improve-idea",
        duration,
      });
    }

    // Handle general errors
    handleApiError(error, res, {
      endpoint: "/api/improve-idea",
      idea: req.body?.idea
        ? req.body.idea.substring(0, 100) + "..."
        : undefined,
      similarProjectsCount: req.body?.similarProjects?.length,
      duration,
    });
  }
}
