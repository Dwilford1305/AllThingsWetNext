import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'
import cache, { generateCacheKey } from '@/lib/cache'
import { getCacheHeaders, QueryCacheSettings } from '@/lib/cache-config'

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

    // Generate cache key
    const cacheKey = generateCacheKey('api:businesses', {
      page,
      limit,
      search: search || 'none',
      category: category || 'all',
      letter: letter || 'all',
      sort
    })

    // Try to get from cache (only cache if no search - search results change frequently)
    if (!search) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json(cached, {
          headers: getCacheHeaders('API_LONG')
        })
      }
    }

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

    // Build sort - optimized to use indexes
    let sortObj: { [key: string]: 1 | -1 } = {}
    switch (sort) {
      case 'featured':
        sortObj = { subscriptionTier: -1, featured: -1, name: 1 }
        break
      case 'rating':
        sortObj = { rating: -1, name: 1 }
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
        .select('-__v') // Exclude version field
        .lean(),
      Business.countDocuments(query)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    const response = {
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
    }

    // Cache the result (only if no search)
    if (!search) {
      cache.set(cacheKey, response, QueryCacheSettings.BUSINESSES.ttl)
    }

    return NextResponse.json(response, {
      headers: getCacheHeaders(search ? 'API_SHORT' : 'API_LONG')
    })
  } catch (error) {
    console.error('Businesses API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch businesses' 
      },
      { status: 500 }
    )
  }
}
