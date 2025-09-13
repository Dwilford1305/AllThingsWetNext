import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Event } from '@/models'
import { cache, withCache, generateCacheKey, CACHE_TTL } from '@/lib/cache'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100') // Increased default limit
    const featured = searchParams.get('featured') === 'true'
    const category = searchParams.get('category')

    // Generate cache key based on query parameters
    const cacheKey = generateCacheKey('events', limit, featured, category || 'all')

    // Use cache with database query as fallback
    const events = await withCache(
      cacheKey,
      async () => {
        await connectDB()

        const query: Record<string, unknown> = {}
        if (featured) query.featured = true
        if (category) query.category = category

        return await Event.find(query)
          .limit(limit)
          .sort({ date: 1 }) // Sort by date ascending (upcoming first)
          .lean()
      },
      CACHE_TTL.EVENTS
    )

    const response: ApiResponse<typeof events> = {
      success: true,
      data: events
    }

    // Performance optimization: Cache events for 5 minutes (300 seconds)
    // Events don't change frequently, so this improves performance significantly
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'CDN-Cache-Control': 'public, s-maxage=300',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
      'ETag': `events-${Date.now()}`,
      'Vary': 'Accept-Encoding'
    }

    return NextResponse.json(response, { headers: cacheHeaders })
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch events' 
      },
      { status: 500, headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const event = new Event(body)
    const savedEvent = await event.save()

    // Invalidate events cache when new event is created
    cache.clear() // Simple cache invalidation - clear all cache
    // In production, could be more selective: cache.delete('events:*')

    const response: ApiResponse<typeof savedEvent> = {
      success: true,
      data: savedEvent,
      message: 'Event created successfully'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create event' 
      },
      { status: 500 }
    )
  }
}
