import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MarketplaceListing } from '@/models'
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