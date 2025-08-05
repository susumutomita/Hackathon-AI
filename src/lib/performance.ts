import logger from "./logger";

export interface PerformanceMetrics {
  apiResponseTime: number;
  vectorSearchTime: number;
  embeddingTime: number;
  totalRequestTime: number;
  cacheHitRate: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public recordMetrics(metrics: Partial<PerformanceMetrics>) {
    const fullMetrics: PerformanceMetrics = {
      apiResponseTime: 0,
      vectorSearchTime: 0,
      embeddingTime: 0,
      totalRequestTime: 0,
      cacheHitRate: 0,
      ...metrics,
    };

    this.metrics.push(fullMetrics);

    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (fullMetrics.totalRequestTime > 5000) {
      logger.warn("Slow request detected", fullMetrics);
    }

    // Log performance metrics periodically
    if (this.metrics.length % 10 === 0) {
      this.logAverageMetrics();
    }
  }

  public getAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        apiResponseTime: 0,
        vectorSearchTime: 0,
        embeddingTime: 0,
        totalRequestTime: 0,
        cacheHitRate: 0,
      };
    }

    const sums = this.metrics.reduce(
      (acc, metric) => ({
        apiResponseTime: acc.apiResponseTime + metric.apiResponseTime,
        vectorSearchTime: acc.vectorSearchTime + metric.vectorSearchTime,
        embeddingTime: acc.embeddingTime + metric.embeddingTime,
        totalRequestTime: acc.totalRequestTime + metric.totalRequestTime,
        cacheHitRate: acc.cacheHitRate + metric.cacheHitRate,
      }),
      {
        apiResponseTime: 0,
        vectorSearchTime: 0,
        embeddingTime: 0,
        totalRequestTime: 0,
        cacheHitRate: 0,
      },
    );

    const count = this.metrics.length;
    return {
      apiResponseTime: sums.apiResponseTime / count,
      vectorSearchTime: sums.vectorSearchTime / count,
      embeddingTime: sums.embeddingTime / count,
      totalRequestTime: sums.totalRequestTime / count,
      cacheHitRate: sums.cacheHitRate / count,
    };
  }

  public getRecentMetrics(limit: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  private logAverageMetrics() {
    const avg = this.getAverageMetrics();
    logger.info("Performance metrics (average)", {
      samples: this.metrics.length,
      ...avg,
    });
  }

  public clearMetrics() {
    this.metrics = [];
    logger.info("Performance metrics cleared");
  }
}

// Utility function for timing operations
export function timeOperation<T>(
  name: string,
  operation: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      logger.performanceLog(`Operation ${name} completed`, duration);
      resolve({ result, duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.performanceLog(`Operation ${name} failed`, duration, { error });
      reject(error);
    }
  });
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  const recordMetrics = (metrics: Partial<PerformanceMetrics>) => {
    monitor.recordMetrics(metrics);
  };

  const getAverageMetrics = () => monitor.getAverageMetrics();

  const getRecentMetrics = (limit?: number) => monitor.getRecentMetrics(limit);

  return {
    recordMetrics,
    getAverageMetrics,
    getRecentMetrics,
  };
}
