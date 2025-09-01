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
    let user = userId ? await User.findOne({ id: userId }) : null
    if (!user) {
      // Try resolving by email when coming from Auth0 fallback in auth middleware
      const email = (request.user as unknown as { email?: string } | undefined)?.email
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        )
      }
      user = await User.findOne({ email })
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }
    }

    // Ensure marketplace subscription exists; prime admin/super_admin users with higher quotas
    if (!user.marketplaceSubscription) {
      user.marketplaceSubscription = {
        tier: ['admin','super_admin'].includes(user.role) ? 'platinum' : 'free',
        status: ['admin','super_admin'].includes(user.role) ? 'active' : 'inactive',
        adQuota: {
          monthly: ['admin','super_admin'].includes(user.role) ? 9999 : 1,
          used: 0,
          resetDate: getNextResetDate()
        },
        features: {
          featuredAds: ['admin','super_admin'].includes(user.role),
          analytics: ['admin','super_admin'].includes(user.role),
          prioritySupport: ['admin','super_admin'].includes(user.role),
          photoLimit: ['admin','super_admin'].includes(user.role) ? 20 : 1,
          adDuration: ['admin','super_admin'].includes(user.role) ? 90 : 30
        }
      }
      await user.save()
    }

    const subscription = user.marketplaceSubscription

    // Sanitize invalid tier values (e.g., legacy 'unlimited') before any save
    const allowedTiers = new Set(['free','silver','gold','platinum'])
    if (!allowedTiers.has(subscription.tier as string)) {
      subscription.tier = user.role === 'super_admin' ? 'platinum' : 'free'
      subscription.status = subscription.status || (subscription.tier === 'platinum' ? 'active' : 'inactive')
      if (!subscription.adQuota) {
        subscription.adQuota = { monthly: subscription.tier === 'platinum' ? 9999 : 1, used: 0, resetDate: getNextResetDate() }
      }
      if (subscription.tier === 'platinum') {
        subscription.adQuota.monthly = 9999
      }
  // Persist correction so subsequent saves don't fail validation
  user.markModified('marketplaceSubscription')
  await user.save()
    }
    // Force unlimited for super_admin regardless of stored values
    if (user.role === 'super_admin') {
      subscription.tier = 'platinum'
      subscription.status = 'active'
      subscription.adQuota.monthly = 9999
      if (!subscription.features) subscription.features = { featuredAds: true, analytics: true, prioritySupport: true, photoLimit: 20, adDuration: 90 }
      subscription.features.featuredAds = true
      subscription.features.analytics = true
      subscription.features.prioritySupport = true
      subscription.features.photoLimit = 20
      subscription.features.adDuration = 90
    }
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
    let user = userId ? await User.findOne({ id: userId }) : null
    if (!user) {
      const email = (request.user as unknown as { email?: string } | undefined)?.email
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        )
      }
      user = await User.findOne({ email })
    }
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
    if (!user.marketplaceSubscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
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