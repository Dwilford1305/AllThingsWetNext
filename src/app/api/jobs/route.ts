import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { JobPosting } from '@/models'
import type { ApiResponse } from '@/types'
import cache, { generateCacheKey } from '@/lib/cache'
import { getCacheHeaders, QueryCacheSettings } from '@/lib/cache-config'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const featured = searchParams.get('featured') === 'true'
    const category = searchParams.get('category')
    const type = searchParams.get('type')

    // Generate cache key
    const cacheKey = generateCacheKey('api:jobs', {
      limit,
      featured: featured || false,
      category: category || 'all',
      type: type || 'all'
    })

    // Try to get from cache
    const cached = cache.get<typeof jobs>(cacheKey)
    if (cached) {
      const response: ApiResponse<typeof cached> = {
        success: true,
        data: cached
      }
      return NextResponse.json(response, {
        headers: getCacheHeaders('API_MEDIUM')
      })
    }

    const query: Record<string, unknown> = {
      expiresAt: { $gte: new Date() } // Only show non-expired jobs
    }
    if (featured) query.featured = true
    if (category) query.category = category
    if (type) query.type = type

    const jobs = await JobPosting.find(query)
      .limit(limit)
      .sort({ featured: -1, createdAt: -1 }) // Featured first, then newest
      .select('-__v') // Exclude version field
      .lean()

    // Store in cache
    cache.set(cacheKey, jobs, QueryCacheSettings.JOBS.ttl)

    const response: ApiResponse<typeof jobs> = {
      success: true,
      data: jobs
    }

    return NextResponse.json(response, {
      headers: getCacheHeaders('API_MEDIUM')
    })
  } catch (error) {
    console.error('Jobs API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch jobs' 
      },
      { status: 500 }
    )
  }
}
