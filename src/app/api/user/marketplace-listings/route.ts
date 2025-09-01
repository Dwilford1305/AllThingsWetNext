import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MarketplaceListing } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import type { ApiResponse } from '@/types'

// Get current user's marketplace listings
async function getUserListings(request: AuthenticatedRequest) {
  try {
    await connectDB()
    
    const userId = request.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: Record<string, unknown> = {
      userId: userId
    }

    if (status !== 'all') {
      query.status = status
    }

    const listings = await MarketplaceListing.find(query)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()

    const response: ApiResponse<typeof listings> = {
      success: true,
      data: listings
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get user listings error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user listings' 
      },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getUserListings)