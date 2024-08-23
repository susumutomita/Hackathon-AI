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

    const prompt = `
      あなたはハッカソンで何度も勝利を収めた伝説のスーパーエンジニアです。以下の新しいアイデアについて、過去の類似プロジェクトと比較し、どのプロジェクトが似ているか、そしてなぜ似ているのかを説明してください。

      **アイデア**: ${idea}

      **類似プロジェクト**:
      ${similarProjects.map((project: any) => `- ${project.title}: ${project.description}`).join("\n")}

      提案されたアイデアと類似プロジェクトを比較し、以下の形式で似ているプロジェクトの名前と類似点を説明してください。

      [出力形式]
      - プロジェクト名: {プロジェクト名}
        類似点: {類似点の説明}

      日本語で説明してください。
    `;

    const response = await parseHtmlWithLLM(idea, prompt);

    res.status(200).json({ improvedIdea: response });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to generate improved idea",
      details: error.message || "An unknown error occurred",
    });
  }
}
