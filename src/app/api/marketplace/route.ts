import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MarketplaceListing, User } from '@/models'
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

    // Import cache utilities here to avoid circular dependencies
    const { default: cache, generateCacheKey } = await import('@/lib/cache')
    const { getCacheHeaders, QueryCacheSettings } = await import('@/lib/cache-config')

    // Generate cache key
    const cacheKey = generateCacheKey('api:marketplace', {
      limit,
      featured: featured || false,
      category: category || 'all',
      status
    })

    // Try to get from cache
    const cached = cache.get<typeof listings>(cacheKey)
    if (cached) {
      const response: ApiResponse<typeof cached> = {
        success: true,
        data: cached
      }
      return NextResponse.json(response, {
        headers: getCacheHeaders('DYNAMIC')
      })
    }

    const query: Record<string, unknown> = {
      status: status,
      expiresAt: { $gte: new Date() } // Only show non-expired listings
    }
    if (featured) query.featured = true
    if (category) query.category = category

    const listings = await MarketplaceListing.find(query)
      .limit(limit)
      .sort({ featured: -1, createdAt: -1 }) // Featured first, then newest
      .select('-__v') // Exclude version field
      .lean()

    // Store in cache
    cache.set(cacheKey, listings, QueryCacheSettings.MARKETPLACE.ttl)

    const response: ApiResponse<typeof listings> = {
      success: true,
      data: listings
    }

    return NextResponse.json(response, {
      headers: getCacheHeaders('DYNAMIC')
    })
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
    
    // Resolve user from id or email (supports Auth0 cookie sessions)
  let userId = request.user?.id
  let userDoc: { id: string; firstName?: string; username?: string } | null = null
    if (!userId) {
      const email = (request.user as unknown as { email?: string } | undefined)?.email
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        )
      }
  userDoc = await User.findOne({ email })
      if (!userDoc) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }
      userId = userDoc.id
    } else {
  userDoc = await User.findOne({ id: userId })
    }

    const body = await request.json()
  const { title, description, category, price, condition, location, contactName, contactEmail, contactPhone, images } = body

  // Validate required fields (contactName is derived server-side)
  if (!title || !description || !category || !location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Build base URL from the incoming request to preserve domain/cookies
    const baseUrl = request.nextUrl.origin

    // Forward cookies and auth/CSRF headers for internal calls
    const forwardHeaders: Record<string, string> = {}
    const authHeader = request.headers.get('authorization')
    if (authHeader) forwardHeaders['Authorization'] = authHeader
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) forwardHeaders['Cookie'] = cookieHeader
    const csrfHeader = request.headers.get('x-csrf-token')
    if (csrfHeader) forwardHeaders['X-CSRF-Token'] = csrfHeader

    // Check quota by calling the quota API internally
    const quotaResponse = await fetch(`${baseUrl}/api/marketplace/quota`, {
      method: 'GET',
      headers: forwardHeaders
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
  const useQuotaResponse = await fetch(`${baseUrl}/api/marketplace/quota`, {
      method: 'POST',
      headers: { ...forwardHeaders, 'Content-Type': 'application/json' }
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

    // Determine contact name from user if not provided: prefer username else first name
    const derivedContactName: string = (contactName && String(contactName).trim().length > 0)
      ? contactName
      : ((userDoc as { username?: string; firstName: string })?.username?.trim() || (userDoc?.firstName || ''))

    const listing = new MarketplaceListing({
      id: listingId,
      title,
      description,
      category,
      price: price ? parseFloat(price) : undefined,
      condition,
      location,
      contactName: derivedContactName,
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

  // Parse quota after usage to return updated info to client
  const usedQuota = await useQuotaResponse.json().catch(() => null)
  const updatedQuota = usedQuota?.data?.quota

    return NextResponse.json({
      success: true,
      message: 'Marketplace listing created successfully',
      data: {
        listing,
        quota: updatedQuota || null
      }
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