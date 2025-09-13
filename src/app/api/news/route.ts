import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { NewsArticle } from '@/models'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100') // Increased default limit
    const featured = searchParams.get('featured') === 'true'
    const category = searchParams.get('category')

    const query: Record<string, unknown> = {}
    if (featured) query.featured = true
    if (category) query.category = category

    const news = await NewsArticle.find(query)
      .limit(limit)
      .sort({ publishedAt: -1 }) // Sort by publish date descending (newest first)
      .lean()

    const response: ApiResponse<typeof news> = {
      success: true,
      data: news
    }

    // Performance optimization: Cache news for 10 minutes (600 seconds)  
    // News changes more frequently than events but less than real-time data
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      'CDN-Cache-Control': 'public, s-maxage=600',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
      'ETag': `news-${featured ? 'featured' : 'all'}-${category || 'all'}-${Date.now()}`,
      'Vary': 'Accept-Encoding'
    }

    return NextResponse.json(response, { headers: cacheHeaders })
  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch news' 
      },
      { status: 500, headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
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
