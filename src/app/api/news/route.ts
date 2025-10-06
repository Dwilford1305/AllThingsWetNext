import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { NewsArticle } from '@/models'
import type { ApiResponse } from '@/types'
import cache, { generateCacheKey } from '@/lib/cache'
import { getCacheHeaders, QueryCacheSettings } from '@/lib/cache-config'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100') // Increased default limit
    const featured = searchParams.get('featured') === 'true'
    const category = searchParams.get('category')

    // Generate cache key
    const cacheKey = generateCacheKey('api:news', {
      limit,
      featured: featured || false,
      category: category || 'all'
    })

    // Try to get from cache
    const cached = cache.get<typeof news>(cacheKey)
    if (cached) {
      const response: ApiResponse<typeof cached> = {
        success: true,
        data: cached
      }
      return NextResponse.json(response, {
        headers: getCacheHeaders('API_MEDIUM')
      })
    }

    const query: Record<string, unknown> = {}
    if (featured) query.featured = true
    if (category) query.category = category

    const news = await NewsArticle.find(query)
      .limit(limit)
      .sort({ publishedAt: -1 }) // Sort by publish date descending (newest first)
      .select('-__v') // Exclude version field
      .lean()

    // Store in cache
    cache.set(cacheKey, news, QueryCacheSettings.NEWS.ttl)

    const response: ApiResponse<typeof news> = {
      success: true,
      data: news
    }

    return NextResponse.json(response, {
      headers: getCacheHeaders('API_MEDIUM')
    })
  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch news' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const clearSeeded = searchParams.get('clearSeeded') === 'true'
    const clearAll = searchParams.get('clearAll') === 'true'

    if (clearAll) {
      // Delete all articles
      const result = await NewsArticle.deleteMany({})
      
      // Invalidate cache
      cache.clearPattern('^api:news:')
      
      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} articles`
      })
    }

    if (clearSeeded) {
      // Delete seeded data articles (those with simple IDs like n1, n2, etc.)
      const seededSources = [
        'City of Wetaskiwin',
        'Wetaskiwin Chamber of Commerce',
        'Wetaskiwin Regional Public Schools'
      ]
      
      const result = await NewsArticle.deleteMany({
        $or: [
          { sourceName: { $in: seededSources } },
          { id: { $in: ['n1', 'n2', 'n3', 'n4'] } }
        ]
      })

      // Invalidate cache
      cache.clearPattern('^api:news:')

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} seeded articles`
      })
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid operation' 
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('News DELETE API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete news' 
      },
      { status: 500 }
    )
  }
}
