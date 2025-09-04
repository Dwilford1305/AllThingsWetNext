import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { BusinessAd } from '@/models'
import { AuthService } from '@/lib/auth'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = AuthService.verifyAccessToken(token)
    if (!decoded || !decoded.userId || decoded.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier')

    const query: Record<string, unknown> = {}
    if (tier) {
      query.tier = tier
    }

    const ads = await BusinessAd.find(query)
      .sort({ tier: 1, createdAt: -1 })
      .lean()

    const response: ApiResponse<typeof ads> = {
      success: true,
      data: ads
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Admin ads API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch ads' 
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB()

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = AuthService.verifyAccessToken(token)
    if (!decoded || !decoded.userId || decoded.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { adId, isVisible } = body

    if (!adId || typeof isVisible !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Ad ID and visibility status are required' },
        { status: 400 }
      )
    }

    const ad = await BusinessAd.findOneAndUpdate(
      { id: adId },
      { 
        isVisible,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!ad) {
      return NextResponse.json(
        { success: false, error: 'Ad not found' },
        { status: 404 }
      )
    }

    const response: ApiResponse<typeof ad> = {
      success: true,
      data: ad,
      message: `Ad ${isVisible ? 'shown' : 'hidden'} successfully`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Admin ad visibility update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update ad visibility' 
      },
      { status: 500 }
    )
  }
}