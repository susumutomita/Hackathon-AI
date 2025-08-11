import { QdrantHandler } from "@/lib/qdrantHandler";
import { prizeAnalyzer } from "@/lib/prizeAnalyzer";
import { parseHtmlWithLLM } from "@/lib/llmParser";
import { PrizeInfo, GeneratedIdea } from "@/types/agent.types";
import { Project } from "@/types";
import logger from "@/lib/logger";

export class IdeaGenerationAgent {
  private qdrantHandler: QdrantHandler;

  constructor(qdrantHandler?: QdrantHandler) {
    this.qdrantHandler = qdrantHandler || new QdrantHandler();
  }

  /**
   * プライズ情報から勝てるアイデアを生成
   */
  async generateWinningIdea(
    prizeInfo: PrizeInfo,
    options?: {
      focusArea?: string;
      constraints?: string[];
      preferredTech?: string[];
    },
  ): Promise<GeneratedIdea> {
    logger.info("Starting idea generation", {
      sponsor: prizeInfo.sponsor,
      prizeName: prizeInfo.prizeName,
    });

    try {
      // Step 1: プライズ情報の解析
      const prizeAnalysis = await prizeAnalyzer.analyzePrize(prizeInfo);
      const searchQuery = prizeAnalyzer.generateSearchQuery(prizeAnalysis);

      // Step 2: 関連プロジェクトの検索
      const embedding = await this.qdrantHandler.createEmbedding(searchQuery);
      const relatedProjects = await this.qdrantHandler.searchSimilarProjects(
        embedding,
        20, // より多くのプロジェクトを分析
      );

      // Step 3: 最新トレンドのプロジェクトを取得
      const latestHackathons = ["unite", "cannes", "prague", "bangkok"];
      const trendingProjects = await this.qdrantHandler.getProjectsByHackathons(
        latestHackathons,
        10,
      );

      // Step 4: アイデア生成プロンプトの構築
      const ideaPrompt = this.buildIdeaGenerationPrompt(
        prizeInfo,
        prizeAnalysis,
        relatedProjects,
        trendingProjects,
        options,
      );

      // Step 5: LLMでアイデアを生成
      const generatedIdea = await parseHtmlWithLLM(
        JSON.stringify(prizeInfo),
        ideaPrompt,
      );

      // Step 6: 生成されたアイデアをパース
      const parsedIdea = this.parseGeneratedIdea(
        generatedIdea,
        relatedProjects.slice(0, 5),
      );

      logger.info("Idea generation completed", {
        title: parsedIdea.title,
        winningProbability: parsedIdea.winningProbability,
      });

      return parsedIdea;
    } catch (error) {
      logger.error("Failed to generate idea:", error);
      throw new Error("アイデア生成に失敗しました");
    }
  }

  /**
   * アイデア生成用のプロンプトを構築
   */
  private buildIdeaGenerationPrompt(
    prizeInfo: PrizeInfo,
    prizeAnalysis: any,
    relatedProjects: Project[],
    trendingProjects: Project[],
    options?: any,
  ): string {
    return `
あなたはETHGlobalで15回優勝した伝説のハッカーです。以下のプライズ情報に基づいて、必ず優勝できる革新的なアイデアを生成してください。

# プライズ情報
- **スポンサー**: ${prizeInfo.sponsor}
- **プライズ名**: ${prizeInfo.prizeName}
- **賞金**: ${prizeInfo.prizeAmount || "未定"}
- **要件**: ${prizeInfo.requirements}
- **推奨技術**: ${prizeInfo.technologies?.join(", ") || prizeAnalysis.technologies.join(", ")}
- **評価基準**: ${prizeInfo.judgingCriteria?.join(", ") || "技術的複雑さ、独創性、実用性、UX、驚き"}

# 分析結果
- **重要キーワード**: ${prizeAnalysis.keywords.join(", ")}
- **フォーカスエリア**: ${prizeAnalysis.focusAreas.join(", ")}

# 参考：過去のファイナリストプロジェクト（類似度順）
${relatedProjects
  .slice(0, 10)
  .map((p, i) => `${i + 1}. **${p.title}**: ${p.description}`)
  .join("\n")}

# 最新トレンド（最近のハッカソンから）
${trendingProjects
  .slice(0, 5)
  .map((p, i) => `${i + 1}. **${p.title}** (${p.hackathon}): ${p.description}`)
  .join("\n")}

# 制約条件
${options?.constraints?.join("\n") || "- 48時間で実装可能\n- 明確なデモが可能"}

# 優先技術
${options?.preferredTech?.join(", ") || "最新のWeb3技術"}

# タスク
上記の情報を踏まえて、以下の要素を含む革新的なハッカソンプロジェクトのアイデアを生成してください：

## 必須要素（JSON形式で出力）
\`\`\`json
{
  "title": "プロジェクト名（キャッチーで記憶に残る）",
  "description": "プロジェクトの簡潔な説明（1-2文）",
  "problemStatement": "解決する問題の明確な定義",
  "solution": "提案する解決策の詳細",
  "technicalApproach": "技術的なアプローチと実装方法",
  "techStack": ["使用する技術1", "技術2", ...],
  "mvpFeatures": [
    "48時間で実装するMVP機能1",
    "MVP機能2",
    "MVP機能3"
  ],
  "differentiators": [
    "他のプロジェクトとの差別化要因1",
    "差別化要因2",
    "差別化要因3"
  ],
  "implementationPlan": [
    {
      "phase": "Day 1 AM",
      "tasks": ["タスク1", "タスク2"],
      "duration": "4時間"
    },
    {
      "phase": "Day 1 PM",
      "tasks": ["タスク3", "タスク4"],
      "duration": "4時間"
    },
    {
      "phase": "Day 2",
      "tasks": ["タスク5", "タスク6"],
      "duration": "8時間"
    }
  ],
  "winningProbability": 85,
  "evaluationScores": {
    "technicalComplexity": 9,
    "originality": 9,
    "feasibility": 8,
    "userExperience": 8,
    "wowFactor": 9
  },
  "suggestions": [
    "成功のための追加提案1",
    "追加提案2",
    "追加提案3"
  ]
}
\`\`\`

## 重要な考慮事項
1. **ネットワーク効果**: ユーザーが増えるほど価値が高まる仕組み
2. **正の外部性**: プロトコルの利用が他者にも利益をもたらす設計
3. **Fat Protocol理論**: プロトコル層に価値が蓄積される仕組み
4. **Hyperstructure**: 永続的で無料、検閲耐性のあるインフラ
5. **実装可能性**: 48時間で動くデモを作れること

必ず過去のファイナリストプロジェクトから学び、それを超える革新的なアイデアを生成してください。
`;
  }

  /**
   * 生成されたアイデアをパース
   */
  private parseGeneratedIdea(
    rawIdea: string,
    relatedProjects: Project[],
  ): GeneratedIdea {
    try {
      // JSONブロックを抽出
      const jsonMatch = rawIdea.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);

        // 関連プロジェクト情報を追加
        const enrichedIdea: GeneratedIdea = {
          ...parsed,
          relatedProjects: relatedProjects.map((p) => ({
            title: p.title,
            description: p.description,
            similarity: "高い類似性",
            learnings: `${p.title}から学べる点を分析`,
          })),
        };

        return enrichedIdea;
      }
    } catch (error) {
      logger.warn("Failed to parse JSON from generated idea", { error });
    }

    // フォールバック: デフォルト構造を返す
    return this.createFallbackIdea(rawIdea, relatedProjects);
  }

  /**
   * パース失敗時のフォールバックアイデア生成
   */
  private createFallbackIdea(
    rawIdea: string,
    relatedProjects: Project[],
  ): GeneratedIdea {
    return {
      title: "革新的Web3ソリューション",
      description: rawIdea.substring(0, 200),
      problemStatement: "現在のWeb3エコシステムにおける課題を解決",
      solution: "最新技術を活用した革新的なアプローチ",
      technicalApproach: "スマートコントラクトとdAppの組み合わせ",
      techStack: ["Ethereum", "Next.js", "IPFS", "TheGraph"],
      mvpFeatures: ["基本機能の実装", "UIの構築", "スマートコントラクトの展開"],
      differentiators: ["独自のアプローチ", "優れたUX", "技術的革新性"],
      implementationPlan: [
        {
          phase: "Day 1",
          tasks: ["設計", "基本実装"],
          duration: "8時間",
        },
        {
          phase: "Day 2",
          tasks: ["完成", "デモ準備"],
          duration: "8時間",
        },
      ],
      relatedProjects: relatedProjects.map((p) => ({
        title: p.title,
        description: p.description,
        similarity: "参考プロジェクト",
        learnings: "実装の参考として活用",
      })),
      winningProbability: 70,
      evaluationScores: {
        technicalComplexity: 7,
        originality: 7,
        feasibility: 8,
        userExperience: 7,
        wowFactor: 7,
      },
      suggestions: [
        "プロトタイプの完成度を高める",
        "デモの準備を入念に行う",
        "審査員へのプレゼンテーションを練習する",
      ],
    };
  }
}

export const ideaGenerationAgent = new IdeaGenerationAgent();
