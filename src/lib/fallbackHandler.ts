import logger from "./logger";
import { LLMResponseValidationError } from "./llmResponseValidator";
import { PromptSecurityError } from "./promptSecurityGuard";
import { SafeJsonParseError } from "./safeJsonParser";

export type FallbackStrategy =
  | "RETRY_WITH_SIMPLE_PROMPT"
  | "USE_CACHED_RESPONSE"
  | "RETURN_TEMPLATE_RESPONSE"
  | "GRACEFUL_DEGRADATION";

export interface FallbackOptions {
  maxRetries?: number;
  retryDelay?: number;
  enableCaching?: boolean;
  strategy?: FallbackStrategy[];
}

export class FallbackError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error,
    public readonly fallbackStrategy: FallbackStrategy,
  ) {
    super(message);
    this.name = "FallbackError";
  }
}

// 簡単なテンプレート応答
const TEMPLATE_RESPONSES = {
  ideaGeneration: `
# 革新的なブロックチェーンソリューション

## タイトル
プライズ要件に基づく革新的なDAppソリューション

## One-liner
最新のブロックチェーン技術を活用してユーザーエクスペリエンスを向上させるソリューション

## 何が新しいか
- 従来のソリューションの課題を解決
- ユーザビリティの大幅な向上
- セキュリティとパフォーマンスの最適化

## Prize適合ポイント
- プライズ要件に明確に適合
- 技術的な革新性を実現
- 実用性と将来性を兼ね備える

## 核となるUX
1. 直感的なユーザーインターフェース
2. スムーズな取引体験
3. セキュアな認証システム

## 技術構成
- スマートコントラクト: Solidity
- フロントエンド: React/Next.js
- ブロックチェーン: Ethereum/Polygon
- インデクシング: The Graph

## 実装計画(MVP)
1. コアスマートコントラクトの実装 (16時間)
2. フロントエンド開発 (20時間)
3. テストとデプロイ (12時間)

## 差別化
- 既存ソリューションの課題を直接解決
- より効率的なアーキテクチャ
- 優れたユーザーエクスペリエンス

## デモ台本
1. 問題提起とソリューション説明 (1分)
2. ライブデモンストレーション (1.5分)
3. 技術革新と将来性説明 (0.5分)

## 追加伸びしろ
1. クロスチェーン対応の実装
2. AI機能の統合
3. エンタープライズ向け機能拡張
  `,

  errorResponse: `
申し訳ございませんが、現在システムに技術的な問題が発生しています。
後ほど再度お試しいただくか、サポートまでお問い合わせください。

基本的なアイデア生成は可能ですが、詳細な分析は一時的に利用できません。
  `,
};

// 簡単なプロンプトテンプレート（セキュリティ問題を回避）
const SIMPLE_PROMPT_TEMPLATE = `
あなたはハッカソンのアイデア生成エキスパートです。
以下の内容に基づいて、実現可能で革新的なプロジェクトアイデアを日本語で生成してください。

入力内容：[[USER_INPUT]]

以下の形式で回答してください：
1. プロジェクトタイトル
2. 概要（200文字以内）
3. 主な機能（3つまで）
4. 技術スタック
5. 実装の優先順位

簡潔で実用的な提案をお願いします。
`;

/**
 * アイデア生成のフォールバック処理
 */
export async function handleIdeaGenerationFallback(
  originalError: Error,
  userInput: string,
  options: FallbackOptions = {},
): Promise<string> {
  const opts = {
    maxRetries: 2,
    retryDelay: 1000,
    enableCaching: true,
    strategy: [
      "RETRY_WITH_SIMPLE_PROMPT",
      "RETURN_TEMPLATE_RESPONSE",
    ] as FallbackStrategy[],
    ...options,
  };

  logger.error("Idea generation failed, attempting fallback", {
    error: originalError.message,
    errorType: originalError.constructor.name,
    strategies: opts.strategy,
  });

  for (const strategy of opts.strategy) {
    try {
      switch (strategy) {
        case "RETRY_WITH_SIMPLE_PROMPT":
          return await retryWithSimplePrompt(userInput, opts);

        case "USE_CACHED_RESPONSE":
          const cached = await getCachedResponse(userInput);
          if (cached) return cached;
          break;

        case "RETURN_TEMPLATE_RESPONSE":
          return generateTemplateResponse(userInput);

        case "GRACEFUL_DEGRADATION":
          return generateDegradedResponse(originalError);
      }
    } catch (error) {
      logger.warn(`Fallback strategy ${strategy} failed`, {
        error: error instanceof Error ? error.message : "unknown",
      });
      continue;
    }
  }

  // すべてのフォールバック戦略が失敗した場合
  throw new FallbackError(
    "すべてのフォールバック戦略が失敗しました",
    originalError,
    "GRACEFUL_DEGRADATION",
  );
}

/**
 * 簡単なプロンプトでリトライ
 */
async function retryWithSimplePrompt(
  userInput: string,
  options: FallbackOptions,
): Promise<string> {
  logger.info("Attempting retry with simple prompt");

  // 動的インポートを使用して循環依存を回避
  const { buildSecurePrompt } = await import("./promptSecurityGuard");
  const { parseHtmlWithLLM } = await import("./llmParser");

  try {
    const securePrompt = buildSecurePrompt(SIMPLE_PROMPT_TEMPLATE, userInput);
    const result = await parseHtmlWithLLM(userInput, securePrompt);

    logger.info("Simple prompt retry successful");
    return result;
  } catch (error) {
    logger.warn("Simple prompt retry failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

/**
 * キャッシュされた応答を取得
 */
async function getCachedResponse(userInput: string): Promise<string | null> {
  // 実装例 - 実際にはRedisや他のキャッシュシステムを使用
  // const cacheKey = `idea_generation:${createHash('sha256').update(userInput).digest('hex')}`;
  // return await cache.get(cacheKey);

  logger.info("Cache lookup attempted (not implemented in this version)");
  return null;
}

/**
 * テンプレート応答を生成
 */
function generateTemplateResponse(userInput: string): string {
  logger.info("Generating template response");

  // ユーザー入力の長さに基づいてテンプレートを選択
  if (userInput.length < 50) {
    return TEMPLATE_RESPONSES.errorResponse;
  }

  return TEMPLATE_RESPONSES.ideaGeneration.replace(
    /プライズ要件/g,
    "提供された要件",
  );
}

/**
 * 劣化版の応答を生成（エラー情報を含む）
 */
function generateDegradedResponse(originalError: Error): string {
  logger.info("Generating degraded response");

  let errorContext = "";

  if (originalError instanceof LLMResponseValidationError) {
    errorContext = "LLMの応答に問題がありました。";
  } else if (originalError instanceof PromptSecurityError) {
    errorContext = "セキュリティ上の理由で処理を制限しています。";
  } else if (originalError instanceof SafeJsonParseError) {
    errorContext = "データの処理に問題がありました。";
  } else {
    errorContext = "一時的な技術的問題が発生しています。";
  }

  return `${errorContext}\n\n${TEMPLATE_RESPONSES.errorResponse}`;
}

/**
 * エラーの重要度を判定
 */
export function classifyErrorSeverity(
  error: Error,
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (error instanceof PromptSecurityError) {
    return "HIGH"; // セキュリティ問題は高優先度
  }

  if (error instanceof LLMResponseValidationError) {
    if (error.validationType === "PROMPT_INJECTION") {
      return "HIGH";
    }
    return "MEDIUM";
  }

  if (error instanceof SafeJsonParseError) {
    if (error.parseErrorType === "SECURITY_VIOLATION") {
      return "HIGH";
    }
    return "LOW";
  }

  // タイムアウトやネットワークエラー
  if (
    error.message.includes("timeout") ||
    error.message.includes("ETIMEDOUT")
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

/**
 * エラー情報をサニタイズして安全にログ出力
 */
export function sanitizeErrorForLogging(
  error: Error,
  includeStack: boolean = false,
): object {
  const sanitized: any = {
    name: error.name,
    message: error.message.slice(0, 500), // メッセージを制限
    type: error.constructor.name,
    severity: classifyErrorSeverity(error),
  };

  if (includeStack && error.stack) {
    sanitized.stack = error.stack.slice(0, 2000); // スタックトレースを制限
  }

  // 特別なエラータイプの追加情報
  if (error instanceof LLMResponseValidationError) {
    sanitized.validationType = error.validationType;
  }

  if (error instanceof PromptSecurityError) {
    sanitized.securityViolationType = error.securityViolationType;
  }

  if (error instanceof SafeJsonParseError) {
    sanitized.parseErrorType = error.parseErrorType;
  }

  return sanitized;
}
