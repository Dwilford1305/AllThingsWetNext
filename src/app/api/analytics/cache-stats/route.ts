import { NextRequest, NextResponse } from 'next/server'
import cache from '@/lib/cache'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'

/**
 * Cache Statistics API Endpoint
 * 
 * Provides real-time statistics about the application's cache performance
 * Requires authentication to prevent unauthorized access
 */

async function getCacheStats(_request: AuthenticatedRequest) {
  try {
    // Get cache statistics
    const stats = cache.getStats()
    
    // Calculate additional metrics
    const hitRate = stats.validEntries / (stats.totalEntries || 1)
    const expirationRate = stats.expiredEntries / (stats.totalEntries || 1)
    
    return NextResponse.json({
      success: true,
      data: {
        cache: {
          ...stats,
          hitRate: Math.round(hitRate * 100) / 100,
          expirationRate: Math.round(expirationRate * 100) / 100,
        },
        performance: {
          memoryUsageMB: Math.round(stats.memoryUsage / 1024 / 1024 * 100) / 100,
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Cache stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cache statistics' 
      },
      { status: 500 }
    )
  }
}

// Protect the endpoint with authentication
export const GET = withAuth(getCacheStats)

// Also allow public access for health monitoring (optional)
export async function POST(_request: NextRequest) {
  try {
    // Cleanup expired cache entries
    const cleaned = cache.cleanup()
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleaned} expired cache entries`,
      data: {
        cleanedEntries: cleaned,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Cache cleanup error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cleanup cache' 
      },
      { status: 500 }
    )
  }
}
