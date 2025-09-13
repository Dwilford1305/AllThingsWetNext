import { NextRequest, NextResponse } from 'next/server'
import { performanceTracker } from '@/lib/performance'
import { cache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const minutesBack = parseInt(searchParams.get('minutes') || '30')
    const format = searchParams.get('format') || 'summary'

    // Get performance summary
    const summary = performanceTracker.getPerformanceSummary(minutesBack)

    // Add system performance metrics
    const systemMetrics = {
      nodejs: {
        version: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
      timestamp: new Date().toISOString(),
    }

    if (format === 'detailed') {
      // Return detailed metrics for debugging
      const detailed = {
        ...summary,
        system: systemMetrics,
        raw: performanceTracker.exportMetrics(),
      }
      
      return NextResponse.json({
        success: true,
        data: detailed
      })
    }

    // Return summary by default
    const response = {
      success: true,
      data: {
        ...summary,
        system: systemMetrics,
        recommendations: generatePerformanceRecommendations(summary),
      }
    }

    // Cache performance data for 1 minute
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      'Content-Type': 'application/json',
    }

    return NextResponse.json(response, { headers: cacheHeaders })
  } catch (error) {
    console.error('Performance API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch performance metrics' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, metric } = body

    switch (type) {
      case 'web-vital':
        performanceTracker.trackWebVital(metric)
        break
      case 'api-call':
        performanceTracker.trackApiCall(metric)
        break
      case 'database-query':
        performanceTracker.trackDatabaseQuery(metric)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid metric type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Metric recorded successfully' 
    })
  } catch (error) {
    console.error('Performance tracking error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to record performance metric' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Clear performance metrics
    performanceTracker.clearMetrics()
    
    // Clear cache
    cache.clear()

    return NextResponse.json({ 
      success: true, 
      message: 'Performance data cleared successfully' 
    })
  } catch (error) {
    console.error('Performance clear error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear performance data' 
      },
      { status: 500 }
    )
  }
}

/**
 * Generate performance recommendations based on metrics
 */
function generatePerformanceRecommendations(summary: any): string[] {
  const recommendations: string[] = []

  // Check Web Vitals
  if (summary.webVitals) {
    Object.keys(summary.webVitals).forEach(metric => {
      const data = summary.webVitals[metric]
      
      switch (metric) {
        case 'LCP':
          if (data.p95 > 2500) {
            recommendations.push('Largest Contentful Paint (LCP) is slow. Consider optimizing images, improving server response times, or implementing better caching.')
          }
          break
        case 'FID':
          if (data.p95 > 100) {
            recommendations.push('First Input Delay (FID) is high. Consider reducing JavaScript execution time and breaking up long tasks.')
          }
          break
        case 'CLS':
          if (data.p95 > 0.1) {
            recommendations.push('Cumulative Layout Shift (CLS) is high. Ensure images and ads have defined dimensions and avoid inserting content above existing content.')
          }
          break
        case 'TTFB':
          if (data.p95 > 800) {
            recommendations.push('Time to First Byte (TTFB) is slow. Consider optimizing server response times, using a CDN, or improving database query performance.')
          }
          break
      }
    })
  }

  // Check API performance
  if (summary.apiCalls) {
    const slowEndpoints = Object.keys(summary.apiCalls).filter(endpoint => {
      const stats = summary.apiCalls[endpoint]
      return stats.p95Duration > 1000
    })
    
    if (slowEndpoints.length > 0) {
      recommendations.push(`Slow API endpoints detected: ${slowEndpoints.join(', ')}. Consider optimizing queries, adding caching, or implementing pagination.`)
    }

    // Check cache hit rates
    const lowCacheHitRate = Object.keys(summary.apiCalls).filter(endpoint => {
      const stats = summary.apiCalls[endpoint]
      return stats.cacheHitRate < 0.3 && stats.calls > 10
    })
    
    if (lowCacheHitRate.length > 0) {
      recommendations.push(`Low cache hit rates for: ${lowCacheHitRate.join(', ')}. Consider adjusting cache TTL or cache invalidation strategy.`)
    }
  }

  // Check database performance
  if (summary.databaseQueries) {
    const slowCollections = Object.keys(summary.databaseQueries).filter(collection => {
      const stats = summary.databaseQueries[collection]
      return stats.p95Duration > 500
    })
    
    if (slowCollections.length > 0) {
      recommendations.push(`Slow database queries for collections: ${slowCollections.join(', ')}. Consider adding indexes, optimizing queries, or using aggregation pipelines.`)
    }
  }

  // Check cache efficiency
  if (summary.cacheStats && summary.cacheStats.size > 800) {
    recommendations.push('Cache size is getting large. Consider implementing cache eviction policies or increasing cache cleanup frequency.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance looks good! All metrics are within acceptable ranges.')
  }

  return recommendations
}