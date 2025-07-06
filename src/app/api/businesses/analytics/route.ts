import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Basic statistics for admin dashboard
    const totalBusinesses = await Business.countDocuments()
    const claimedBusinesses = await Business.countDocuments({ isClaimed: true })
    const unclaimedBusinesses = totalBusinesses - claimedBusinesses
    
    // Subscription tier breakdown
    const subscriptionStats = await Business.aggregate([
      {
        $group: {
          _id: '$subscriptionTier',
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$subscriptionTier', 'silver'] }, then: 19.99 },
                  { case: { $eq: ['$subscriptionTier', 'gold'] }, then: 39.99 },
                  { case: { $eq: ['$subscriptionTier', 'platinum'] }, then: 79.99 }
                ],
                default: 0
              }
            }
          }
        }
      }
    ])

    // Category breakdown
    const categoryStats = await Business.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          claimed: {
            $sum: {
              $cond: [{ $eq: ['$isClaimed', true] }, 1, 0]
            }
          },
          premium: {
            $sum: {
              $cond: [
                { $in: ['$subscriptionTier', ['silver', 'gold', 'platinum']] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { total: -1 } }
    ])

    // Recent activity
    const recentClaims = await Business.find({ isClaimed: true })
      .sort({ claimedAt: -1 })
      .limit(10)
      .select('name category claimedAt claimedBy subscriptionTier')

    const recentUpdates = await Business.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('name category updatedAt subscriptionTier isClaimed')

    // Revenue calculations
    const monthlyRevenue = subscriptionStats.reduce((total, tier) => {
      if (tier._id !== 'free' && tier._id !== null) {
        return total + tier.revenue
      }
      return total
    }, 0)

    const annualRevenue = monthlyRevenue * 12

    const response: ApiResponse<{
      overview: {
        totalBusinesses: number
        claimedBusinesses: number
        unclaimedBusinesses: number
        claimRate: number
        monthlyRevenue: number
        annualRevenue: number
      }
      subscriptions: typeof subscriptionStats
      categories: typeof categoryStats
      recentActivity: {
        claims: typeof recentClaims
        updates: typeof recentUpdates
      }
    }> = {
      success: true,
      data: {
        overview: {
          totalBusinesses,
          claimedBusinesses,
          unclaimedBusinesses,
          claimRate: Math.round((claimedBusinesses / totalBusinesses) * 100),
          monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
          annualRevenue: Math.round(annualRevenue * 100) / 100
        },
        subscriptions: subscriptionStats,
        categories: categoryStats,
        recentActivity: {
          claims: recentClaims,
          updates: recentUpdates
        }
      },
      message: 'Business analytics retrieved successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Business analytics API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve analytics' 
      },
      { status: 500 }
    )
  }
}
