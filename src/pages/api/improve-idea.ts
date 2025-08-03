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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const startTime = Date.now();

  try {
    // Validate HTTP method
    validateMethod(req.method, ["POST"]);

    // Validate required fields
    validateRequired(req.body, ["idea", "similarProjects"]);

    const { idea, similarProjects } = req.body;

    // Additional validation
    if (typeof idea !== "string" || idea.trim().length === 0) {
      throw createValidationError("Idea must be a non-empty string");
    }

    if (idea.length > 10000) {
      throw createValidationError("Idea exceeds maximum length of 10000 characters");
    }

    if (!Array.isArray(similarProjects)) {
      throw createValidationError("Similar projects must be an array");
    }

    if (similarProjects.length === 0) {
      throw createValidationError("At least one similar project is required");
    }

    // Validate similar projects structure
    for (const project of similarProjects) {
      if (!project.title || !project.description) {
        throw createValidationError("Each similar project must have title and description");
      }
    }

    logger.info("Improve idea request started", {
      ideaLength: idea.length,
      similarProjectsCount: similarProjects.length,
      userAgent: req.headers["user-agent"],
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    });

    const prompt = `
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
      ${similarProjects.map((project: any) => `- ${project.title}: ${project.description}`).join("\n")}

      提案されたアイデアと類似プロジェクトを比較し、以下の形式で似ているプロジェクトの名前と類似点を説明してください。

      [出力形式]
      - プロジェクト名: {プロジェクト名}
        アイデアへのフィードバック: {アイデアを改良するための説明}
        類似点: {類似点の説明}

      日本語で説明してください。
    `;

    const response = await parseHtmlWithLLM(idea, prompt);

    if (!response || typeof response !== "string") {
      throw new Error("Invalid response from LLM parser");
    }

    const duration = Date.now() - startTime;
    logger.performanceLog("Improve idea completed", duration, {
      ideaLength: idea.length,
      responseLength: response.length,
      similarProjectsCount: similarProjects.length,
    });

    res.status(200).json({ 
      improvedIdea: response,
      metadata: {
        processingTime: duration,
        ideaLength: idea.length,
        similarProjectsAnalyzed: similarProjects.length,
      },
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.performanceLog("Improve idea failed", duration, {
      error: error.message,
    });

    // Handle specific error types
    if (error.message?.includes("timeout") || error.message?.includes("ETIMEDOUT")) {
      const timeoutError = createTimeoutError(error.message);
      return handleApiError(timeoutError, res, { 
        endpoint: "/api/improve-idea",
        duration,
      });
    }

    // Handle general errors
    handleApiError(error, res, { 
      endpoint: "/api/improve-idea",
      idea: req.body?.idea ? req.body.idea.substring(0, 100) + "..." : undefined,
      similarProjectsCount: req.body?.similarProjects?.length,
      duration,
    });
  }
}
