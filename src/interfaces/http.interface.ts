/**
 * Interface for HTTP clients
 * Defines the contract for making HTTP requests
 */
export interface HttpClient {
  /**
   * Makes a GET request
   * @param url The URL to request
   * @param config Optional request configuration
   * @returns A promise that resolves to the response
   * @throws HttpError if the request fails
   */
  get<T = any>(
    url: string,
    config?: HttpRequestConfig,
  ): Promise<HttpResponse<T>>;

  /**
   * Makes a POST request
   * @param url The URL to request
   * @param data The data to send in the request body
   * @param config Optional request configuration
   * @returns A promise that resolves to the response
   * @throws HttpError if the request fails
   */
  post<T = any>(
    url: string,
    data?: any,
    config?: HttpRequestConfig,
  ): Promise<HttpResponse<T>>;

  /**
   * Makes a PUT request
   * @param url The URL to request
   * @param data The data to send in the request body
   * @param config Optional request configuration
   * @returns A promise that resolves to the response
   * @throws HttpError if the request fails
   */
  put?<T = any>(
    url: string,
    data?: any,
    config?: HttpRequestConfig,
  ): Promise<HttpResponse<T>>;

  /**
   * Makes a DELETE request
   * @param url The URL to request
   * @param config Optional request configuration
   * @returns A promise that resolves to the response
   * @throws HttpError if the request fails
   */
  delete?<T = any>(
    url: string,
    config?: HttpRequestConfig,
  ): Promise<HttpResponse<T>>;
}

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  /**
   * Request headers
   */
  headers?: Record<string, string>;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Query parameters
   */
  params?: Record<string, any>;

  /**
   * Request body type
   */
  contentType?: "json" | "form" | "text";

  /**
   * Response type
   */
  responseType?: "json" | "text" | "blob" | "stream";

  /**
   * Additional configuration options
   */
  [key: string]: any;
}

/**
 * HTTP response
 */
export interface HttpResponse<T = any> {
  /**
   * Response data
   */
  data: T;

  /**
   * HTTP status code
   */
  status: number;

  /**
   * HTTP status text
   */
  statusText: string;

  /**
   * Response headers
   */
  headers: Record<string, string>;
}

/**
 * Error that can be thrown by HTTP operations
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly statusText?: string,
    public readonly response?: any,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "HttpError";
  }

  /**
   * Checks if the error is a specific HTTP status code
   */
  hasStatus(status: number): boolean {
    return this.status === status;
  }

  /**
   * Checks if the error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }

  /**
   * Checks if the error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status !== undefined && this.status >= 500 && this.status < 600;
  }
}
