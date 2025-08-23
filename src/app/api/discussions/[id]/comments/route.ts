import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Discussion } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import type { ApiResponse } from '@/types'
import { randomUUID } from 'crypto'

interface RouteParams {
  params: { id: string }
}

// POST /api/discussions/[id]/comments - Add comment to discussion (protected route)
async function postComment(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  const params = (context as RouteParams)?.params
  if (!params) {
    return NextResponse.json(
      { success: false, error: 'Invalid request parameters' },
      { status: 400 }
    )
  }
  try {
    await connectDB()

    if (!request.user?.id) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      )
    }

    const discussion = await Discussion.findOne({ id: params.id })

    if (!discussion) {
      return NextResponse.json(
        { success: false, error: 'Discussion not found' },
        { status: 404 }
      )
    }

    const newComment = {
      id: `comment_${randomUUID()}`,
      content,
      author: request.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    discussion.comments.push(newComment)
    discussion.updatedAt = new Date()
    await discussion.save()

    const response: ApiResponse<typeof newComment> = {
      success: true,
      data: newComment,
      message: 'Comment added successfully'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Add comment error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add comment' 
      },
      { status: 500 }
    )
  }
}

export const POST = withAuth(postComment)