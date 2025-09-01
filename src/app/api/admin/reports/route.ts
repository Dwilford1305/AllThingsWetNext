import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Report } from '@/models'
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

export const GET = withRole(['admin', 'super_admin'], getReports)