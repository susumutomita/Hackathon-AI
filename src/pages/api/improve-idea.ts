import { NextApiRequest, NextApiResponse } from "next";
import { parseHtmlWithLLM } from "@/lib/llmParser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { idea, similarProjects } = req.body;

    if (!idea || !similarProjects) {
      return res
        .status(400)
        .json({ error: "Missing idea or similar projects data" });
    }

    // プロンプトを日本語に変更
    const prompt = `
      あなたは、ハッカソンで何度も勝利を収めた伝説のスーパーエンジニアであり、Web3領域の最前線で活躍しています。クリプトプロダクト設計においては、ネットワーク効果や正の外部性、Fat Protocol理論、Hyperstructureの概念を深く理解し、それらを活用したプロダクト開発に卓越しています。

      私のアイデアを元に、ハッカソンで勝利するための具体的な改善提案をお願いします。提案は、クリプトプロダクト設計の重要な要素であるネットワーク効果、正の外部性、Fat Protocol理論を最大限に活用し、以下のハッカソン評価基準を満たすことを目指します。

      特に、次の審査基準に基づいてアイデアをブラッシュアップしてください：
      1. 技術的な複雑さ: 問題の解決アプローチがどれほど技術的に優れているか？
      2. 独創性: このアイデアがどれほど革新的で、新しい問題に取り組んでいるか？
      3. 実用性: このアイデアが実際にどれほど完成しており、実用的か？
      4. 使いやすさ: ユーザーにとってこのプロダクトがどれほど使いやすいか？
      5. 驚きの要素: このアイデアが審査員に感動や驚きを与えるか？

      **アイデア**: ${idea}

      **類似プロジェクト**:
      ${similarProjects.map((project: any) => `- ${project.title}: ${project.description}`).join("\n")}

      これらの要素を組み込み、事実に基づいた現実的で勝てるアイデアに仕上げてください。また、日本語での提案をお願いします。
    `;

    const improvedIdea = await parseHtmlWithLLM(idea, prompt);

    res.status(200).json({ improvedIdea });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to generate improved idea",
      details: error.message || "An unknown error occurred",
    });
  }
}
