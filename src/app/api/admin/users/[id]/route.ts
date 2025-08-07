import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User, UserActivityLog, Business } from '@/models'
import type { ApiResponse, UserWithBusinesses } from '@/types'

// GET /api/admin/users/[id] - Get specific user with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const userId = params.id

    const user = await User.aggregate([
      { $match: { id: userId } },
      {
        $lookup: {
          from: 'businesses',
          localField: 'businessIds',
          foreignField: 'id',
          as: 'businesses'
        }
      },
      {
        $lookup: {
          from: 'useractivitylogs',
          let: { userId: '$id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$userId'] } } },
            { $sort: { timestamp: -1 } },
            { $limit: 20 }
          ],
          as: 'recentActivity'
        }
      },
      {
        $project: {
          passwordHash: 0,
          emailVerificationToken: 0,
          passwordResetToken: 0,
          twoFactorSecret: 0
        }
      }
    ])

    if (!user.length) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const response: ApiResponse<UserWithBusinesses> = {
      success: true,
      data: user[0] as UserWithBusinesses
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch user' 
      },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Update user details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const userId = params.id
    const body = await request.json()
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      role, 
      permissions, 
      isActive, 
      isSuspended,
      preferences,
      businessIds
    } = body

    const user = await User.findOne({ id: userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    
    if (firstName !== undefined) updates.firstName = firstName
    if (lastName !== undefined) updates.lastName = lastName
    if (email !== undefined) updates.email = email.toLowerCase()
    if (phone !== undefined) updates.phone = phone
    if (role !== undefined) updates.role = role
    if (permissions !== undefined) updates.permissions = permissions
    if (isActive !== undefined) updates.isActive = isActive
    if (isSuspended !== undefined) updates.isSuspended = isSuspended
    if (preferences !== undefined) updates.preferences = preferences
    if (businessIds !== undefined) updates.businessIds = businessIds

    // Track changes for activity log
    const changes: Record<string, { from: unknown; to: unknown }> = {}
    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = (user as Record<string, unknown>)[key]
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { from: oldValue, to: newValue }
      }
    }

    // Apply updates
    updates.updatedAt = new Date()
    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash -emailVerificationToken -passwordResetToken -twoFactorSecret')

    // Log the update
    await UserActivityLog.create({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      action: 'admin_action',
      details: {
        action: 'user_updated_by_admin',
        changes,
        updatedFields: Object.keys(changes)
      },
      success: true
    })

    const response: ApiResponse<Record<string, unknown>> = {
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Update user error:', error)
    
    // Log failed update attempt
    await UserActivityLog.create({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: params.id,
      action: 'admin_action',
      details: {
        action: 'user_update_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Update failed'
    }).catch(() => {}) // Don't let logging errors affect the main response

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user' 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const userId = params.id

    const user = await User.findOne({ id: userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has active businesses
    const activeBusinesses = await Business.find({
      id: { $in: user.businessIds || [] },
      isClaimed: true,
      subscriptionTier: { $in: ['silver', 'gold', 'platinum'] }
    })

    if (activeBusinesses.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete user with active premium businesses. Please transfer ownership first.' 
        },
        { status: 400 }
      )
    }

    // Soft delete - mark as deleted and deactivate
    const deletedUser = await User.findOneAndUpdate(
      { id: userId },
      { 
        $set: { 
          isActive: false,
          isSuspended: true,
          isDeleted: true,
          deletedAt: new Date(),
          email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
        }
      },
      { new: true }
    ).select('-passwordHash -emailVerificationToken -passwordResetToken -twoFactorSecret')

    // Remove user from all businesses
    await Business.updateMany(
      { id: { $in: user.businessIds || [] } },
      { 
        $unset: { claimedBy: "" },
        $set: { isClaimed: false }
      }
    )

    // Log the deletion
    await UserActivityLog.create({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      action: 'admin_action',
      details: {
        action: 'user_deleted_by_admin',
        businessesUnclaimed: user.businessIds?.length || 0,
        originalEmail: user.email
      },
      success: true
    })

    const response: ApiResponse<Record<string, unknown>> = {
      success: true,
      data: deletedUser,
      message: 'User deleted successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Delete user error:', error)
    
    // Log failed deletion attempt
    await UserActivityLog.create({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: params.id,
      action: 'admin_action',
      details: {
        action: 'user_deletion_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Deletion failed'
    }).catch(() => {}) // Don't let logging errors affect the main response

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete user' 
      },
      { status: 500 }
    )
  }
}
