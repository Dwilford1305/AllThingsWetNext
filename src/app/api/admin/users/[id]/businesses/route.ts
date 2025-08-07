import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User, Business, UserActivityLog } from '@/models'
import type { ApiResponse } from '@/types'

// POST /api/admin/users/[id]/businesses - Link/unlink businesses to user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const userId = params.id
    const body = await request.json()
    const { action, businessIds } = body

    const user = await User.findOne({ id: userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    let message = ''

    switch (action) {
      case 'link':
        // Verify businesses exist
        const businessesToLink = await Business.find({ id: { $in: businessIds } })
        if (businessesToLink.length !== businessIds.length) {
          return NextResponse.json(
            { success: false, error: 'Some businesses not found' },
            { status: 400 }
          )
        }

        // Add business IDs to user
        const currentBusinessIds = user.businessIds || []
        const newBusinessIds = [...new Set([...currentBusinessIds, ...businessIds])]
        
        await User.findOneAndUpdate(
          { id: userId },
          { $set: { businessIds: newBusinessIds, updatedAt: new Date() } }
        )

        // Update businesses to be claimed by this user
        await Business.updateMany(
          { id: { $in: businessIds } },
          { $set: { claimedBy: userId, isClaimed: true, updatedAt: new Date() } }
        )

        // Log the linking
        await UserActivityLog.create({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          action: 'admin_action',
          details: {
            action: 'businesses_linked_to_user',
            businessIds,
            businessCount: businessIds.length
          },
          success: true
        })

        message = `${businessIds.length} businesses linked to user`
        break

      case 'unlink':
        // Remove business IDs from user
        const updatedBusinessIds = (user.businessIds || []).filter(
          (id: string) => !businessIds.includes(id)
        )
        
        await User.findOneAndUpdate(
          { id: userId },
          { $set: { businessIds: updatedBusinessIds, updatedAt: new Date() } }
        )

        // Update businesses to be unclaimed
        await Business.updateMany(
          { id: { $in: businessIds } },
          { $unset: { claimedBy: "" }, $set: { isClaimed: false, updatedAt: new Date() } }
        )

        // Log the unlinking
        await UserActivityLog.create({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          action: 'admin_action',
          details: {
            action: 'businesses_unlinked_from_user',
            businessIds,
            businessCount: businessIds.length
          },
          success: true
        })

        message = `${businessIds.length} businesses unlinked from user`
        break

      case 'transfer':
        const { targetUserId } = body
        if (!targetUserId) {
          return NextResponse.json(
            { success: false, error: 'Target user ID required for transfer' },
            { status: 400 }
          )
        }

        const targetUser = await User.findOne({ id: targetUserId })
        if (!targetUser) {
          return NextResponse.json(
            { success: false, error: 'Target user not found' },
            { status: 404 }
          )
        }

        // Remove from current user
        const remainingBusinessIds = (user.businessIds || []).filter(
          (id: string) => !businessIds.includes(id)
        )
        await User.findOneAndUpdate(
          { id: userId },
          { $set: { businessIds: remainingBusinessIds, updatedAt: new Date() } }
        )

        // Add to target user
        const targetCurrentBusinessIds = targetUser.businessIds || []
        const targetNewBusinessIds = [...new Set([...targetCurrentBusinessIds, ...businessIds])]
        await User.findOneAndUpdate(
          { id: targetUserId },
          { $set: { businessIds: targetNewBusinessIds, updatedAt: new Date() } }
        )

        // Update businesses
        await Business.updateMany(
          { id: { $in: businessIds } },
          { $set: { claimedBy: targetUserId, isClaimed: true, updatedAt: new Date() } }
        )

        // Log the transfer
        await UserActivityLog.create({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          action: 'admin_action',
          details: {
            action: 'businesses_transferred_from_user',
            businessIds,
            targetUserId,
            businessCount: businessIds.length
          },
          success: true
        })

        await UserActivityLog.create({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: targetUserId,
          action: 'admin_action',
          details: {
            action: 'businesses_transferred_to_user',
            businessIds,
            fromUserId: userId,
            businessCount: businessIds.length
          },
          success: true
        })

        message = `${businessIds.length} businesses transferred to ${targetUser.firstName} ${targetUser.lastName}`
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Get updated user data
    const updatedUser = await User.findOne({ id: userId })
      .select('-passwordHash -emailVerificationToken -passwordResetToken -twoFactorSecret')

    const response: ApiResponse<Record<string, unknown>> = {
      success: true,
      data: updatedUser,
      message
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Business relationship error:', error)
    
    // Log failed operation
    await UserActivityLog.create({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: params.id,
      action: 'admin_action',
      details: {
        action: 'business_relationship_operation_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Operation failed'
    }).catch(() => {})

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Business operation failed' 
      },
      { status: 500 }
    )
  }
}
