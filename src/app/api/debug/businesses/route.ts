import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'

export async function GET(_request: NextRequest) {
  try {
    await connectDB()

    // Get all businesses without any filters to see the raw data
    const totalCount = await Business.countDocuments({})
    
    // Get some sample businesses
    const businesses = await Business.find({})
      .limit(20)
      .lean()

    // Get all distinct categories
    const categories = await Business.distinct('category')
    
    // Check for duplicates
    const duplicateNames = await Business.aggregate([
      { $group: { _id: "$name", count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 10 }
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalCount,
        categories,
        duplicates: duplicateNames,
        sampleBusinesses: businesses.map(b => ({
          id: b.id,
          name: b.name,
          category: b.category,
          address: b.address,
          description: b.description?.substring(0, 100) + '...'
        }))
      }
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch debug data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
