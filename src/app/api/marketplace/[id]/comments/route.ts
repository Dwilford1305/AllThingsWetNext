import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MarketplaceListing, MarketplaceComment, User } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { v4 as uuidv4 } from 'uuid'
import type { ApiResponse } from '@/types'

// Get comments for a listing
export async function GET(
  request: NextRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    
    // Next.js 15: params may be thenable; await if needed
    type ParamsMaybe = { id?: string } | Promise<{ id: string }> | undefined
    const rawParams = (context as { params?: ParamsMaybe } | undefined)?.params
    let listingId: string | undefined
    if (rawParams && typeof (rawParams as { then?: unknown }).then === 'function') {
      const awaited = await (rawParams as Promise<{ id: string }>)
      listingId = awaited.id
    } else {
      listingId = (rawParams as { id?: string } | undefined)?.id
    }
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID missing' },
        { status: 400 }
      )
    }
    
    // Verify listing exists
    const listing = await MarketplaceListing.findOne({ id: listingId })
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    const comments = await MarketplaceComment.find({ 
      listingId: listingId,
      isHidden: false // Only show non-hidden comments
    })
      .sort({ createdAt: 1 }) // Oldest first for conversation flow
      .lean()

    const response: ApiResponse<typeof comments> = {
      success: true,
      data: comments
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch comments' 
      },
      { status: 500 }
    )
  }
}

// Add comment to listing
async function addComment(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    
    // Next.js 15: params may be thenable; await if needed
    type ParamsMaybe = { id?: string } | Promise<{ id: string }> | undefined
    const rawParams = (context as { params?: ParamsMaybe } | undefined)?.params
    let listingId: string | undefined
    if (rawParams && typeof (rawParams as { then?: unknown }).then === 'function') {
      const awaited = await (rawParams as Promise<{ id: string }>)
      listingId = awaited.id
    } else {
      listingId = (rawParams as { id?: string } | undefined)?.id
    }
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID missing' },
        { status: 400 }
      )
    }
    
  // Resolve user from id or email (supports Auth0 cookie sessions)
  let userId = request.user?.id
    if (!userId) {
      const email = (request.user as unknown as { email?: string } | undefined)?.email
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        )
      }
  const userByEmail = await User.findOne({ email })
  if (!userByEmail) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }
  userId = userByEmail.id
    }

    // Verify listing exists
    const listing = await MarketplaceListing.findOne({ id: listingId })
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Get user info for display name
  const user = await User.findOne({ id: userId })
  if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Determine display name: prefer username; otherwise first name only
    const userName = (user as { username?: string }).username?.trim()
      ? (user as { username: string }).username.trim()
      : user.firstName

    // Create comment
    const commentId = uuidv4()
    const comment = new MarketplaceComment({
      id: commentId,
      listingId: listingId,
      userId,
      userName,
      content: content.trim(),
      isReported: false,
      reportCount: 0,
      isHidden: false
    })

    await comment.save()

    // Notify live subscribers via SSE (best-effort)
    try {
      const mod: { notifyNewComment?: (listingId: string, payload: unknown) => void } = await import('./events/route')
      if (typeof mod.notifyNewComment === 'function') {
        mod.notifyNewComment(listingId, { type: 'new_comment', data: comment })
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    })

  } catch (error) {
    console.error('Add comment error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add comment' 
      },
      { status: 500 }
    )
  }
}

export const POST = withAuth(addComment)