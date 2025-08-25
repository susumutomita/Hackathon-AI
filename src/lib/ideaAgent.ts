import { QdrantHandlerFactory } from "@/factories/qdrantHandler.factory";
import { parseHtmlWithLLM } from "@/lib/llmParser";
import logger from "@/lib/logger";
import type { Project } from "@/types";
import { buildSecurePrompt } from "./promptSecurityGuard";

export type GeneratedIdeaResult = {
  content: string;
  similarProjects: Project[];
};

function buildTrendsSummary(): string {
  // Lightweight static trend hints; can be replaced by a live adapter later.
  const trends = [
    "Intent-based UX (account abstraction, ERC-4337)",
    "Onchain agents and automation (CoW hooks, Safe Modules)",
    "ZK proving UX (ZKML, proofs-as-a-service)",
    "Restaking and AVS composability (EigenLayer ecosystem)",
    "Modular L2s and shared sequencing (OP Stack, Alt DA)",
    "DePIN + real-world assets with verifiable oracles",
    "Verifiable compute for AI + crypto (inference receipts)",
  ];
  return trends.map((t) => `- ${t}`).join("\n");
}

function buildPromptTemplate(projects: Project[]): string {
  const trends = buildTrendsSummary();
  const projectLines = projects
    .map((p, i) => `- [${i + 1}] ${p.title}: ${p.description}`)
    .join("\n");

  return `あなたはETHGlobal常勝の創造的ハッカー。以下のプライズ説明を読み、最新トレンドと過去ファイナリスト事例から勝てるアイデアを日本語で具体化してください。

【プライズ説明】
[[USER_INPUT]]

【最近のトレンド（参考）】
${trends}

【参考となる類似ファイナリスト（簡易要約）】
${projectLines}

出力は次の構成で、審査で刺さる"完成度の高い"案にしてください：
1. タイトル: 一行で魅力を伝える
2. One-liner: 120文字以内の要約
3. 何が新しいか: 独自性と驚きの要素
4. Prize適合ポイント: スポンサー要件・評価軸との整合
5. 核となるUX: 主要ユーザーフロー3つ（箇条書き）
6. 技術構成: アーキテクチャ（コントラクト/インデクシング/フロント/外部API/ツール）
7. 実装計画(MVP): ハッカソン48時間のタスク分解（機能/担当/難所）
8. 差別化: 上記ファイナリストとの違いと優位性
9. デモ台本: 3分ピッチの流れ（ライブ操作含む）
10. 追加伸びしろ: 受賞後の発展案（2〜3）

各セクションを明確な見出しと箇条書き中心で書き、具体的なAPI名・コントラクト仕様・ZK/AA/インデクサ等の選定理由も入れてください。`;
}

export async function generateIdeaFromPrize(
  prize: string,
): Promise<GeneratedIdeaResult> {
  const qdrant = QdrantHandlerFactory.createDefault();
  logger.info("Generating idea from prize brief", {
    prizeLength: prize.length,
  });

  // 1) Retrieve similar finalists via embedding search
  const embedding = await qdrant.createEmbedding(prize);
  const similarProjects = await qdrant.searchSimilarProjects(embedding, 12);

  // 2) Build secure synthesis prompt and call LLM
  const promptTemplate = buildPromptTemplate(similarProjects);
  const securePrompt = buildSecurePrompt(promptTemplate, prize);
  const content = await parseHtmlWithLLM(prize, securePrompt);

  return { content, similarProjects };
}
