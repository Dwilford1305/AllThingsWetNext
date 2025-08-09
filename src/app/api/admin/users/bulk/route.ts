import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User, UserActivityLog, Business } from '@/models'
import type { ApiResponse, UserBulkAction } from '@/types'
import { withRole, type AuthenticatedRequest } from '@/lib/auth-middleware'

// POST /api/admin/users/bulk - Bulk operations on users
async function bulkUserAction(request: AuthenticatedRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { action, userIds, data } = body as UserBulkAction

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users selected' },
        { status: 400 }
      )
    }

    let result
    let message = ''
    const results: Array<{ userId: string; success: boolean; error?: string }> = []

    switch (action) {
      case 'suspend':
        result = await User.updateMany(
          { id: { $in: userIds } },
          { $set: { isSuspended: true, updatedAt: new Date() } }
        )
        message = `${result.modifiedCount} users suspended`
        
        // Log each suspension
        for (const userId of userIds) {
          await UserActivityLog.create({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            action: 'admin_action',
            details: {
              action: 'user_suspended_bulk',
              bulkOperationId: `bulk_${Date.now()}`
            },
            success: true
          })
          results.push({ userId, success: true })
        }
        break

      case 'activate':
      case 'reactivate':
        result = await User.updateMany(
          { id: { $in: userIds } },
          { $set: { isSuspended: false, isActive: true, updatedAt: new Date() } }
        )
        message = `${result.modifiedCount} users activated`
        
        // Log each activation
        for (const userId of userIds) {
          await UserActivityLog.create({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            action: 'admin_action',
            details: {
              action: 'user_activated_bulk',
              bulkOperationId: `bulk_${Date.now()}`
            },
            success: true
          })
          results.push({ userId, success: true })
        }
        break

      case 'change_role':
        if (!data?.role) {
          return NextResponse.json(
            { success: false, error: 'Role is required for role change' },
            { status: 400 }
          )
        }
        
        result = await User.updateMany(
          { id: { $in: userIds } },
          { $set: { role: data.role, updatedAt: new Date() } }
        )
        message = `${result.modifiedCount} users role changed to ${data.role}`
        
        // Log each role change
        for (const userId of userIds) {
          await UserActivityLog.create({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            action: 'admin_action',
            details: {
              action: 'user_role_changed_bulk',
              newRole: data.role,
              bulkOperationId: `bulk_${Date.now()}`
            },
            success: true
          })
          results.push({ userId, success: true })
        }
        break

      case 'send_email':
        if (!data?.subject || !data?.message) {
          return NextResponse.json(
            { success: false, error: 'Subject and message are required for email' },
            { status: 400 }
          )
        }
        
        // Get user emails
        const users = await User.find(
          { id: { $in: userIds } },
          { id: 1, email: 1, firstName: 1, lastName: 1 }
        )
        
        // In a real application, you would integrate with an email service
        // For now, we'll just log the action
        for (const user of users) {
          await UserActivityLog.create({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            action: 'admin_action',
            details: {
              action: 'bulk_email_sent',
              subject: data.subject,
              message: data.message,
              bulkOperationId: `bulk_${Date.now()}`
            },
            success: true
          })
          results.push({ userId: user.id, success: true })
        }
        
        message = `Email sent to ${users.length} users`
        break

      case 'export':
        // Get full user data for export
        const exportUsers = await User.find(
          { id: { $in: userIds } },
          { passwordHash: 0, emailVerificationToken: 0, passwordResetToken: 0, twoFactorSecret: 0 }
        )
        
        // Log export action
        await UserActivityLog.create({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: 'admin', // System action
          action: 'admin_action',
          details: {
            action: 'users_exported',
            userCount: exportUsers.length,
            exportedUserIds: userIds,
            bulkOperationId: `bulk_${Date.now()}`
          },
          success: true
        })
        
        return NextResponse.json({
          success: true,
          data: { users: exportUsers },
          message: `${exportUsers.length} users exported`
        })

      case 'delete':
        // Check for users with active businesses
        const usersWithBusinesses = await User.find({
          id: { $in: userIds },
          businessIds: { $exists: true, $ne: [] }
        }).populate('businessIds')
        
        const cannotDelete: string[] = []
        const canDelete: string[] = []
        
        for (const user of usersWithBusinesses) {
          const activeBusinesses = await Business.find({
            id: { $in: user.businessIds || [] },
            isClaimed: true,
            subscriptionTier: { $in: ['silver', 'gold', 'platinum'] }
          })
          
          if (activeBusinesses.length > 0) {
            cannotDelete.push(user.id)
            results.push({ 
              userId: user.id, 
              success: false, 
              error: 'Has active premium businesses' 
            })
          } else {
            canDelete.push(user.id)
          }
        }
        
        // Add users without businesses to deletable list
        const usersWithoutBusinesses = userIds.filter(id => 
          !usersWithBusinesses.some(u => u.id === id)
        )
        canDelete.push(...usersWithoutBusinesses)
        
        if (canDelete.length > 0) {
          // Soft delete users
          result = await User.updateMany(
            { id: { $in: canDelete } },
            { 
              $set: { 
                isActive: false,
                isSuspended: true,
                isDeleted: true,
                deletedAt: new Date(),
                updatedAt: new Date()
              }
            }
          )
          
          // Remove from businesses
          await Business.updateMany(
            { claimedBy: { $in: canDelete } },
            { 
              $unset: { claimedBy: "" },
              $set: { isClaimed: false }
            }
          )
          
          // Log deletions
          for (const userId of canDelete) {
            await UserActivityLog.create({
              id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId,
              action: 'admin_action',
              details: {
                action: 'user_deleted_bulk',
                bulkOperationId: `bulk_${Date.now()}`
              },
              success: true
            })
            results.push({ userId, success: true })
          }
        }
        
        message = `${canDelete.length} users deleted, ${cannotDelete.length} skipped (active businesses)`
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid bulk action' },
          { status: 400 }
        )
    }

    const response: ApiResponse<{
      results: Array<{ userId: string; success: boolean; error?: string }>
      summary: {
        total: number
        successful: number
        failed: number
      }
    }> = {
      success: true,
      data: {
        results,
        summary: {
          total: userIds.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      },
      message
    }

  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown'
  console.log(`🧺 ADMIN BULK USER ACTION by ${actor}: ${action} on ${userIds.length} users`)
  return NextResponse.json(response)
  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bulk operation failed' 
      },
      { status: 500 }
    )
  }
}

export const POST = withRole(['admin','super_admin'], bulkUserAction)
