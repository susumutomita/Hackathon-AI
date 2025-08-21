import logger from "./logger";

export type JsonParseErrorType = 
  | "EMPTY_INPUT"
  | "SYNTAX_ERROR" 
  | "TOO_LARGE"
  | "TOO_DEEP"
  | "SECURITY_VIOLATION";

export class SafeJsonParseError extends Error {
  constructor(
    message: string,
    public readonly parseErrorType: JsonParseErrorType
  ) {
    super(message);
    this.name = "SafeJsonParseError";
  }
}

interface SafeJsonParseOptions {
  maxSize?: number;        // Maximum JSON string size in bytes
  maxDepth?: number;       // Maximum nesting depth
  allowPrototypePollution?: boolean; // Allow dangerous keys
}

const DEFAULT_OPTIONS: Required<SafeJsonParseOptions> = {
  maxSize: 1024 * 1024,    // 1MB
  maxDepth: 100,           // 100 levels deep
  allowPrototypePollution: false,
};

// 危険なキー名（プロトタイプ汚染攻撃対策）
const DANGEROUS_KEYS = new Set([
  "__proto__",
  "constructor", 
  "prototype",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toString",
  "valueOf",
]);

/**
 * オブジェクトの深度を計算する
 */
function calculateDepth(obj: any, currentDepth = 0): number {
  if (currentDepth > 1000) return currentDepth; // 循環参照対策
  
  if (obj === null || typeof obj !== "object") {
    return currentDepth;
  }
  
  let maxDepth = currentDepth;
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const depth = calculateDepth(item, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  } else {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const depth = calculateDepth(obj[key], currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    }
  }
  
  return maxDepth;
}

/**
 * オブジェクトから危険なキーを再帰的に除去する
 */
function sanitizeObject(obj: any, allowPrototypePollution: boolean): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, allowPrototypePollution));
  }
  
  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // 危険なキーをチェック
      if (!allowPrototypePollution && DANGEROUS_KEYS.has(key)) {
        logger.warn("Dangerous key removed from JSON object", { key });
        continue;
      }
      
      sanitized[key] = sanitizeObject(obj[key], allowPrototypePollution);
    }
  }
  
  return sanitized;
}

/**
 * 安全なJSONパース関数
 * @param jsonString パースするJSON文字列
 * @param options パースオプション
 * @returns パース済みオブジェクト
 * @throws SafeJsonParseError パースに失敗した場合
 */
export function safeJsonParse(
  jsonString: string, 
  options: SafeJsonParseOptions = {}
): any {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // 1. 基本的な入力検証
  if (!jsonString || typeof jsonString !== "string") {
    throw new SafeJsonParseError(
      "JSONパース対象が空または無効です",
      "EMPTY_INPUT"
    );
  }
  
  const trimmed = jsonString.trim();
  if (trimmed.length === 0) {
    throw new SafeJsonParseError(
      "JSONパース対象が空です",
      "EMPTY_INPUT"
    );
  }
  
  // 2. サイズ制限チェック
  const sizeInBytes = Buffer.byteLength(trimmed, 'utf8');
  if (sizeInBytes > opts.maxSize) {
    logger.warn("JSON size exceeds limit", { 
      size: sizeInBytes, 
      limit: opts.maxSize 
    });
    throw new SafeJsonParseError(
      `JSONサイズが制限を超えています (${sizeInBytes} > ${opts.maxSize} bytes)`,
      "TOO_LARGE"
    );
  }
  
  // 3. JSONパース実行
  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    logger.warn("JSON parse failed", { 
      error: error instanceof Error ? error.message : "unknown",
      jsonLength: trimmed.length
    });
    throw new SafeJsonParseError(
      `JSON構文エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      "SYNTAX_ERROR"
    );
  }
  
  // 4. 深度チェック
  const depth = calculateDepth(parsed);
  if (depth > opts.maxDepth) {
    logger.warn("JSON depth exceeds limit", { 
      depth, 
      limit: opts.maxDepth 
    });
    throw new SafeJsonParseError(
      `JSONの入れ子が深すぎます (${depth} > ${opts.maxDepth})`,
      "TOO_DEEP"
    );
  }
  
  // 5. セキュリティサニタイゼーション
  const sanitized = sanitizeObject(parsed, opts.allowPrototypePollution);
  
  logger.info("JSON parsed successfully", {
    originalSize: sizeInBytes,
    depth,
    type: Array.isArray(sanitized) ? "array" : typeof sanitized
  });
  
  return sanitized;
}

/**
 * フォールバック付きJSONパース
 * パースに失敗した場合はデフォルト値を返す
 */
export function safeJsonParseWithFallback<T>(
  jsonString: string,
  fallback: T,
  options?: SafeJsonParseOptions
): T {
  try {
    return safeJsonParse(jsonString, options) as T;
  } catch (error) {
    logger.info("JSON parse failed, using fallback", {
      error: error instanceof Error ? error.message : "unknown",
      fallbackType: typeof fallback
    });
    return fallback;
  }
}