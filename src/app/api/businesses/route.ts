import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const letter = searchParams.get('letter') || ''
    const sort = searchParams.get('sort') || 'name'
    
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (letter && letter !== 'all') {
      query.name = { $regex: `^${letter}`, $options: 'i' }
    }

    // Build sort
    let sortObj: any = {}
    switch (sort) {
      case 'featured':
        sortObj = { 'subscription.tier': -1, featured: -1, name: 1 }
        break
      case 'rating':
        sortObj = { 'analytics.averageRating': -1, name: 1 }
        break
      case 'newest':
        sortObj = { createdAt: -1 }
        break
      default:
        sortObj = { name: 1 }
    }

    const [businesses, totalCount] = await Promise.all([
      Business.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Business.countDocuments(query)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        businesses,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        summary: {
          total: totalCount
        }
      }
    })
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
