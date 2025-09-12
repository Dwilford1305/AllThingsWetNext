import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business, BusinessAd, User } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { AuthService } from '@/lib/auth'
import type { ApiResponse } from '@/types'

// Photo size limits based on tier (in bytes)
const PHOTO_SIZE_LIMITS = {
  silver: 2 * 1024 * 1024, // 2MB
  gold: 5 * 1024 * 1024,   // 5MB
  platinum: 10 * 1024 * 1024 // 10MB
}

// Ad dimensions based on tier (in pixels)
const AD_DIMENSIONS = {
  silver: { width: 300, height: 250 },   // Medium Rectangle
  gold: { width: 728, height: 90 },      // Leaderboard
  platinum: { width: 336, height: 280 }  // Large Rectangle
}

async function uploadBusinessPhoto(request: AuthenticatedRequest) {
  try {
    await connectDB()

    // Handle both FormData (legacy) and JSON (marketplace-style base64) requests
    const contentType = request.headers.get('content-type')
    let businessId: string
    let photoData: string
    let photoSize: number

    if (contentType?.includes('application/json')) {
      // New marketplace-style base64 approach
      const body = await request.json()
      businessId = body.businessId
      photoData = body.photoData

      if (!businessId || !photoData) {
        return NextResponse.json(
          { success: false, error: 'Business ID and photo data are required' },
          { status: 400 }
        )
      }

      // Validate base64 format
      if (!photoData.startsWith('data:image/')) {
        return NextResponse.json(
          { success: false, error: 'Invalid image format' },
          { status: 400 }
        )
      }

      // Estimate size from base64 (base64 is ~1.37x larger than original)
      const base64Data = photoData.split(',')[1] || ''
      photoSize = Math.floor((base64Data.length * 3) / 4) // Convert base64 length to bytes
    } else {
      // Legacy FormData approach
      const formData = await request.formData()
      businessId = formData.get('businessId') as string
      const photo = formData.get('photo') as File

      if (!businessId || !photo) {
        return NextResponse.json(
          { success: false, error: 'Business ID and photo are required' },
          { status: 400 }
        )
      }

      // Validate file type
      if (!photo.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: 'File must be an image' },
          { status: 400 }
        )
      }

      // Convert to base64
      const buffer = await photo.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      photoData = `data:${photo.type};base64,${base64}`
      photoSize = photo.size
    }

    // Get authenticated user from middleware
    const userId = request.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User authentication failed' },
        { status: 401 }
      )
    }

    // Get full user information for permission checking
    const user = await User.findOne({ id: userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Find business - allow super admin to access any business
    let business;
    if (user.role === 'super_admin') {
      // Super admin can upload photos to any business
      business = await Business.findOne({ id: businessId })
    } else {
      // Regular users can only access businesses they own
      business = await Business.findOne({ 
        id: businessId,
        claimedByUserId: user.id
      })
    }

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or not owned by user' },
        { status: 404 }
      )
    }

    // Check if business has eligible tier (skip check for super admin)
    const tier = business.subscriptionTier || 'free'
    if (tier === 'free' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Photo upload requires silver tier or higher' },
        { status: 403 }
      )
    }

    // Validate photo size (use platinum limits for super admin)
    const effectiveTier = user.role === 'super_admin' ? 'platinum' : tier
    const maxSize = PHOTO_SIZE_LIMITS[effectiveTier as keyof typeof PHOTO_SIZE_LIMITS]
    if (photoSize > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Photo size exceeds ${maxSize / (1024 * 1024)}MB limit for ${tier} tier` 
        },
        { status: 413 }
      )
    }

    // Update business photos array
    const currentPhotos = business.photos || []
    currentPhotos.push(photoData)
    
    await Business.updateOne(
      { id: businessId },
      { 
        photos: currentPhotos,
        updatedAt: new Date()
      }
    )

    // Create or update business ad (use effective tier for super admin)
    const adDimensions = AD_DIMENSIONS[effectiveTier as keyof typeof AD_DIMENSIONS]
    const adId = `ad_${businessId}_${effectiveTier}`
    
    await BusinessAd.findOneAndUpdate(
      { businessId, tier: effectiveTier },
      {
        id: adId,
        businessId,
        tier: effectiveTier,
        photo: photoData,
        businessName: business.name,
        adSize: adDimensions,
        isActive: true,
        isVisible: true,
        updatedAt: new Date()
      },
      { 
        upsert: true,
        new: true
      }
    )

    const response: ApiResponse<{ photoUrl: string }> = {
      success: true,
      data: { photoUrl: photoData },
      message: 'Photo uploaded successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload photo' 
      },
      { status: 500 }
    )
  }
}

// Export POST with authentication middleware
export const POST = withAuth(uploadBusinessPhoto)

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
    const photoIndex = searchParams.get('photoIndex')

    if (!businessId || photoIndex === null) {
      return NextResponse.json(
        { success: false, error: 'Business ID and photo index are required' },
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
    let business;
    if (user.role === 'super_admin') {
      // Super admin can delete photos from any business
      business = await Business.findOne({ id: businessId })
    } else {
      // Regular users can only access businesses they own
      business = await Business.findOne({ 
        id: businessId,
        claimedByUserId: user.id
      })
    }

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or not owned by user' },
        { status: 404 }
      )
    }

    const photos = business.photos || []
    const index = parseInt(photoIndex)
    
    if (index < 0 || index >= photos.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid photo index' },
        { status: 400 }
      )
    }

    // Remove photo from array
    photos.splice(index, 1)
    
    await Business.updateOne(
      { id: businessId },
      { 
        photos,
        updatedAt: new Date()
      }
    )

    // Update business ad if this was the primary photo
    if (index === 0 && photos.length > 0) {
      // Use next photo as primary
      await BusinessAd.updateOne(
        { businessId },
        { 
          photo: photos[0],
          updatedAt: new Date()
        }
      )
    } else if (photos.length === 0) {
      // No photos left, deactivate ad
      await BusinessAd.updateOne(
        { businessId },
        { 
          isActive: false,
          updatedAt: new Date()
        }
      )
    }

    const response: ApiResponse<{ photosCount: number }> = {
      success: true,
      data: { photosCount: photos.length },
      message: 'Photo deleted successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Photo delete error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete photo' 
      },
      { status: 500 }
    )
  }
}