import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/auth'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'

// Utility to check if quota needs reset (new month)
function shouldResetQuota(resetDate: Date): boolean {
  const now = new Date()
  return now >= resetDate
}

// Utility to get next reset date (first day of next month)
function getNextResetDate(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
}

async function checkQuota(request: AuthenticatedRequest) {
  try {
    await connectDB()
    
    const userId = request.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const user = await User.findOne({ id: userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Initialize marketplace subscription if it doesn't exist
    if (!user.marketplaceSubscription) {
      user.marketplaceSubscription = {
        tier: 'free',
        status: 'inactive',
        adQuota: {
          monthly: 1,
          used: 0,
          resetDate: getNextResetDate()
        },
        features: {
          featuredAds: false,
          analytics: false,
          prioritySupport: false,
          photoLimit: 1,
          adDuration: 30
        }
      }
      await user.save()
    }

    const subscription = user.marketplaceSubscription
    let quotaReset = false

    // Check if quota needs reset
    if (shouldResetQuota(subscription.adQuota.resetDate)) {
      subscription.adQuota.used = 0
      subscription.adQuota.resetDate = getNextResetDate()
      await user.save()
      quotaReset = true
    }

    const quota = subscription.adQuota
    const hasQuotaAvailable = quota.monthly === 9999 || quota.used < quota.monthly // 9999 = unlimited
    
    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          tier: subscription.tier,
          status: subscription.status
        },
        quota: {
          monthly: quota.monthly === 9999 ? -1 : quota.monthly, // Return -1 for unlimited
          used: quota.used,
          remaining: quota.monthly === 9999 ? -1 : Math.max(0, quota.monthly - quota.used),
          resetDate: quota.resetDate,
          hasQuotaAvailable
        },
        features: subscription.features,
        quotaReset
      }
    })

  } catch (error) {
    console.error('Quota check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check quota' 
      },
      { status: 500 }
    )
  }
}

async function useQuota(request: AuthenticatedRequest) {
  try {
    await connectDB()
    
    const userId = request.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const user = await User.findOne({ id: userId })
    if (!user || !user.marketplaceSubscription) {
      return NextResponse.json(
        { success: false, error: 'User or subscription not found' },
        { status: 404 }
      )
    }

    const subscription = user.marketplaceSubscription

    // Check if quota needs reset first
    if (shouldResetQuota(subscription.adQuota.resetDate)) {
      subscription.adQuota.used = 0
      subscription.adQuota.resetDate = getNextResetDate()
    }

    const quota = subscription.adQuota
    
    // Check if user has quota available
    if (quota.monthly !== 9999 && quota.used >= quota.monthly) {
      return NextResponse.json(
        { success: false, error: 'Ad quota exceeded for this month' },
        { status: 403 }
      )
    }

    // Use one quota
    subscription.adQuota.used += 1
    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Quota used successfully',
      data: {
        quota: {
          monthly: quota.monthly === 9999 ? -1 : quota.monthly,
          used: subscription.adQuota.used,
          remaining: quota.monthly === 9999 ? -1 : Math.max(0, quota.monthly - subscription.adQuota.used),
          resetDate: subscription.adQuota.resetDate
        }
      }
    })

  } catch (error) {
    console.error('Use quota error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to use quota' 
      },
      { status: 500 }
    )
  }
}

export const GET = withAuth(checkQuota)
export const POST = withAuth(useQuota)