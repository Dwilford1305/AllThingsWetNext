import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const letter = searchParams.get('letter') || ''
    const sort = searchParams.get('sort') || 'name'
    
    const skip = (page - 1) * limit

    // Build query
    const query: Record<string, unknown> = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (letter && letter !== 'all') {
      query.name = { $regex: `^${letter}`, $options: 'i' }
    }

    // Build sort
    let sortObj: { [key: string]: 1 | -1 } = {}
    switch (sort) {
      case 'featured':
        sortObj = { 'subscription.tier': -1, featured: -1, name: 1 }
        break
      case 'rating':
        sortObj = { 'analytics.averageRating': -1, name: 1 }
        break
      case 'newest':
        sortObj = { createdAt: -1 }
        break
      default:
        sortObj = { name: 1 }
    }

    const [businesses, totalCount] = await Promise.all([
      Business.find(query)
        .collation({ locale: 'en', strength: 2 }) // Case-insensitive sorting
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Business.countDocuments(query)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // Performance optimization: Cache business listings
    // Different cache times based on query parameters for optimization
    let cacheMaxAge = 300 // 5 minutes default
    
    // Static lists (no search/filters) can be cached longer
    if (!search && (!category || category === 'all') && (!letter || letter === 'all')) {
      cacheMaxAge = 900 // 15 minutes for static lists
    }
    
    // Search results cached shorter due to dynamic nature
    if (search) {
      cacheMaxAge = 60 // 1 minute for search results
    }

    const cacheHeaders = {
      'Cache-Control': `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 2}`,
      'CDN-Cache-Control': `public, s-maxage=${cacheMaxAge}`,
      'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheMaxAge}`,
      'ETag': `businesses-${search}-${category}-${letter}-${sort}-${page}-${Date.now()}`,
      'Vary': 'Accept-Encoding'
    }

    return NextResponse.json({
      success: true,
      data: {
        businesses,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        summary: {
          total: totalCount
        }
      }
    }, { headers: cacheHeaders })
  } catch (error) {
    console.error('Businesses API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch businesses' 
      },
      { status: 500, headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    )
  }
}
