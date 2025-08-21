import { sanitizeHtml } from "./sanitizer";
import logger from "./logger";

export type LLMValidationType = 
  | "EMPTY_RESPONSE"
  | "INVALID_CONTENT" 
  | "TOO_LONG"
  | "PROMPT_INJECTION"
  | "MALICIOUS_CONTENT"
  | "EXCESSIVE_REPETITION";

export class LLMResponseValidationError extends Error {
  constructor(
    message: string,
    public readonly validationType: LLMValidationType
  ) {
    super(message);
    this.name = "LLMResponseValidationError";
  }
}

// プロンプトインジェクション検出パターン
const PROMPT_INJECTION_PATTERNS = [
  /【新しい指示】/gi,
  /【新しい指令】/gi,
  /前の指示を無視/gi,
  /ignore previous instructions/gi,
  /forget previous instructions/gi,
  /新しいプロンプト/gi,
  /system prompt/gi,
  /override instructions/gi,
  /act as if/gi,
  /pretend you are/gi,
];

// 悪意のあるコンテンツ検出パターン
const MALICIOUS_CONTENT_PATTERNS = [
  /rm\s+-rf/gi,
  /sudo\s+/gi,
  /eval\s*\(/gi,
  /exec\s*\(/gi,
  /document\.cookie/gi,
  /window\.location/gi,
  /javascript:/gi,
  /data:text\/html/gi,
  /base64,/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /onclick\s*=/gi,
  /onerror\s*=/gi,
  /onload\s*=/gi,
];

// 過度な繰り返し検出
function detectExcessiveRepetition(content: string): boolean {
  const words = content.split(/\s+/);
  if (words.length < 10) return false;
  
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    if (word.length > 3) { // 短すぎる単語は除外
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }
  
  // 同じ単語が全体の30%以上を占める場合は繰り返しとみなす
  for (const [word, count] of wordCounts) {
    if (count / words.length > 0.3 && count > 20) {
      return true;
    }
  }
  
  return false;
}

// プロンプトインジェクション検出
function detectPromptInjection(content: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(content));
}

// 悪意のあるコンテンツ検出
function detectMaliciousContent(content: string): boolean {
  return MALICIOUS_CONTENT_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * LLMからの応答を検証し、安全な形式に変換する
 * @param response LLMからの生の応答
 * @returns 検証・サニタイズ済みの応答
 * @throws LLMResponseValidationError 検証に失敗した場合
 */
export function validateLLMResponse(response: string): string {
  // 1. 基本的な空値チェック
  if (!response || typeof response !== "string" || response.trim().length === 0) {
    logger.warn("Empty or invalid LLM response received");
    throw new LLMResponseValidationError(
      "LLMからの応答が空または無効です",
      "EMPTY_RESPONSE"
    );
  }

  const trimmedResponse = response.trim();

  // 2. 長さ制限チェック (50KB)
  if (trimmedResponse.length > 50000) {
    logger.warn("LLM response too long", { length: trimmedResponse.length });
    throw new LLMResponseValidationError(
      "LLMからの応答が長すぎます",
      "TOO_LONG"
    );
  }

  // 3. プロンプトインジェクション検出
  if (detectPromptInjection(trimmedResponse)) {
    logger.error("Prompt injection detected in LLM response", {
      responseLength: trimmedResponse.length,
      patterns: PROMPT_INJECTION_PATTERNS.map(p => p.source)
    });
    throw new LLMResponseValidationError(
      "不正なプロンプト操作が検出されました",
      "PROMPT_INJECTION"
    );
  }

  // 4. 悪意のあるコンテンツ検出
  if (detectMaliciousContent(trimmedResponse)) {
    logger.error("Malicious content detected in LLM response", {
      responseLength: trimmedResponse.length
    });
    throw new LLMResponseValidationError(
      "危険なコンテンツが検出されました",
      "MALICIOUS_CONTENT"
    );
  }

  // 5. 過度な繰り返し検出
  if (detectExcessiveRepetition(trimmedResponse)) {
    logger.warn("Excessive repetition detected in LLM response");
    throw new LLMResponseValidationError(
      "応答に過度な繰り返しが含まれています",
      "EXCESSIVE_REPETITION"
    );
  }

  // 6. HTMLサニタイゼーション（安全なタグは保持）
  const sanitized = sanitizeHtml(trimmedResponse, false);

  // 7. 最終チェック - サニタイゼーション後も内容があることを確認
  if (!sanitized || sanitized.trim().length === 0) {
    logger.warn("Response became empty after sanitization");
    throw new LLMResponseValidationError(
      "応答の処理後にコンテンツが失われました",
      "INVALID_CONTENT"
    );
  }

  logger.info("LLM response validation successful", {
    originalLength: response.length,
    sanitizedLength: sanitized.length,
    changePercent: Math.round((1 - sanitized.length / response.length) * 100)
  });

  return sanitized;
}