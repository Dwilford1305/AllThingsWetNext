import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Event } from '@/models'
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

    // Generate cache key based on query parameters
    const cacheKey = generateCacheKey('api:events', {
      limit,
      featured: featured || false,
      category: category || 'all'
    })

    // Try to get from cache
    const cached = cache.get<typeof events>(cacheKey)
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

    const events = await Event.find(query)
      .limit(limit)
      .sort({ date: 1 }) // Sort by date ascending (upcoming first)
      .lean()

    // Store in cache
    cache.set(cacheKey, events, QueryCacheSettings.EVENTS.ttl)

    const response: ApiResponse<typeof events> = {
      success: true,
      data: events
    }

    return NextResponse.json(response, {
      headers: getCacheHeaders('API_MEDIUM')
    })
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch events' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const event = new Event(body)
    const savedEvent = await event.save()

    // Invalidate events cache
    cache.clearPattern('^api:events:')

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
