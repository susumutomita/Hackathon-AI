import { IdeaGenerationAgent } from "@/lib/ideaGenerationAgent";
import { parseHtmlWithLLM } from "@/lib/llmParser";
import logger from "@/lib/logger";
import type { QdrantHandler } from "@/lib/qdrantHandler";
import type { GeneratedIdea, PrizeInfo } from "@/types/agent.types";

export type CriticRole = "prize-fit" | "novelty" | "feasibility";

export interface CriticFinding {
  severity: "low" | "medium" | "high";
  category: string;
  finding: string;
  evidence: string;
  recommendation: string;
}

export interface CriticResult {
  role: CriticRole;
  score: number;
  summary: string;
  findings: CriticFinding[];
}

export interface JudgeResult {
  approved: boolean;
  score: number;
  winningProbability: number;
  summary: string;
  remainingRisks: string[];
}

export interface AgenticGenerationResult {
  idea: GeneratedIdea;
  critics: CriticResult[];
  judge: JudgeResult;
  revised: boolean;
}

const CRITIC_PROMPTS: Record<CriticRole, string> = {
  "prize-fit": `あなたはハッカソンのスポンサー審査員です。
候補アイデアがプライズ要件・必須技術・評価基準を本当に満たしているかだけを厳しく評価してください。
要件を満たしていないのに好意的に解釈してはいけません。`,
  novelty: `あなたは過去のハッカソン受賞作を熟知した新規性レビュー担当です。
候補アイデアが過去の類似プロジェクトの焼き直しになっていないか、差別化が実質的かを厳しく評価してください。
単なる技術の組み合わせや名称変更を新規性として高く評価してはいけません。`,
  feasibility: `あなたは48時間ハッカソンのテクニカルリードです。
候補アイデアが48時間で動くデモまで到達できるか、外部依存・未知技術・統合難易度・デモ失敗リスクを厳しく評価してください。
実装量を楽観視してはいけません。`,
};

export class AgenticIdeaGenerationAgent {
  private readonly baseAgent: IdeaGenerationAgent;

  constructor(qdrantHandler?: QdrantHandler) {
    this.baseAgent = new IdeaGenerationAgent(qdrantHandler);
  }

  async generateWinningIdea(
    prizeInfo: PrizeInfo,
    options?: {
      focusArea?: string;
      constraints?: string[];
      preferredTech?: string[];
    },
  ): Promise<AgenticGenerationResult> {
    logger.info("Starting agentic idea generation loop", {
      sponsor: prizeInfo.sponsor,
      prizeName: prizeInfo.prizeName,
    });

    const initialIdea = await this.baseAgent.generateWinningIdea(prizeInfo, options);

    const initialCritics = await this.runCritics(prizeInfo, initialIdea);
    const shouldRevise = this.shouldRevise(initialCritics);

    let candidateIdea = initialIdea;
    let revised = false;

    if (shouldRevise) {
      candidateIdea = await this.reviseIdea(
        prizeInfo,
        initialIdea,
        initialCritics,
        options,
      );
      revised = true;
    }

    // Re-evaluate the revised idea so the final judge never relies on stale criticism.
    const finalCritics = revised
      ? await this.runCritics(prizeInfo, candidateIdea)
      : initialCritics;
    const judge = await this.runJudge(prizeInfo, candidateIdea, finalCritics);

    const finalIdea: GeneratedIdea = {
      ...candidateIdea,
      winningProbability: judge.winningProbability,
      suggestions: [
        ...candidateIdea.suggestions,
        ...judge.remainingRisks.map((risk) => `最終リスク: ${risk}`),
      ],
    };

    logger.info("Agentic idea generation loop completed", {
      title: finalIdea.title,
      revised,
      approved: judge.approved,
      judgeScore: judge.score,
      winningProbability: judge.winningProbability,
    });

    return {
      idea: finalIdea,
      critics: finalCritics,
      judge,
      revised,
    };
  }

  private async runCritics(
    prizeInfo: PrizeInfo,
    idea: GeneratedIdea,
  ): Promise<CriticResult[]> {
    const roles: CriticRole[] = ["prize-fit", "novelty", "feasibility"];

    return Promise.all(
      roles.map((role) => this.runCritic(role, prizeInfo, idea)),
    );
  }

  private async runCritic(
    role: CriticRole,
    prizeInfo: PrizeInfo,
    idea: GeneratedIdea,
  ): Promise<CriticResult> {
    const prompt = `${CRITIC_PROMPTS[role]}

# プライズ情報
${JSON.stringify(prizeInfo, null, 2)}

# 候補アイデア
${JSON.stringify(idea, null, 2)}

以下のJSONだけを返してください。Markdownコードフェンスは不要です。
{
  "score": 0から10の整数,
  "summary": "評価の要約",
  "findings": [
    {
      "severity": "low | medium | high",
      "category": "分類",
      "finding": "具体的な問題",
      "evidence": "なぜそう判断できるか。入力情報に基づく根拠",
      "recommendation": "修正方法"
    }
  ]
}

根拠がない指摘は作らず、問題がなければfindingsは空配列にしてください。`;

    const raw = await parseHtmlWithLLM(JSON.stringify(idea), prompt);
    const parsed = parseJsonObject(raw);

    return {
      role,
      score: clampNumber(parsed.score, 0, 10, 5),
      summary:
        typeof parsed.summary === "string"
          ? parsed.summary
          : "評価結果を構造化できませんでした。",
      findings: normalizeFindings(parsed.findings),
    };
  }

  private shouldRevise(critics: CriticResult[]): boolean {
    const averageScore =
      critics.reduce((sum, critic) => sum + critic.score, 0) / critics.length;
    const hasHighSeverityFinding = critics.some((critic) =>
      critic.findings.some((finding) => finding.severity === "high"),
    );

    return averageScore < 8 || hasHighSeverityFinding;
  }

  private async reviseIdea(
    prizeInfo: PrizeInfo,
    idea: GeneratedIdea,
    critics: CriticResult[],
    options?: {
      focusArea?: string;
      constraints?: string[];
      preferredTech?: string[];
    },
  ): Promise<GeneratedIdea> {
    const prompt = `あなたはハッカソンのシニアプロダクトエンジニアです。
以下の候補アイデアを、独立した3つのレビュー結果をすべて考慮して修正してください。
指摘を表面的に言い換えるのではなく、プライズ適合性・新規性・48時間での実装可能性を同時に改善してください。

# プライズ情報
${JSON.stringify(prizeInfo, null, 2)}

# オプション・制約
${JSON.stringify(options ?? {}, null, 2)}

# 元のアイデア
${JSON.stringify(idea, null, 2)}

# 独立レビュー
${JSON.stringify(critics, null, 2)}

元のGeneratedIdeaと同じJSON構造だけを返してください。Markdownコードフェンスは不要です。
relatedProjectsは元の値を維持してください。
winningProbabilityは自己採点なので変更しても最終的にはJudgeが上書きします。`;

    const raw = await parseHtmlWithLLM(JSON.stringify(idea), prompt);
    const parsed = parseJsonObject(raw);

    return normalizeGeneratedIdea(parsed, idea);
  }

  private async runJudge(
    prizeInfo: PrizeInfo,
    idea: GeneratedIdea,
    critics: CriticResult[],
  ): Promise<JudgeResult> {
    const prompt = `あなたは最終審査担当です。
生成担当とは独立した立場で、候補アイデアと3つのレビュー結果だけを材料に最終判定してください。
レビューに重大な未解決事項がある場合はapprovedをfalseにしてください。
winningProbabilityを根拠なく高くしないでください。

# プライズ情報
${JSON.stringify(prizeInfo, null, 2)}

# 候補アイデア
${JSON.stringify(idea, null, 2)}

# 独立レビュー
${JSON.stringify(critics, null, 2)}

以下のJSONだけを返してください。Markdownコードフェンスは不要です。
{
  "approved": trueまたはfalse,
  "score": 0から10の数値,
  "winningProbability": 0から100の整数,
  "summary": "最終判断",
  "remainingRisks": ["未解決リスク"]
}`;

    const raw = await parseHtmlWithLLM(JSON.stringify(idea), prompt);
    const parsed = parseJsonObject(raw);

    return {
      approved: parsed.approved === true,
      score: clampNumber(parsed.score, 0, 10, 5),
      winningProbability: Math.round(
        clampNumber(parsed.winningProbability, 0, 100, 50),
      ),
      summary:
        typeof parsed.summary === "string"
          ? parsed.summary
          : "最終評価を構造化できませんでした。",
      remainingRisks: Array.isArray(parsed.remainingRisks)
        ? parsed.remainingRisks.filter(
            (risk): risk is string => typeof risk === "string",
          )
        : [],
    };
  }
}

function parseJsonObject(raw: string): Record<string, any> {
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch?.[1] ?? trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    if (!objectMatch) {
      return {};
    }

    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      return {};
    }
  }
}

function normalizeFindings(value: unknown): CriticFinding[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      severity:
        item.severity === "high" || item.severity === "medium"
          ? item.severity
          : "low",
      category: typeof item.category === "string" ? item.category : "general",
      finding: typeof item.finding === "string" ? item.finding : "",
      evidence: typeof item.evidence === "string" ? item.evidence : "",
      recommendation:
        typeof item.recommendation === "string" ? item.recommendation : "",
    }))
    .filter((finding) => finding.finding.length > 0);
}

function normalizeGeneratedIdea(
  value: Record<string, any>,
  fallback: GeneratedIdea,
): GeneratedIdea {
  return {
    title: typeof value.title === "string" ? value.title : fallback.title,
    description:
      typeof value.description === "string"
        ? value.description
        : fallback.description,
    problemStatement:
      typeof value.problemStatement === "string"
        ? value.problemStatement
        : fallback.problemStatement,
    solution:
      typeof value.solution === "string" ? value.solution : fallback.solution,
    technicalApproach:
      typeof value.technicalApproach === "string"
        ? value.technicalApproach
        : fallback.technicalApproach,
    techStack: stringArrayOrFallback(value.techStack, fallback.techStack),
    mvpFeatures: stringArrayOrFallback(value.mvpFeatures, fallback.mvpFeatures),
    differentiators: stringArrayOrFallback(
      value.differentiators,
      fallback.differentiators,
    ),
    implementationPlan: Array.isArray(value.implementationPlan)
      ? value.implementationPlan
          .filter(
            (item: unknown): item is Record<string, unknown> =>
              Boolean(item && typeof item === "object"),
          )
          .map((item: Record<string, unknown>) => ({
            phase: typeof item.phase === "string" ? item.phase : "Phase",
            tasks: Array.isArray(item.tasks)
              ? item.tasks.filter(
                  (task: unknown): task is string => typeof task === "string",
                )
              : [],
            duration:
              typeof item.duration === "string" ? item.duration : "未定",
          }))
      : fallback.implementationPlan,
    relatedProjects: fallback.relatedProjects,
    winningProbability: Math.round(
      clampNumber(value.winningProbability, 0, 100, fallback.winningProbability),
    ),
    evaluationScores: {
      technicalComplexity: clampNumber(
        value.evaluationScores?.technicalComplexity,
        0,
        10,
        fallback.evaluationScores.technicalComplexity,
      ),
      originality: clampNumber(
        value.evaluationScores?.originality,
        0,
        10,
        fallback.evaluationScores.originality,
      ),
      feasibility: clampNumber(
        value.evaluationScores?.feasibility,
        0,
        10,
        fallback.evaluationScores.feasibility,
      ),
      userExperience: clampNumber(
        value.evaluationScores?.userExperience,
        0,
        10,
        fallback.evaluationScores.userExperience,
      ),
      wowFactor: clampNumber(
        value.evaluationScores?.wowFactor,
        0,
        10,
        fallback.evaluationScores.wowFactor,
      ),
    },
    suggestions: stringArrayOrFallback(value.suggestions, fallback.suggestions),
  };
}

function stringArrayOrFallback(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const strings = value.filter(
    (item): item is string => typeof item === "string",
  );
  return strings.length > 0 ? strings : fallback;
}

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}
