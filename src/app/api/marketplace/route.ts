import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MarketplaceListing } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { v4 as uuidv4 } from 'uuid'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const featured = searchParams.get('featured') === 'true'
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'active'

    const query: Record<string, unknown> = {
      status: status,
      expiresAt: { $gte: new Date() } // Only show non-expired listings
    }
    if (featured) query.featured = true
    if (category) query.category = category

    const listings = await MarketplaceListing.find(query)
      .limit(limit)
      .sort({ createdAt: -1 }) // Sort by creation date descending (newest first)
      .lean()

    const response: ApiResponse<typeof listings> = {
      success: true,
      data: listings
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Marketplace API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch marketplace listings' 
      },
      { status: 500 }
    )
  }
}

// Create new marketplace listing with quota check
async function createListing(request: AuthenticatedRequest) {
  try {
    await connectDB()
    
    const userId = request.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, category, price, condition, location, contactName, contactEmail, contactPhone, images } = body

    // Validate required fields
    if (!title || !description || !category || !location || !contactName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check quota by calling the quota API internally
    const quotaResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/marketplace/quota`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('authorization') || '',
      }
    })

    if (!quotaResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to check quota' },
        { status: 500 }
      )
    }

    const quotaData = await quotaResponse.json()
    if (!quotaData.success || !quotaData.data.quota.hasQuotaAvailable) {
      return NextResponse.json(
        { success: false, error: 'Ad quota exceeded for this month. Please upgrade your subscription or wait for quota reset.' },
        { status: 403 }
      )
    }

    // Use quota by calling the quota API internally
    const useQuotaResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/marketplace/quota`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('authorization') || '',
        'Content-Type': 'application/json'
      }
    })

    if (!useQuotaResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to allocate quota for listing' },
        { status: 500 }
      )
    }

    // Create the listing
    const listingId = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // Default 30 days

    const listing = new MarketplaceListing({
      id: listingId,
      title,
      description,
      category,
      price: price ? parseFloat(price) : undefined,
      condition,
      location,
      contactName,
      contactEmail,
      contactPhone,
      images: images || [],
      userId,
      expiresAt,
      status: 'active',
      featured: false,
      isReported: false,
      reportCount: 0
    })

    await listing.save()

    return NextResponse.json({
      success: true,
      message: 'Marketplace listing created successfully',
      data: listing
    })

  } catch (error) {
    console.error('Create listing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create listing' 
      },
      { status: 500 }
    )
  }
}

export const POST = withAuth(createListing)