import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Event } from '@/models'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const featured = searchParams.get('featured') === 'true'
    const category = searchParams.get('category')

    const query: Record<string, unknown> = {}
    if (featured) query.featured = true
    if (category) query.category = category

    const events = await Event.find(query)
      .limit(limit)
      .sort({ date: 1 }) // Sort by date ascending (upcoming first)
      .lean()

    const response: ApiResponse<typeof events> = {
      success: true,
      data: events
    }

    return NextResponse.json(response)
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
