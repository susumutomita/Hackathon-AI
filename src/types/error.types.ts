export interface ErrorContext {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ErrorResponseData {
  error: string;
  type: string;
  timestamp: string;
  suggestions?: string[];
  details?: {
    originalMessage: string;
    context?: ErrorContext;
  };
}

export interface UnknownError {
  message?: string;
  code?: string | number;
  status?: number;
  stack?: string;
}
