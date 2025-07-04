import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const featured = searchParams.get('featured') === 'true'
    const verified = searchParams.get('verified') === 'true'
    const category = searchParams.get('category')

    const query: Record<string, unknown> = {}
    if (featured) query.featured = true
    if (verified) query.verified = true
    if (category) query.category = category

    const businesses = await Business.find(query)
      .limit(limit)
      .sort({ rating: -1, reviewCount: -1 }) // Sort by rating and review count
      .lean()

    const response: ApiResponse<typeof businesses> = {
      success: true,
      data: businesses
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Businesses API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch businesses' 
      },
      { status: 500 }
    )
  }
}
