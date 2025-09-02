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
    let effectiveUserId = userId
    if (!effectiveUserId) {
      const email = (request.user as unknown as { email?: string } | undefined)?.email
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        )
      }
      // Load user by email to get their id
      const { User } = await import('@/models/auth')
      const dbUser = await User.findOne({ email })
      if (!dbUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }
      effectiveUserId = dbUser.id
    }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

  const query: Record<string, unknown> = { userId: effectiveUserId }

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