import { PrizeInfo } from "@/types/agent.types";
import { parseHtmlWithLLM } from "@/lib/llmParser";
import logger from "@/lib/logger";

export class PrizeAnalyzer {
  /**
   * プライズ情報から重要なキーワードと技術要件を抽出
   */
  async analyzePrize(prizeInfo: PrizeInfo): Promise<{
    keywords: string[];
    technologies: string[];
    focusAreas: string[];
    evaluationCriteria: string[];
  }> {
    logger.info("Analyzing prize information", {
      sponsor: prizeInfo.sponsor,
      prizeName: prizeInfo.prizeName,
    });

    const prompt = `
    以下のハッカソンのプライズ情報を分析し、重要な要素を抽出してください。

    **スポンサー**: ${prizeInfo.sponsor}
    **プライズ名**: ${prizeInfo.prizeName}
    **賞金**: ${prizeInfo.prizeAmount || "未定"}
    **要件**: ${prizeInfo.requirements}
    **指定技術**: ${prizeInfo.technologies?.join(", ") || "なし"}
    **評価基準**: ${prizeInfo.judgingCriteria?.join(", ") || "標準基準"}
    **追加情報**: ${prizeInfo.additionalInfo || "なし"}

    以下の形式でJSON形式で出力してください：
    {
      "keywords": ["キーワード1", "キーワード2", ...],
      "technologies": ["技術1", "技術2", ...],
      "focusAreas": ["重点分野1", "重点分野2", ...],
      "evaluationCriteria": ["評価基準1", "評価基準2", ...]
    }

    重要なポイント：
    - keywordsには、プライズと関連する重要な概念やトピックを含める
    - technologiesには、使用が推奨または必須の技術スタックを含める
    - focusAreasには、プロジェクトが解決すべき問題領域を含める
    - evaluationCriteriaには、審査で重視される要素を含める
    `;

    try {
      const response = await parseHtmlWithLLM(
        JSON.stringify(prizeInfo),
        prompt,
      );

      // JSONとして解析を試みる
      try {
        const parsed = JSON.parse(response);
        return {
          keywords: parsed.keywords || [],
          technologies: parsed.technologies || [],
          focusAreas: parsed.focusAreas || [],
          evaluationCriteria: parsed.evaluationCriteria || [],
        };
      } catch (parseError) {
        // JSON解析に失敗した場合は、テキストから抽出
        logger.warn("Failed to parse JSON response, extracting from text");
        return this.extractFromText(response, prizeInfo);
      }
    } catch (error) {
      logger.error("Failed to analyze prize:", error);
      // フォールバック: 入力から直接抽出
      return {
        keywords: this.extractKeywordsFromPrize(prizeInfo),
        technologies: prizeInfo.technologies || [],
        focusAreas: [],
        evaluationCriteria: prizeInfo.judgingCriteria || [],
      };
    }
  }

  /**
   * テキストから情報を抽出（フォールバック）
   */
  private extractFromText(
    text: string,
    prizeInfo: PrizeInfo,
  ): {
    keywords: string[];
    technologies: string[];
    focusAreas: string[];
    evaluationCriteria: string[];
  } {
    const keywords = this.extractKeywordsFromPrize(prizeInfo);
    const technologies = prizeInfo.technologies || [];

    // テキストから追加のキーワードを抽出
    const additionalKeywords =
      text.match(/["']([^"']+)["']/g)?.map((s) => s.replace(/["']/g, "")) || [];

    return {
      keywords: [...new Set([...keywords, ...additionalKeywords])].slice(0, 10),
      technologies,
      focusAreas: [],
      evaluationCriteria: prizeInfo.judgingCriteria || [],
    };
  }

  /**
   * プライズ情報から直接キーワードを抽出
   */
  private extractKeywordsFromPrize(prizeInfo: PrizeInfo): string[] {
    const keywords: string[] = [];

    // スポンサー名を追加
    if (prizeInfo.sponsor) {
      keywords.push(prizeInfo.sponsor.toLowerCase());
    }

    // プライズ名から重要な単語を抽出
    if (prizeInfo.prizeName) {
      const words = prizeInfo.prizeName
        .split(/\s+/)
        .filter((word) => word.length > 3)
        .map((word) => word.toLowerCase());
      keywords.push(...words);
    }

    // 要件から重要な単語を抽出
    if (prizeInfo.requirements) {
      const importantWords = prizeInfo.requirements
        .split(/\s+/)
        .filter(
          (word) =>
            word.length > 4 &&
            !["that", "this", "with", "from", "have"].includes(
              word.toLowerCase(),
            ),
        )
        .map((word) => word.toLowerCase());
      keywords.push(...importantWords.slice(0, 5));
    }

    return [...new Set(keywords)];
  }

  /**
   * プライズと関連性の高いプロジェクトを検索するためのクエリを生成
   */
  generateSearchQuery(analysis: {
    keywords: string[];
    technologies: string[];
    focusAreas: string[];
  }): string {
    const parts: string[] = [];

    // 最も重要なキーワードを含める
    if (analysis.keywords.length > 0) {
      parts.push(analysis.keywords.slice(0, 3).join(" "));
    }

    // 主要な技術を含める
    if (analysis.technologies.length > 0) {
      parts.push(analysis.technologies.slice(0, 2).join(" "));
    }

    // フォーカスエリアを含める
    if (analysis.focusAreas.length > 0) {
      parts.push(analysis.focusAreas[0]);
    }

    return parts.join(" ") || "innovative blockchain solution";
  }
}

export const prizeAnalyzer = new PrizeAnalyzer();
