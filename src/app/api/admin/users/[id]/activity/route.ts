import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { UserActivityLog } from '@/models'
import type { ApiResponse } from '@/types'
import { withRole, type AuthenticatedRequest } from '@/lib/auth-middleware'

// GET /api/admin/users/[id]/activity - Get user activity logs
async function getUserActivity(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    const userId = (context?.params as { id?: string } | undefined)?.id
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 400 })
    }
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    const skip = (page - 1) * limit

    // Build query
    const query: Record<string, unknown> = { userId }
    
    if (action && action !== 'all') {
      query.action = action
    }
    
    if (dateFrom || dateTo) {
      query.timestamp = {} as { $gte?: Date; $lte?: Date }
      if (dateFrom) (query.timestamp as { $gte?: Date; $lte?: Date }).$gte = new Date(dateFrom)
      if (dateTo) (query.timestamp as { $gte?: Date; $lte?: Date }).$lte = new Date(dateTo)
    }

    const [activities, totalCount] = await Promise.all([
      UserActivityLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserActivityLog.countDocuments(query)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // Get activity statistics
    const stats = await UserActivityLog.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          successRate: { 
            $avg: { $cond: ['$success', 1, 0] } 
          },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ])

    const recentFailures = await UserActivityLog.find({
      userId,
      success: false,
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .lean()

    const response: ApiResponse<{
      activities: Array<Record<string, unknown>>
      pagination: {
        currentPage: number
        totalPages: number
        totalCount: number
        hasNextPage: boolean
        hasPrevPage: boolean
        limit: number
      }
      stats: {
        byAction: Array<Record<string, unknown>>
        recentFailures: Array<Record<string, unknown>>
        totalActivities: number
        successRate: number
        averageActivitiesPerDay: number
      }
    }> = {
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        stats: {
          byAction: stats,
          recentFailures,
          totalActivities: totalCount,
          successRate: activities.length > 0 
            ? activities.filter(a => a.success).length / activities.length 
            : 0,
          averageActivitiesPerDay: totalCount / Math.max(1, 
            Math.ceil((Date.now() - new Date(activities[activities.length - 1]?.timestamp || Date.now()).getTime()) / (24 * 60 * 60 * 1000))
          )
        }
      }
    }

  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown'
  console.log(`📄 ADMIN USER ACTIVITY VIEW by ${actor}: ${userId}`)
  return NextResponse.json(response)
  } catch (error) {
    console.error('Get user activity error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch user activity' 
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/users/[id]/activity - Add manual activity log entry (admin action)
async function createUserActivity(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    const userId = (context?.params as { id?: string } | undefined)?.id
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 400 })
    }
    const body = await request.json()
    const { action, details, note } = body

    const activityLog = await UserActivityLog.create({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action: 'admin_action',
      details: {
        action: action || 'manual_entry',
        adminNote: note,
        manualEntry: true,
        ...details
      },
      success: true
    })

    const response: ApiResponse<Record<string, unknown>> = {
      success: true,
      data: activityLog,
      message: 'Activity log entry created'
    }

  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown'
  console.log(`📝 ADMIN USER ACTIVITY CREATE by ${actor} for user ${userId}`)
  return NextResponse.json(response)
  } catch (error) {
    console.error('Create activity log error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create activity log' 
      },
      { status: 500 }
    )
  }
}

export const GET = withRole(['admin','super_admin'], getUserActivity)
export const POST = withRole(['admin','super_admin'], createUserActivity)
