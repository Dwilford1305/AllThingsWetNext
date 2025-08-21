import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business as BusinessModel } from '@/models'
import type { ApiResponse } from '@/types'
import { withRole, type AuthenticatedRequest } from '@/lib/auth-middleware'

// POST /api/admin/businesses/[id]/subscription - Admin subscription management
async function updateSubscription(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()

    const params = (context?.params as { id?: string } | undefined)
    const businessId = params?.id
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID missing' }, { status: 400 })
    }
    const body = await request.json()
    const { tier, duration } = body

    // Validate inputs
    if (!tier || !['free', 'silver', 'gold', 'platinum'].includes(tier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    if (tier !== 'free' && (!duration || duration < 1 || duration > 24)) {
      return NextResponse.json(
        { success: false, error: 'Duration must be between 1 and 24 months for paid tiers' },
        { status: 400 }
      )
    }

    // Find the business
    const business = await BusinessModel.findOne({ id: businessId })
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      )
    }

    // Calculate subscription dates
    const now = new Date()
    const subscriptionStart = now
    let subscriptionEnd = null
    let subscriptionStatus = 'inactive'

    if (tier !== 'free') {
      subscriptionEnd = new Date(now)
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + duration)
      subscriptionStatus = 'active'
    }

    // Update the business subscription
    const updateData = {
      subscriptionTier: tier,
      subscriptionStatus,
      subscriptionStart,
      subscriptionEnd,
      updatedAt: now
    }

    const updatedBusiness = await BusinessModel.findOneAndUpdate(
      { id: businessId },
      updateData,
      { new: true }
    )

  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown'
  console.log(`💳 ADMIN SUBSCRIPTION UPDATE (${actor}): ${business.name} -> ${tier} for ${duration || 0} months`)

    const response: ApiResponse<typeof updatedBusiness> = {
      success: true,
      data: updatedBusiness,
      message: `Subscription updated to ${tier} successfully`
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Admin subscription update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update subscription' 
      },
      { status: 500 }
    )
  }
}

export const POST = withRole(['admin','super_admin'], updateSubscription)
