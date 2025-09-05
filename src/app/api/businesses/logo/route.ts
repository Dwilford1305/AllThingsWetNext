import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business, BusinessAd, User } from '@/models'
import { AuthService } from '@/lib/auth'
import type { ApiResponse } from '@/types'

// Logo size limit (in bytes) - only for platinum tier
const LOGO_SIZE_LIMIT = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
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

    const formData = await request.formData()
    const businessId = formData.get('businessId') as string
    const logo = formData.get('logo') as File

    if (!businessId || !logo) {
      return NextResponse.json(
        { success: false, error: 'Business ID and logo are required' },
        { status: 400 }
      )
    }

    // Get user information to check for super admin permissions
    const user = await User.findOne({ id: decoded.userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Find business - allow super admin to access any business
    let business
    if (user.role === 'super_admin') {
      // Super admin can upload logos to any business
      business = await Business.findOne({ id: businessId })
    } else {
      // Regular users can only access businesses they own
      business = await Business.findOne({ 
        id: businessId,
        claimedByUserId: decoded.userId
      })
    }

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or not owned by user' },
        { status: 404 }
      )
    }

    // Check if business has platinum tier (logo only available for platinum, skip check for super admin)
    const tier = business.subscriptionTier || 'free'
    if (tier !== 'platinum' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Logo upload requires platinum tier' },
        { status: 403 }
      )
    }

    // Validate logo size
    if (logo.size > LOGO_SIZE_LIMIT) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Logo size exceeds ${LOGO_SIZE_LIMIT / (1024 * 1024)}MB limit` 
        },
        { status: 413 }
      )
    }

    // Validate file type
    if (!logo.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      )
    }

    // For now, we'll store the logo as base64 data URL
    // In production, you'd upload to a CDN like AWS S3, Cloudinary, etc.
    const buffer = await logo.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const logoUrl = `data:${logo.type};base64,${base64}`

    // Update business logo
    await Business.updateOne(
      { id: businessId },
      { 
        logo: logoUrl,
        updatedAt: new Date()
      }
    )

    // Update business ad with logo (only for platinum tier)
    await BusinessAd.updateOne(
      { businessId, tier: 'platinum' },
      { 
        logo: logoUrl,
        updatedAt: new Date()
      }
    )

    const response: ApiResponse<{ logoUrl: string }> = {
      success: true,
      data: { logoUrl },
      message: 'Logo uploaded successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload logo' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
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

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Find and verify business ownership
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

    // Remove logo from business
    await Business.updateOne(
      { id: businessId },
      { 
        $unset: { logo: 1 },
        updatedAt: new Date()
      }
    )

    // Remove logo from business ad
    await BusinessAd.updateOne(
      { businessId },
      { 
        $unset: { logo: 1 },
        updatedAt: new Date()
      }
    )

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Logo deleted' },
      message: 'Logo deleted successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Logo delete error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete logo' 
      },
      { status: 500 }
    )
  }
}