import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User, UserActivityLog } from '@/models'
import type { ApiResponse, UserWithBusinesses, UserManagementStats, UserRole } from '@/types'
import { withRole } from '@/lib/auth-middleware'
import { AuthService } from '@/lib/auth'

// GET /api/admin/users - Get all users with filtering and pagination
async function getUsers(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    
    const skip = (page - 1) * limit

    // Build query
    const query: Record<string, unknown> = {}
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (role && role !== 'all') {
      query.role = role
    }
    
    if (status === 'active') {
      query.isActive = true
      query.isSuspended = false
    } else if (status === 'suspended') {
      query.isSuspended = true
    } else if (status === 'inactive') {
      query.isActive = false
    }

    // Build sort
    const sortObj: { [key: string]: 1 | -1 } = {}
    sortObj[sort] = order === 'asc' ? 1 : -1

    // Get users with business count
    const [users, totalCount] = await Promise.all([
      User.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'businesses',
            let: { userBusinessIds: '$businessIds', userEmail: '$email' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $in: ['$id', '$$userBusinessIds'] },
                      { $eq: ['$claimedBy', '$$userEmail'] }
                    ]
                  }
                }
              }
            ],
            as: 'businesses'
          }
        },
        {
          $addFields: {
            totalBusinesses: { $size: '$businesses' },
            claimedBusinesses: {
              $size: {
                $filter: {
                  input: '$businesses',
                  cond: { $eq: ['$$this.isClaimed', true] }
                }
              }
            },
            premiumBusinesses: {
              $size: {
                $filter: {
                  input: '$businesses',
                  cond: { 
                    $and: [
                      { $eq: ['$$this.isClaimed', true] },
                      { $in: ['$$this.subscriptionTier', ['silver', 'gold', 'platinum']] }
                    ]
                  }
                }
              }
            }
          }
        },
        { $sort: sortObj },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            passwordHash: 0,
            emailVerificationToken: 0,
            passwordResetToken: 0,
            twoFactorSecret: 0
          }
        }
      ]),
      User.countDocuments(query)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // Get user management stats
    const stats = await User.aggregate([
      {
        $lookup: {
          from: 'businesses',
          let: { userBusinessIds: '$businessIds', userEmail: '$email' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $in: ['$id', '$$userBusinessIds'] },
                    { $eq: ['$claimedBy', '$$userEmail'] }
                  ]
                }
              }
            },
            {
              $match: { isClaimed: true }
            }
          ],
          as: 'claimedBusinesses'
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$isActive', true] }, { $eq: ['$isSuspended', false] }] },
                1, 0
              ]
            }
          },
          suspendedUsers: {
            $sum: { $cond: [{ $eq: ['$isSuspended', true] }, 1, 0] }
          },
          businessOwners: {
            $sum: { 
              $cond: [
                { 
                  $or: [
                    { $eq: ['$role', 'business_owner'] },
                    { $gt: [{ $size: '$claimedBusinesses' }, 0] }
                  ]
                }, 
                1, 0 
              ] 
            }
          },
          recentSignups: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                1, 0
              ]
            }
          }
        }
      }
    ])

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ])

    const managementStats: UserManagementStats = {
      totalUsers: stats[0]?.totalUsers || 0,
      activeUsers: stats[0]?.activeUsers || 0,
      suspendedUsers: stats[0]?.suspendedUsers || 0,
      businessOwners: stats[0]?.businessOwners || 0,
      premiumBusinessOwners: 0, // Will be calculated from business data
      recentSignups: stats[0]?.recentSignups || 0,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id as keyof typeof acc] = item.count
        return acc
      }, {} as Record<string, number>)
    }

    const response: ApiResponse<{
      users: UserWithBusinesses[]
      pagination: {
        currentPage: number
        totalPages: number
        totalCount: number
        hasNextPage: boolean
        hasPrevPage: boolean
        limit: number
      }
      stats: UserManagementStats
    }> = {
      success: true,
      data: {
        users: users as UserWithBusinesses[],
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        stats: managementStats
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch users' 
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create new user (admin only)
// Requires X-CSRF-Token header matching csrfToken cookie
async function createUser(request: NextRequest & { user?: { role?: string } }) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, firstName, lastName, role, phone, permissions } = body as { email: string; firstName: string; lastName: string; role: UserRole; phone?: string; permissions?: string[] }

    const requesterRole = request.user?.role
    if ((role === 'admin' || role === 'super_admin') && requesterRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admin may create admin accounts' },
        { status: 403 }
      )
    }
    if (role === 'super_admin' && requesterRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient privileges to create super admin' },
        { status: 403 }
      )
    }

    const sanitizedPermissions = (role === 'admin' || role === 'super_admin') ? permissions : undefined

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Generate temporary password (user will need to reset it)
    const tempPassword = Math.random().toString(36).slice(-12)
  const passwordHash = await AuthService.hashPassword(tempPassword)

    const newUser = new User({
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role,
      phone,
  permissions: sanitizedPermissions,
      isEmailVerified: true, // Admin-created accounts are pre-verified
      preferences: {
        notifications: {
          email: true,
          events: true,
          news: true,
          businessUpdates: true,
          marketing: false
        },
        privacy: {
          profileVisible: true,
          contactInfoVisible: false
        },
        theme: 'system'
      }
    })

    await newUser.save()

  // Log the creation with actor context
  await UserActivityLog.create({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: newUser.id,
      action: 'admin_action',
      details: {
        action: 'user_created_by_admin',
        createdRole: role,
    tempPassword,
    actorRole: requesterRole
      },
      success: true
    })

    const response: ApiResponse<{ user: Partial<typeof newUser>; tempPassword: string }> = {
      success: true,
      data: {
        user: {
          ...newUser.toObject(),
          passwordHash: undefined // Don't return password hash
        },
        tempPassword // Return for admin to communicate to user
      },
      message: 'User created successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user' 
      },
      { status: 500 }
    )
  }
}

export const GET = withRole(['admin','super_admin'], getUsers)
export const POST = withRole(['admin','super_admin'], createUser)
