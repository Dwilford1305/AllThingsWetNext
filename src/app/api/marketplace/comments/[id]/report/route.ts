import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MarketplaceComment, Report, User } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { v4 as uuidv4 } from 'uuid'

// Report a marketplace comment
async function reportComment(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    
    type ParamsMaybe = { id?: string } | Promise<{ id: string }> | undefined
    const rawParams = (context as { params?: ParamsMaybe } | undefined)?.params
    let commentId: string | undefined
    if (rawParams && typeof (rawParams as { then?: unknown }).then === 'function') {
      const awaited = await (rawParams as Promise<{ id: string }>)
      commentId = awaited.id
    } else {
      commentId = (rawParams as { id?: string } | undefined)?.id
    }
    if (!commentId) {
      return NextResponse.json(
        { success: false, error: 'Comment ID missing' },
        { status: 400 }
      )
    }
    
    const userId = request.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Verify comment exists
    const comment = await MarketplaceComment.findOne({ id: commentId })
    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { reason, description } = body

    if (!reason || !description) {
      return NextResponse.json(
        { success: false, error: 'Reason and description are required' },
        { status: 400 }
      )
    }

    // Get user info
    const user = await User.findOne({ id: userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already reported this comment
    const existingReport = await Report.findOne({
      reporterUserId: userId,
      reportType: 'comment',
      contentId: commentId
    })

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'You have already reported this comment' },
        { status: 409 }
      )
    }

  const reporterName = (user as { username?: string }).username?.trim() || user.firstName

    // Create report
    const reportId = uuidv4()
    const report = new Report({
      id: reportId,
      reporterUserId: userId,
      reporterName,
      reportType: 'comment',
      contentId: commentId,
      reason,
      description,
      status: 'pending'
    })

    await report.save()

    // Update comment report count
    comment.isReported = true
    comment.reportCount += 1
    await comment.save()

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      data: { reportId }
    })

  } catch (error) {
    console.error('Report comment error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit report' 
      },
      { status: 500 }
    )
  }
}

export const POST = withAuth(reportComment)