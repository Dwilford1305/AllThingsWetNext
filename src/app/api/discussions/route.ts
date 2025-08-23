import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Discussion } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import type { ApiResponse } from '@/types'
import { randomUUID } from 'crypto'

// GET /api/discussions - Get all discussions
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const discussions = await Discussion.find({})
      .limit(limit)
      .sort({ createdAt: -1 }) // Sort by creation date descending (newest first)
      .lean()

    const response: ApiResponse<typeof discussions> = {
      success: true,
      data: discussions
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Discussions API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch discussions' 
      },
      { status: 500 }
    )
  }
}

// POST /api/discussions - Create a new discussion (protected route)
async function postDiscussion(request: AuthenticatedRequest) {
  try {
    await connectDB()

    if (!request.user?.id) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const discussion = await Discussion.create({
      id: `discussion_${randomUUID()}`,
      title,
      content,
      author: request.user.id,
      comments: []
    })

    const response: ApiResponse<typeof discussion> = {
      success: true,
      data: discussion,
      message: 'Discussion created successfully'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Create discussion error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create discussion' 
      },
      { status: 500 }
    )
  }
}

export const POST = withAuth(postDiscussion)