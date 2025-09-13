/**
 * Performance testing utilities for AllThingsWetNext
 * Provides tools to measure and analyze application performance
 */

import { cache } from './cache';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent?: string;
  connection?: string;
}

interface ApiPerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  timestamp?: number; // Made optional since trackApiCall adds it
  status: number;
  cached: boolean;
}

interface DatabasePerformanceMetric {
  query: string;
  collection: string;
  duration: number;
  timestamp?: number; // Made optional since trackDatabaseQuery adds it
  resultsCount?: number;
}

class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: ApiPerformanceMetric[] = [];
  private dbMetrics: DatabasePerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Track Core Web Vitals metric
   */
  trackWebVital(metric: PerformanceMetric): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      connection: this.getConnectionType(),
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log performance issues
    this.checkPerformanceThresholds(metric);
  }

  /**
   * Track API endpoint performance
   */
  trackApiCall(metric: ApiPerformanceMetric): void {
    this.apiMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now(),
    });

    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics);
    }

    // Log slow API calls
    if (metric.duration > 1000) {
      console.warn(`[Performance] Slow API call: ${metric.method} ${metric.endpoint} (${metric.duration}ms)`);
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(metric: DatabasePerformanceMetric): void {
    this.dbMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now(),
    });

    if (this.dbMetrics.length > this.maxMetrics) {
      this.dbMetrics = this.dbMetrics.slice(-this.maxMetrics);
    }

    // Log slow database queries
    if (metric.duration > 500) {
      console.warn(`[Performance] Slow DB query: ${metric.collection} (${metric.duration}ms)`);
    }
  }

  /**
   * Get performance summary for the last N minutes
   */
  getPerformanceSummary(minutesBack = 30) {
    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    const recentApiMetrics = this.apiMetrics.filter(m => (m.timestamp || 0) > cutoff);
    const recentDbMetrics = this.dbMetrics.filter(m => (m.timestamp || 0) > cutoff);

    return {
      webVitals: this.summarizeWebVitals(recentMetrics),
      apiCalls: this.summarizeApiCalls(recentApiMetrics),
      databaseQueries: this.summarizeDatabaseQueries(recentDbMetrics),
      cacheStats: cache.getStats(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if performance metrics meet acceptable thresholds
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds = {
      LCP: 2500,  // Largest Contentful Paint (Good < 2.5s)
      FID: 100,   // First Input Delay (Good < 100ms)
      CLS: 0.1,   // Cumulative Layout Shift (Good < 0.1)
      FCP: 1800,  // First Contentful Paint (Good < 1.8s)
      TTFB: 800,  // Time to First Byte (Good < 800ms)
      INP: 200,   // Interaction to Next Paint (Good < 200ms)
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      console.warn(
        `[Performance Alert] ${metric.name}: ${metric.value} exceeds threshold ${threshold}`
      );
    }
  }

  /**
   * Get connection type for performance context
   */
  private getConnectionType(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    // @ts-ignore - navigator.connection is not in standard types
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return connection.effectiveType || connection.type || 'unknown';
    }
    
    return 'unknown';
  }

  /**
   * Summarize Web Vitals metrics
   */
  private summarizeWebVitals(metrics: PerformanceMetric[]) {
    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    const summary: Record<string, any> = {};
    
    Object.keys(grouped).forEach(name => {
      const values = grouped[name];
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
      const p95 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)];
      
      summary[name] = {
        count: values.length,
        average: avg,
        median,
        p95,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    return summary;
  }

  /**
   * Summarize API call performance
   */
  private summarizeApiCalls(metrics: ApiPerformanceMetric[]) {
    const endpointStats = metrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = {
          calls: 0,
          totalDuration: 0,
          cached: 0,
          errors: 0,
          durations: [],
        };
      }
      
      acc[key].calls++;
      acc[key].totalDuration += metric.duration;
      acc[key].durations.push(metric.duration);
      if (metric.cached) acc[key].cached++;
      if (metric.status >= 400) acc[key].errors++;
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages and percentiles
    Object.keys(endpointStats).forEach(endpoint => {
      const stats = endpointStats[endpoint];
      const durations = stats.durations.sort((a: number, b: number) => a - b);
      
      stats.averageDuration = stats.totalDuration / stats.calls;
      stats.medianDuration = durations[Math.floor(durations.length / 2)];
      stats.p95Duration = durations[Math.floor(durations.length * 0.95)];
      stats.cacheHitRate = stats.cached / stats.calls;
      stats.errorRate = stats.errors / stats.calls;
      
      delete stats.durations; // Remove raw data
    });

    return endpointStats;
  }

  /**
   * Summarize database query performance
   */
  private summarizeDatabaseQueries(metrics: DatabasePerformanceMetric[]) {
    const collectionStats = metrics.reduce((acc, metric) => {
      if (!acc[metric.collection]) {
        acc[metric.collection] = {
          queries: 0,
          totalDuration: 0,
          durations: [],
          totalResults: 0,
        };
      }
      
      acc[metric.collection].queries++;
      acc[metric.collection].totalDuration += metric.duration;
      acc[metric.collection].durations.push(metric.duration);
      if (metric.resultsCount) {
        acc[metric.collection].totalResults += metric.resultsCount;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate statistics
    Object.keys(collectionStats).forEach(collection => {
      const stats = collectionStats[collection];
      const durations = stats.durations.sort((a: number, b: number) => a - b);
      
      stats.averageDuration = stats.totalDuration / stats.queries;
      stats.medianDuration = durations[Math.floor(durations.length / 2)];
      stats.p95Duration = durations[Math.floor(durations.length * 0.95)];
      stats.averageResults = stats.totalResults / stats.queries;
      
      delete stats.durations; // Remove raw data
    });

    return collectionStats;
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.apiMetrics = [];
    this.dbMetrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      webVitals: this.metrics,
      apiCalls: this.apiMetrics,
      databaseQueries: this.dbMetrics,
      exportedAt: new Date().toISOString(),
    };
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();

/**
 * Performance measurement decorator for async functions
 */
export function measurePerformance<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  category: string = 'function'
): T {
  return (async (...args: any[]) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      
      console.log(`[Performance] ${category}: ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.warn(`[Performance] ${category} (error): ${duration.toFixed(2)}ms`);
      throw error;
    }
  }) as T;
}

/**
 * API call wrapper with performance tracking
 */
export async function measureApiCall<T>(
  endpoint: string,
  method: string,
  apiCall: () => Promise<T>,
  options: { skipCache?: boolean } = {}
): Promise<T> {
  const start = performance.now();
  let cached = false;
  let status = 200;
  
  try {
    // Check cache first (unless skipCache is true)
    if (!options.skipCache) {
      const cacheKey = `api:${method}:${endpoint}`;
      const cachedResult = cache.get<T>(cacheKey);
      if (cachedResult !== null) {
        cached = true;
        const duration = performance.now() - start;
        
        performanceTracker.trackApiCall({
          endpoint,
          method,
          duration,
          status: 200,
          cached: true,
        });
        
        return cachedResult;
      }
    }
    
    const result = await apiCall();
    const duration = performance.now() - start;
    
    performanceTracker.trackApiCall({
      endpoint,
      method,
      duration,
      status,
      cached,
    });
    
    return result;
  } catch (error: any) {
    const duration = performance.now() - start;
    status = error.status || 500;
    
    performanceTracker.trackApiCall({
      endpoint,
      method,
      duration,
      status,
      cached,
    });
    
    throw error;
  }
}

/**
 * Database query wrapper with performance tracking
 */
export async function measureDatabaseQuery<T>(
  collection: string,
  query: string,
  dbCall: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await dbCall();
    const duration = performance.now() - start;
    
    // Try to get result count if it's an array
    let resultsCount: number | undefined;
    if (Array.isArray(result)) {
      resultsCount = result.length;
    }
    
    performanceTracker.trackDatabaseQuery({
      query,
      collection,
      duration,
      resultsCount,
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    performanceTracker.trackDatabaseQuery({
      query: `${query} (error)`,
      collection,
      duration,
    });
    
    throw error;
  }
}

export default performanceTracker;