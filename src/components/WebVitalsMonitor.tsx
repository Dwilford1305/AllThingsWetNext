'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

// Core Web Vitals tracking and performance monitoring
export function WebVitalsMonitor() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}:`, metric.value, metric);
    }

    // In production, you would send this to your analytics service
    // Example: sendToAnalytics(metric)
    
    // Store in localStorage for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      const existingMetrics = JSON.parse(localStorage.getItem('webvitals') || '[]');
      existingMetrics.push({
        ...metric,
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
      });
      
      // Keep only last 50 metrics to avoid storage bloat
      if (existingMetrics.length > 50) {
        existingMetrics.splice(0, existingMetrics.length - 50);
      }
      
      localStorage.setItem('webvitals', JSON.stringify(existingMetrics));
    }

    // Check if metrics meet "Good" thresholds and warn if not
    const thresholds = {
      CLS: 0.1,  // Cumulative Layout Shift
      FID: 100,  // First Input Delay (ms)
      LCP: 2500, // Largest Contentful Paint (ms)
      FCP: 1800, // First Contentful Paint (ms)
      TTFB: 800, // Time to First Byte (ms)
      INP: 200,  // Interaction to Next Paint (ms)
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      console.warn(
        `[Performance Warning] ${metric.name} (${metric.value}) exceeds "Good" threshold (${threshold})`
      );
    }
  });

  useEffect(() => {
    // Additional performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor long tasks (performance anti-pattern)
      if ('PerformanceObserver' in window) {
        try {
          const longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) {
                console.warn(`[Performance] Long task detected: ${entry.duration}ms`, entry);
              }
            }
          });
          longTaskObserver.observe({ entryTypes: ['longtask'] });

          // Monitor layout shifts
          const layoutShiftObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // Type assertion for LayoutShift entry
              const layoutShiftEntry = entry as PerformanceEntry & { 
                hadRecentInput?: boolean; 
                value?: number; 
              };
              
              if (layoutShiftEntry.hadRecentInput) return; // Ignore shifts caused by user interaction
              
              console.log(`[Performance] Layout shift: ${layoutShiftEntry.value}`, entry);
            }
          });
          layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

          // Monitor resource loading performance
          const resourceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // Flag slow loading resources
              if (entry.duration > 1000) {
                console.warn(`[Performance] Slow resource: ${entry.name} (${entry.duration}ms)`);
              }
            }
          });
          resourceObserver.observe({ entryTypes: ['resource'] });

          // Cleanup observers
          return () => {
            longTaskObserver.disconnect();
            layoutShiftObserver.disconnect();
            resourceObserver.disconnect();
          };
        } catch (e) {
          console.warn('[Performance] Could not initialize performance observers:', e);
        }
      }

      // Track page visibility changes for accurate metrics
      let pageLoadTime = performance.now();
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          pageLoadTime = performance.now();
        } else {
          const timeOnPage = performance.now() - pageLoadTime;
          console.log(`[Performance] Time on page: ${timeOnPage}ms`);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  return null; // This component doesn't render anything
}

// Utility function to get stored performance metrics (for debugging)
export function getStoredWebVitals() {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('webvitals') || '[]');
  } catch {
    return [];
  }
}

// Utility function to clear stored metrics
export function clearStoredWebVitals() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('webvitals');
}

// Performance summary for debugging
export function getPerformanceSummary() {
  const metrics = getStoredWebVitals();
  if (metrics.length === 0) return null;

  interface MetricSummary {
    values: number[];
    count: number;
    average?: number;
    max?: number;
    min?: number;
  }

  const summary = metrics.reduce((acc: Record<string, MetricSummary>, metric: any) => {
    if (!acc[metric.name]) {
      acc[metric.name] = { values: [], count: 0 };
    }
    acc[metric.name].values.push(metric.value);
    acc[metric.name].count++;
    return acc;
  }, {});

  // Calculate averages and identify issues
  Object.keys(summary).forEach(metricName => {
    const values = summary[metricName].values;
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    summary[metricName] = {
      ...summary[metricName],
      average: avg,
      max,
      min,
    };
  });

  return summary;
}

export default WebVitalsMonitor;