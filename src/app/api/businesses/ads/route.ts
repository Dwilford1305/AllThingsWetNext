import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business, BusinessAd } from '@/models'
import { AuthService } from '@/lib/auth'
import type { ApiResponse, BusinessAd as BusinessAdType } from '@/types'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier')
    const businessId = searchParams.get('businessId')
    const preview = searchParams.get('preview') === 'true'

    // If requesting preview, verify authentication
    if (preview) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json(
          { success: false, error: 'Authentication required for preview' },
          { status: 401 }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const decoded = AuthService.verifyAccessToken(token)
      if (!decoded || !decoded.userId) {
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        )
      }

      if (!businessId) {
        return NextResponse.json(
          { success: false, error: 'Business ID required for preview' },
          { status: 400 }
        )
      }

      // Get business and create preview ad
      const business = await Business.findOne({ 
        id: businessId,
        claimedByUserId: decoded.userId
      })

      if (!business) {
        return NextResponse.json(
          { success: false, error: 'Business not found or not owned by user' },
          { status: 404 }
        )
      }

      const currentTier = business.subscriptionTier || 'free'
      if (currentTier === 'free') {
        return NextResponse.json(
          { success: false, error: 'Ad preview requires subscription' },
          { status: 403 }
        )
      }

      // Create preview ad object
      const previewAd = {
        id: `preview_${businessId}`,
        businessId,
        tier: currentTier,
        photo: (business.photos && business.photos[0]) || '/placeholder-image.jpg',
        logo: currentTier === 'platinum' ? business.logo : undefined,
        businessName: business.name,
        isActive: true,
        isVisible: true,
        adSize: getAdDimensions(currentTier),
        impressions: 0,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const response: ApiResponse<typeof previewAd> = {
        success: true,
        data: previewAd,
        message: 'Preview ad generated'
      }

      return NextResponse.json(response)
    }

    // Public ad serving
    const query: Record<string, unknown> = {
      isActive: true,
      isVisible: true
    }

    if (tier) {
      query.tier = tier
    }

    const ads = await BusinessAd.find(query)
      .sort({ createdAt: -1 })
      .lean()

    const response: ApiResponse<typeof ads> = {
      success: true,
      data: ads
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Ads API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch ads' 
      },
      { status: 500 }
    )
  }
}

// Helper function to get ad dimensions based on tier
function getAdDimensions(tier: string) {
  const dimensions = {
    silver: { width: 300, height: 250 },   // Medium Rectangle
    gold: { width: 728, height: 90 },      // Leaderboard
    platinum: { width: 336, height: 280 }  // Large Rectangle
  }
  return dimensions[tier as keyof typeof dimensions] || dimensions.silver
}