import { NextApiResponse } from "next";
import logger from "./logger";

export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  userMessage: string;
  statusCode: number;
  context?: Record<string, any>;
  suggestions?: string[];
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly context?: Record<string, any>;
  public readonly suggestions?: string[];

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = "AppError";
    this.type = details.type;
    this.statusCode = details.statusCode;
    this.userMessage = details.userMessage;
    this.context = details.context;
    this.suggestions = details.suggestions;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorMessages = {
  [ErrorType.VALIDATION_ERROR]: {
    statusCode: 400,
    userMessage: "入力内容に問題があります。内容を確認してください。",
  },
  [ErrorType.AUTHENTICATION_ERROR]: {
    statusCode: 401,
    userMessage: "認証に失敗しました。再度お試しください。",
  },
  [ErrorType.AUTHORIZATION_ERROR]: {
    statusCode: 403,
    userMessage: "この操作を行う権限がありません。",
  },
  [ErrorType.NOT_FOUND_ERROR]: {
    statusCode: 404,
    userMessage: "お探しのリソースが見つかりませんでした。",
  },
  [ErrorType.RATE_LIMIT_ERROR]: {
    statusCode: 429,
    userMessage: "リクエストが多すぎます。しばらくお待ちください。",
  },
  [ErrorType.EXTERNAL_SERVICE_ERROR]: {
    statusCode: 502,
    userMessage: "外部サービスとの通信に問題が発生しました。",
  },
  [ErrorType.NETWORK_ERROR]: {
    statusCode: 503,
    userMessage: "ネットワークエラーが発生しました。接続を確認してください。",
  },
  [ErrorType.TIMEOUT_ERROR]: {
    statusCode: 408,
    userMessage: "処理がタイムアウトしました。再度お試しください。",
  },
  [ErrorType.CONFIGURATION_ERROR]: {
    statusCode: 500,
    userMessage: "システム設定に問題があります。管理者にお問い合わせください。",
  },
  [ErrorType.INTERNAL_SERVER_ERROR]: {
    statusCode: 500,
    userMessage: "予期しないエラーが発生しました。しばらくお待ちください。",
  },
};

export function createError(
  type: ErrorType,
  message: string,
  context?: Record<string, any>,
  suggestions?: string[]
): AppError {
  const errorConfig = errorMessages[type];
  return new AppError({
    type,
    message,
    userMessage: errorConfig.userMessage,
    statusCode: errorConfig.statusCode,
    context,
    suggestions,
  });
}

export function classifyError(error: any): ErrorType {
  if (!error) return ErrorType.INTERNAL_SERVER_ERROR;

  const errorMessage = error.message?.toLowerCase() || "";
  const errorCode = error.code || error.status;

  // Network and connection errors
  if (
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("enotfound") ||
    errorMessage.includes("etimedout") ||
    errorMessage.includes("network error")
  ) {
    return ErrorType.NETWORK_ERROR;
  }

  // Timeout errors
  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("aborted") ||
    errorCode === "TIMEOUT"
  ) {
    return ErrorType.TIMEOUT_ERROR;
  }

  // Authentication errors
  if (
    errorMessage.includes("authentication") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("401") ||
    errorCode === 401
  ) {
    return ErrorType.AUTHENTICATION_ERROR;
  }

  // Authorization errors
  if (
    errorMessage.includes("forbidden") ||
    errorMessage.includes("403") ||
    errorCode === 403
  ) {
    return ErrorType.AUTHORIZATION_ERROR;
  }

  // Rate limiting
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many requests") ||
    errorMessage.includes("429") ||
    errorCode === 429
  ) {
    return ErrorType.RATE_LIMIT_ERROR;
  }

  // Validation errors
  if (
    errorMessage.includes("validation") ||
    errorMessage.includes("invalid") ||
    errorMessage.includes("required") ||
    errorMessage.includes("400") ||
    errorCode === 400
  ) {
    return ErrorType.VALIDATION_ERROR;
  }

  // Not found errors
  if (
    errorMessage.includes("not found") ||
    errorMessage.includes("404") ||
    errorCode === 404
  ) {
    return ErrorType.NOT_FOUND_ERROR;
  }

  // External service errors
  if (
    errorMessage.includes("service unavailable") ||
    errorMessage.includes("bad gateway") ||
    errorMessage.includes("502") ||
    errorMessage.includes("503") ||
    errorCode === 502 ||
    errorCode === 503
  ) {
    return ErrorType.EXTERNAL_SERVICE_ERROR;
  }

  // Configuration errors
  if (
    errorMessage.includes("environment") ||
    errorMessage.includes("config") ||
    errorMessage.includes("api key") ||
    errorMessage.includes("missing")
  ) {
    return ErrorType.CONFIGURATION_ERROR;
  }

  return ErrorType.INTERNAL_SERVER_ERROR;
}

export function handleApiError(
  error: any,
  res: NextApiResponse,
  context?: Record<string, any>
): void {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else {
    const errorType = classifyError(error);
    const originalMessage = error.message || "Unknown error occurred";
    appError = createError(errorType, originalMessage, context);
  }

  // Log the error with full context
  const logContext = {
    type: appError.type,
    statusCode: appError.statusCode,
    originalMessage: appError.message,
    context: appError.context,
    stack: appError.stack,
    timestamp: new Date().toISOString(),
  };

  if (appError.statusCode >= 500) {
    logger.error("API Error", logContext);
  } else {
    logger.warn("API Warning", logContext);
  }

  // Prepare response
  const response: any = {
    error: appError.userMessage,
    type: appError.type,
    timestamp: new Date().toISOString(),
  };

  // Add suggestions if available
  if (appError.suggestions && appError.suggestions.length > 0) {
    response.suggestions = appError.suggestions;
  }

  // Add additional details in development
  if (process.env.NODE_ENV === "development") {
    response.details = {
      originalMessage: appError.message,
      context: appError.context,
    };
  }

  res.status(appError.statusCode).json(response);
}

export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(
    (field) => !data[field] || (typeof data[field] === "string" && data[field].trim() === "")
  );

  if (missingFields.length > 0) {
    throw createError(
      ErrorType.VALIDATION_ERROR,
      `Missing required fields: ${missingFields.join(", ")}`,
      { missingFields },
      [`必須項目を入力してください: ${missingFields.join(", ")}`]
    );
  }
}

export function validateMethod(
  actualMethod: string | undefined,
  allowedMethods: string[]
): void {
  if (!actualMethod || !allowedMethods.includes(actualMethod)) {
    throw createError(
      ErrorType.VALIDATION_ERROR,
      `Method ${actualMethod} not allowed. Allowed methods: ${allowedMethods.join(", ")}`,
      { actualMethod, allowedMethods },
      [`許可されたメソッド: ${allowedMethods.join(", ")}`]
    );
  }
}

export function validateContentType(
  contentType: string | undefined,
  requiredType: string = "application/json"
): void {
  if (!contentType || !contentType.includes(requiredType)) {
    throw createError(
      ErrorType.VALIDATION_ERROR,
      `Content-Type must be ${requiredType}`,
      { actualContentType: contentType, requiredType },
      [`Content-Type を ${requiredType} に設定してください`]
    );
  }
}

export function createValidationError(
  message: string,
  details?: string[]
): AppError {
  return createError(
    ErrorType.VALIDATION_ERROR,
    message,
    { validationErrors: details },
    details?.map(detail => `検証エラー: ${detail}`)
  );
}

export function createAuthenticationError(
  message: string,
  suggestions?: string[]
): AppError {
  return createError(
    ErrorType.AUTHENTICATION_ERROR,
    message,
    undefined,
    suggestions || [
      "APIキーが正しく設定されているか確認してください",
      "環境変数の設定を確認してください"
    ]
  );
}

export function createTimeoutError(message: string): AppError {
  return createError(
    ErrorType.TIMEOUT_ERROR,
    message,
    undefined,
    ["しばらく待ってから再度お試しください", "ネットワーク接続を確認してください"]
  );
}

export function createRateLimitError(retryAfter?: number): AppError {
  return createError(
    ErrorType.RATE_LIMIT_ERROR,
    "Rate limit exceeded",
    { retryAfter },
    retryAfter
      ? [`${retryAfter}秒後に再度お試しください`]
      : ["しばらく待ってから再度お試しください"]
  );
}