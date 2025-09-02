import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Report, MarketplaceListing, MarketplaceComment, User } from '@/models'
import { withRole, type AuthenticatedRequest } from '@/lib/auth-middleware'
import type { ApiResponse } from '@/types'
import { sendEmail } from '@/lib/email'

// Get all reports for admin dashboard
async function getReports(
  request: AuthenticatedRequest,
  _context?: Record<string, unknown>
) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const type = searchParams.get('type') // 'listing' or 'comment'
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    const query: Record<string, unknown> = {}
    if (status !== 'all') query.status = status
    if (type) query.reportType = type

    const skip = (page - 1) * limit

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()

    const total = await Report.countDocuments(query)

    const response: ApiResponse<typeof reports> = {
      success: true,
      data: reports
    }

    return NextResponse.json({
      ...response,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reports' 
      },
      { status: 500 }
    )
  }
}

// Update report status and take moderation action
async function updateReport(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    
    let reportId: string | undefined
    if (context && 'params' in context) {
      const paramsValue = (context as { params?: unknown }).params
      if (paramsValue && typeof (paramsValue as { then?: unknown }).then === 'function') {
        const resolved = await (paramsValue as Promise<{ id?: string }>)
        reportId = resolved?.id
      } else {
        reportId = (paramsValue as { id?: string } | undefined)?.id
      }
    }
    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Report ID missing' },
        { status: 400 }
      )
    }

    const adminUserId = request.user?.id
    if (!adminUserId) {
      return NextResponse.json(
        { success: false, error: 'Admin user not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
  const { status, adminNotes, action, reason } = body // action: 'dismiss', 'hide', 'remove'; reason required for hide/remove

    const report = await Report.findOne({ id: reportId })
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    // Require reason for hide/remove to inform user and for audit
  if ((action === 'hide' || action === 'remove') && (!reason || String(reason).trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Reason is required for hide/remove actions' },
        { status: 400 }
      )
    }

    // Update report status
    report.status = status
    report.adminUserId = adminUserId
    report.adminNotes = [adminNotes, reason].filter(Boolean).join('\n')
    if (status === 'resolved') {
      report.resolvedAt = new Date()
    }
    await report.save()

    // Take moderation action if specified
    if (action && status === 'resolved') {
      await takeModerationAction(report, action, reason)
    }

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    })

  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update report' 
      },
      { status: 500 }
    )
  }
}

type ReportDoc = {
  reportType: 'listing' | 'comment'
  contentId: string
}

async function takeModerationAction(report: ReportDoc, action: string, reason?: string) {
  try {
    if (report.reportType === 'listing') {
      const listing = await MarketplaceListing.findOne({ id: report.contentId })
      if (listing) {
        if (action === 'hide') {
          // Hide from marketplace, keep for owner with explanation
          listing.status = 'removed'
          listing.moderation = {
            ...(listing.moderation || {}),
            state: 'hidden',
            reason: reason || listing.moderation?.reason,
            adminUserId: (await User.findOne({ id: listing.userId })) ? listing.userId : listing.moderation?.adminUserId,
            updatedAt: new Date()
          }
          await listing.save()

          // Notify owner with required changes
          await notifyListingOwner(listing.userId, listing.title, 'hidden', reason)
        } else if (action === 'remove') {
          // Permanently remove listing and credit quota back
          const owner = await User.findOne({ id: listing.userId })
          if (owner) {
            // Credit back one ad quota if applicable
            if (owner.marketplaceSubscription?.adQuota) {
              owner.marketplaceSubscription.adQuota.used = Math.max(0, owner.marketplaceSubscription.adQuota.used - 1)
              await owner.save()
            }
            await notifyListingOwner(listing.userId, listing.title, 'removed', reason, true)
          }
          await MarketplaceListing.deleteOne({ id: report.contentId })
        } else if (action === 'unhide') {
          // Restore listing to active if previously hidden/awaiting_review
          listing.status = 'active'
          listing.moderation = {
            state: 'none',
            reason: '',
            adminUserId: listing.moderation?.adminUserId,
            updatedAt: new Date()
          }
          listing.isReported = false
          await listing.save()
        }
      }
    } else if (report.reportType === 'comment') {
      const comment = await MarketplaceComment.findOne({ id: report.contentId })
      if (comment) {
        const author = await User.findOne({ id: comment.userId })
        if (action === 'hide') {
          comment.isHidden = true
          comment.moderation = {
            ...(comment.moderation || {}),
            state: 'hidden',
            reason: reason || comment.moderation?.reason,
            adminUserId: comment.moderation?.adminUserId,
            updatedAt: new Date()
          }
          await comment.save()
          await notifyCommentAuthor(author?.email, comment.userId, 'hidden', reason)
        } else if (action === 'remove') {
          // Permanently delete the comment
          await MarketplaceComment.deleteOne({ id: report.contentId })
          await notifyCommentAuthor(author?.email, comment.userId, 'removed', reason, true)
          // Track simple strike count via activity log or future field (omitted schema changes)
        } else if (action === 'unhide') {
          comment.isHidden = false
          comment.moderation = { state: 'none', reason: '', adminUserId: comment.moderation?.adminUserId, updatedAt: new Date() }
          await comment.save()
        }
      }
    }
  } catch (error) {
    console.error('Moderation action error:', error)
  }
}

async function notifyListingOwner(userId: string, listingTitle: string, state: 'hidden' | 'removed', reason?: string, credited?: boolean) {
  try {
    const user = await User.findOne({ id: userId })
    if (!user?.email) return
    const subject = state === 'hidden' 
      ? 'Your marketplace listing has been temporarily hidden'
      : 'Your marketplace listing has been removed'
    const creditLine = state === 'removed' && credited ? '\n\nWe have credited your ad quota with one additional ad.' : ''
    const body = `Hello ${user.firstName},

Your listing "${listingTitle}" has been ${state} by our moderation team.

Reason:
${reason || 'Violation of community standards.'}
${creditLine}

If hidden: please edit your ad to address the above. It will enter review once updated.

Thanks,
All Things Wetaskiwin Team`
    await sendEmail(user.email, subject, body)
  } catch (e) {
    console.error('Failed to notify listing owner:', e)
  }
}

async function notifyCommentAuthor(email: string | undefined, userId: string, state: 'hidden' | 'removed', reason?: string, removalWarning?: boolean) {
  try {
    if (!email) return
    const subject = state === 'hidden' 
      ? 'Your comment has been temporarily hidden'
      : 'Your comment has been removed'
    const warning = removalWarning ? '\n\nPlease note: 3 removed comments may result in account suspension.' : ''
    const body = `Hello,

Your comment was ${state} by our moderation team.

Reason:
${reason || 'Violation of community standards.'}
${warning}

Thanks,
All Things Wetaskiwin Team`
    await sendEmail(email, subject, body)
  } catch (e) {
    console.error('Failed to notify comment author:', e)
  }
}

export const GET = withRole(['admin', 'super_admin'], getReports)
export const PUT = withRole(['admin', 'super_admin'], updateReport)