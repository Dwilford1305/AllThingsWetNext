import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Discussion } from '@/models'
import type { ApiResponse } from '@/types'

interface RouteParams {
  params: { id: string }
}

// GET /api/discussions/[id] - Get single discussion by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const discussion = await Discussion.findOne({ id: params.id }).lean()

    if (!discussion) {
      return NextResponse.json(
        { success: false, error: 'Discussion not found' },
        { status: 404 }
      )
    }

    const response: ApiResponse<typeof discussion> = {
      success: true,
      data: discussion
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get discussion error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch discussion' 
      },
      { status: 500 }
    )
  }
}