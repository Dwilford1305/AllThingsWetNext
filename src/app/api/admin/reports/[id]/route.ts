import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Report, MarketplaceListing, MarketplaceComment } from '@/models'
import { withRole, type AuthenticatedRequest } from '@/lib/auth-middleware'
import type { ApiResponse } from '@/types'

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
    
    const reportId = (context?.params as { id?: string } | undefined)?.id
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
    const { status, adminNotes, action } = body // action: 'dismiss', 'hide', 'remove'

    const report = await Report.findOne({ id: reportId })
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    // Update report status
    report.status = status
    report.adminUserId = adminUserId
    report.adminNotes = adminNotes
    if (status === 'resolved') {
      report.resolvedAt = new Date()
    }
    await report.save()

    // Take moderation action if specified
    if (action && status === 'resolved') {
      await takeModerationAction(report, action)
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

async function takeModerationAction(report: ReportDoc, action: string) {
  try {
    if (report.reportType === 'listing') {
      const listing = await MarketplaceListing.findOne({ id: report.contentId })
      if (listing) {
        if (action === 'hide' || action === 'remove') {
          listing.status = 'removed'
          await listing.save()
        }
      }
    } else if (report.reportType === 'comment') {
      const comment = await MarketplaceComment.findOne({ id: report.contentId })
      if (comment) {
        if (action === 'hide' || action === 'remove') {
          comment.isHidden = true
          await comment.save()
        }
      }
    }
  } catch (error) {
    console.error('Moderation action error:', error)
  }
}

export const GET = withRole(['admin', 'super_admin'], getReports)
export const PUT = withRole(['admin', 'super_admin'], updateReport)