import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/auth'
import type { ApiResponse } from '@/types'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'

// Marketplace subscription tiers and pricing
const MARKETPLACE_TIERS = {
  free: {
    price: { monthly: 0, annual: 0 },
    adQuota: 1,
    features: {
      featuredAds: false,
      analytics: false,
      prioritySupport: false,
      photoLimit: 1,
      adDuration: 30
    }
  },
  silver: {
    price: { monthly: 9.99, annual: 99.99 },
    adQuota: 5,
    features: {
      featuredAds: false,
      analytics: true,
      prioritySupport: false,
      photoLimit: 5,
      adDuration: 45
    }
  },
  gold: {
    price: { monthly: 19.99, annual: 199.99 },
    adQuota: 15,
    features: {
      featuredAds: true,
      analytics: true,
      prioritySupport: true,
      photoLimit: 10,
      adDuration: 60
    }
  },
  platinum: {
    price: { monthly: 39.99, annual: 399.99 },
    adQuota: -1, // Unlimited
    features: {
      featuredAds: true,
      analytics: true,
      prioritySupport: true,
      photoLimit: 20,
      adDuration: 90
    }
  }
}

async function getSubscriptionInfo(request: AuthenticatedRequest) {
  try {
    await connectDB()
    
    const userId = request.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Fetch the actual user data from database to get current subscription
    const user = await User.findOne({ id: userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get current subscription or default for new users
    let currentSubscription = user.marketplaceSubscription

    // Special handling for super_admin users - give them platinum access for testing
    if (user.role === 'super_admin' && (!currentSubscription || currentSubscription.tier === 'free')) {
      currentSubscription = {
        tier: 'platinum',
        status: 'active',
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        adQuota: {
          monthly: 9999, // Unlimited for super admin
          used: 0,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        },
        features: {
          featuredAds: true,
          analytics: true,
          prioritySupport: true,
          photoLimit: 20,
          adDuration: 90
        }
      }
    }

    // Provide default if no subscription exists
    if (!currentSubscription) {
      currentSubscription = {
        tier: 'free',
        status: 'inactive',
        adQuota: { monthly: 1, used: 0, resetDate: new Date() },
        features: MARKETPLACE_TIERS.free.features
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Marketplace subscription info retrieved successfully.',
      endpoints: {
        'GET /api/marketplace/subscription': 'Get subscription info and tiers',
        'POST /api/marketplace/subscription': 'Upgrade/modify user marketplace subscription'
      },
      subscriptionTiers: {
        free: {
          price: 'Free',
          features: ['1 ad per month', '1 photo per ad', '30-day ad duration', 'Basic support']
        },
        silver: {
          price: '$9.99/month or $99.99/year',
          features: ['5 ads per month', '5 photos per ad', '45-day ad duration', 'Basic analytics', 'Email support']
        },
        gold: {
          price: '$19.99/month or $199.99/year',
          features: ['15 ads per month', '10 photos per ad', '60-day ad duration', 'Featured ads', 'Analytics dashboard', 'Priority support']
        },
        platinum: {
          price: '$39.99/month or $399.99/year',
          features: ['Unlimited ads', '20 photos per ad', '90-day ad duration', 'Featured ads', 'Advanced analytics', 'Priority support', 'Phone support']
        }
      },
      currentSubscription,
      userRole: user.role // Include role for frontend debugging
    })

  } catch (error) {
    console.error('Error fetching subscription info:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch subscription info' 
      },
      { status: 500 }
    )
  }
}

async function upgradeSubscription(request: AuthenticatedRequest) {
  try {
    await connectDB()
    
    const { subscriptionTier, duration = 12 } = await request.json()
    
    // Validate inputs
    if (!subscriptionTier || !['silver', 'gold', 'platinum'].includes(subscriptionTier)) {
      return NextResponse.json(
        { success: false, error: 'Valid subscription tier is required (silver, gold, platinum)' },
        { status: 400 }
      )
    }
    
    if (duration < 1 || duration > 24) {
      return NextResponse.json(
        { success: false, error: 'Duration must be between 1 and 24 months' },
        { status: 400 }
      )
    }

    const userId = request.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Find the user
    const user = await User.findOne({ id: userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate subscription dates and pricing
    const now = new Date()
    const subscriptionEnd = new Date(now)
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + duration)
    
    const tierConfig = MARKETPLACE_TIERS[subscriptionTier as keyof typeof MARKETPLACE_TIERS]
    const isAnnual = duration >= 12
    const cost = isAnnual ? tierConfig.price.annual : tierConfig.price.monthly * duration
    
    // Calculate next quota reset (first day of next month)
    const quotaResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Update user marketplace subscription
    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      {
        marketplaceSubscription: {
          tier: subscriptionTier,
          status: 'active', // Will be updated by PayPal webhook
          subscriptionStart: now,
          subscriptionEnd,
          paypalSubscriptionId: null, // Will be set after PayPal processing
          adQuota: {
            monthly: tierConfig.adQuota === -1 ? 9999 : tierConfig.adQuota, // Use large number for "unlimited"
            used: user.marketplaceSubscription?.adQuota?.used || 0,
            resetDate: quotaResetDate
          },
          features: tierConfig.features
        },
        updatedAt: now
      },
      { new: true }
    )

    // TODO: Initialize PayPal payment and return payment URL
    console.log(`Marketplace subscription upgrade for ${user.email}:`)
    console.log(`  Tier: ${subscriptionTier}`)
    console.log(`  Duration: ${duration} months`)
    console.log(`  Cost: $${cost.toFixed(2)}`)
    console.log(`  Quota: ${tierConfig.adQuota === -1 ? 'Unlimited' : tierConfig.adQuota} ads/month`)

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      data: updatedUser,
      message: `Marketplace subscription upgraded to ${subscriptionTier} successfully`
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Marketplace subscription upgrade error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upgrade marketplace subscription' 
      },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getSubscriptionInfo)
export const POST = withAuth(upgradeSubscription)