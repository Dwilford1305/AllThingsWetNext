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

    // Enrich with content moderation state for conditional UI behavior
    const listingIds: string[] = []
    const commentIds: string[] = []
  for (const r of (reports as unknown as Array<{ reportType: string; contentId: string }>)) {
      if (r.reportType === 'listing') listingIds.push(r.contentId)
      else if (r.reportType === 'comment') commentIds.push(r.contentId)
    }

    const [listings, comments] = await Promise.all([
      listingIds.length
        ? MarketplaceListing.find({ id: { $in: listingIds } })
            .select({ id: 1, status: 1, moderation: 1 })
            .lean<{ id: string; status?: string; moderation?: { state: 'hidden' | 'awaiting_review' | 'none'; reason?: string } }[]>()
        : Promise.resolve([] as { id: string; status?: string; moderation?: { state: 'hidden' | 'awaiting_review' | 'none'; reason?: string } }[]),
      commentIds.length
        ? MarketplaceComment.find({ id: { $in: commentIds } })
            .select({ id: 1, isHidden: 1, moderation: 1 })
            .lean<{ id: string; isHidden: boolean; moderation?: { state: 'hidden' | 'awaiting_review' | 'none'; reason?: string } }[]>()
        : Promise.resolve([] as { id: string; isHidden: boolean; moderation?: { state: 'hidden' | 'awaiting_review' | 'none'; reason?: string } }[])
    ])

    const listingMap = new Map(listings.map(l => [l.id, l]))
    const commentMap = new Map(comments.map(c => [c.id, c]))

    type ReportLean = {
      id: string
      reportType: 'listing' | 'comment'
      contentId: string
      status: string
      reason: string
      description?: string
      adminNotes?: string
      createdAt: string | Date
      updatedAt: string | Date
      [key: string]: unknown
    }

    const enriched = (reports as unknown as ReportLean[]).map((r) => {
      if (r.reportType === 'listing') {
        const l = listingMap.get(r.contentId)
        return {
          ...r,
          contentModeration: l ? {
            type: 'listing' as const,
            state: (l.moderation?.state ?? 'none') as 'hidden' | 'awaiting_review' | 'none',
            status: l.status
          } : { type: 'listing' as const, state: 'none' as const }
        }
      }
      if (r.reportType === 'comment') {
        const c = commentMap.get(r.contentId)
        const state = (c?.moderation?.state ?? (c?.isHidden ? 'hidden' : 'none')) as 'hidden' | 'awaiting_review' | 'none'
        return {
          ...r,
          contentModeration: c ? {
            type: 'comment' as const,
            state,
            isHidden: !!c.isHidden
          } : { type: 'comment' as const, state: 'none' as const }
        }
      }
      return r
    })

    const response: ApiResponse<typeof enriched> = {
      success: true,
      data: enriched
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

export const GET = withRole(['admin', 'super_admin'], getReports)