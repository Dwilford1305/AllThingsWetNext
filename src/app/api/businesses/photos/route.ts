import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business, BusinessAd } from '@/models'
import { AuthService } from '@/lib/auth'
import type { ApiResponse } from '@/types'
import { v4 as uuidv4 } from 'uuid'

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
    const photo = formData.get('photo') as File

    if (!businessId || !photo) {
      return NextResponse.json(
        { success: false, error: 'Business ID and photo are required' },
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

    // Check if business has eligible tier
    const tier = business.subscriptionTier || 'free'
    if (tier === 'free') {
      return NextResponse.json(
        { success: false, error: 'Photo upload requires silver tier or higher' },
        { status: 403 }
      )
    }

    // Validate photo size
    const maxSize = PHOTO_SIZE_LIMITS[tier as keyof typeof PHOTO_SIZE_LIMITS]
    if (photo.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Photo size exceeds ${maxSize / (1024 * 1024)}MB limit for ${tier} tier` 
        },
        { status: 413 }
      )
    }

    // Validate file type
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      )
    }

    // For now, we'll store the photo as base64 data URL
    // In production, you'd upload to a CDN like AWS S3, Cloudinary, etc.
    const buffer = await photo.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const photoUrl = `data:${photo.type};base64,${base64}`

    // Update business photos array
    const currentPhotos = business.photos || []
    currentPhotos.push(photoUrl)
    
    await Business.updateOne(
      { id: businessId },
      { 
        photos: currentPhotos,
        updatedAt: new Date()
      }
    )

    // Create or update business ad
    const adDimensions = AD_DIMENSIONS[tier as keyof typeof AD_DIMENSIONS]
    const adId = `ad_${businessId}_${tier}`
    
    await BusinessAd.findOneAndUpdate(
      { businessId, tier },
      {
        id: adId,
        businessId,
        tier,
        photo: photoUrl,
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
      data: { photoUrl },
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