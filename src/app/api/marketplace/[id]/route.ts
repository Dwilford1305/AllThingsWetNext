import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MarketplaceListing } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import type { ApiResponse } from '@/types'

// Get single marketplace listing
export async function GET(
  request: NextRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    
    type ParamsMaybe = { id?: string } | Promise<{ id: string }> | undefined
    const rawParams = (context as { params?: ParamsMaybe } | undefined)?.params
    let listingId: string | undefined
    if (rawParams && typeof (rawParams as { then?: unknown }).then === 'function') {
      const awaited = await (rawParams as Promise<{ id: string }>)
      listingId = awaited.id
    } else {
      listingId = (rawParams as { id?: string } | undefined)?.id
    }
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID missing' },
        { status: 400 }
      )
    }
    
    const listing = await MarketplaceListing.findOne({ id: listingId }).lean()
    
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    const response: ApiResponse<typeof listing> = {
      success: true,
      data: listing
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get listing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch listing' 
      },
      { status: 500 }
    )
  }
}

// Update marketplace listing
async function updateListing(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    
    type ParamsMaybe = { id?: string } | Promise<{ id: string }> | undefined
    const rawParams = (context as { params?: ParamsMaybe } | undefined)?.params
    let listingId: string | undefined
    if (rawParams && typeof (rawParams as { then?: unknown }).then === 'function') {
      const awaited = await (rawParams as Promise<{ id: string }>)
      listingId = awaited.id
    } else {
      listingId = (rawParams as { id?: string } | undefined)?.id
    }
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID missing' },
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

    const listing = await MarketplaceListing.findOne({ id: listingId })
    
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check if user owns this listing
    if (listing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to modify this listing' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, category, price, condition, location, contactName, contactEmail, contactPhone, images, status } = body

    // Update fields if provided
    if (title) listing.title = title
    if (description) listing.description = description
    if (category) listing.category = category
    if (price !== undefined) listing.price = price ? parseFloat(price) : undefined
    if (condition) listing.condition = condition
    if (location) listing.location = location
    if (contactName) listing.contactName = contactName
    if (contactEmail !== undefined) listing.contactEmail = contactEmail
    if (contactPhone !== undefined) listing.contactPhone = contactPhone
    if (images) listing.images = images
    if (status) listing.status = status
    
    listing.updatedAt = new Date()
    await listing.save()

    return NextResponse.json({
      success: true,
      message: 'Listing updated successfully',
      data: listing
    })

  } catch (error) {
    console.error('Update listing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update listing' 
      },
      { status: 500 }
    )
  }
}

// Delete marketplace listing
async function deleteListing(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    
    type ParamsMaybe = { id?: string } | Promise<{ id: string }> | undefined
    const rawParams = (context as { params?: ParamsMaybe } | undefined)?.params
    let listingId: string | undefined
    if (rawParams && typeof (rawParams as { then?: unknown }).then === 'function') {
      const awaited = await (rawParams as Promise<{ id: string }>)
      listingId = awaited.id
    } else {
      listingId = (rawParams as { id?: string } | undefined)?.id
    }
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID missing' },
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

    const listing = await MarketplaceListing.findOne({ id: listingId })
    
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check if user owns this listing
    if (listing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this listing' },
        { status: 403 }
      )
    }

    // Mark as removed instead of deleting
    listing.status = 'removed'
    listing.updatedAt = new Date()
    await listing.save()

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully'
    })

  } catch (error) {
    console.error('Delete listing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete listing' 
      },
      { status: 500 }
    )
  }
}

export const PUT = withAuth(updateListing)
export const DELETE = withAuth(deleteListing)