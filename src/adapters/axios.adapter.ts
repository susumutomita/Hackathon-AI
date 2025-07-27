import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import {
  HttpClient,
  HttpRequestConfig,
  HttpResponse,
  HttpError,
} from "@/interfaces/http.interface";

/**
 * Axios adapter configuration
 */
export interface AxiosAdapterConfig {
  /**
   * Base URL for all requests
   */
  baseURL?: string;

  /**
   * Default timeout in milliseconds
   */
  timeout?: number;

  /**
   * Default headers
   */
  headers?: Record<string, string>;
}

/**
 * Adapter for axios HTTP client
 */
export class AxiosAdapter implements HttpClient {
  private readonly client: AxiosInstance;

  constructor(config?: AxiosAdapterConfig) {
    this.client = axios.create({
      baseURL: config?.baseURL,
      timeout: config?.timeout,
      headers: config?.headers,
    });
  }

  async get<T = any>(
    url: string,
    config?: HttpRequestConfig,
  ): Promise<HttpResponse<T>> {
    try {
      const response = await this.client.get<T>(url, this.mapConfig(config));
      return this.mapResponse(response);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: HttpRequestConfig,
  ): Promise<HttpResponse<T>> {
    try {
      const response = await this.client.post<T>(
        url,
        data,
        this.mapConfig(config),
      );
      return this.mapResponse(response);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: HttpRequestConfig,
  ): Promise<HttpResponse<T>> {
    try {
      const response = await this.client.put<T>(
        url,
        data,
        this.mapConfig(config),
      );
      return this.mapResponse(response);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async delete<T = any>(
    url: string,
    config?: HttpRequestConfig,
  ): Promise<HttpResponse<T>> {
    try {
      const response = await this.client.delete<T>(url, this.mapConfig(config));
      return this.mapResponse(response);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Maps HttpRequestConfig to AxiosRequestConfig
   */
  private mapConfig(config?: HttpRequestConfig): AxiosRequestConfig {
    if (!config) {
      return {};
    }

    return {
      headers: config.headers,
      timeout: config.timeout,
      params: config.params,
      responseType: config.responseType as any,
      ...config, // Include any additional config
    };
  }

  /**
   * Maps axios response to HttpResponse
   */
  private mapResponse<T>(response: any): HttpResponse<T> {
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  }

  /**
   * Maps axios error to HttpError
   */
  private mapError(error: unknown): HttpError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      return new HttpError(
        axiosError.message,
        axiosError.response?.status,
        axiosError.response?.statusText,
        axiosError.response?.data,
        error,
      );
    }

    if (error instanceof Error) {
      return new HttpError(
        error.message,
        undefined,
        undefined,
        undefined,
        error,
      );
    }

    return new HttpError("Unknown HTTP error");
  }
}
