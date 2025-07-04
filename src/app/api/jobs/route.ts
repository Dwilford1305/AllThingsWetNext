import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { JobPosting } from '@/models'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const featured = searchParams.get('featured') === 'true'
    const category = searchParams.get('category')
    const type = searchParams.get('type')

    const query: Record<string, unknown> = {
      expiresAt: { $gte: new Date() } // Only show non-expired jobs
    }
    if (featured) query.featured = true
    if (category) query.category = category
    if (type) query.type = type

    const jobs = await JobPosting.find(query)
      .limit(limit)
      .sort({ createdAt: -1 }) // Sort by creation date descending (newest first)
      .lean()

    const response: ApiResponse<typeof jobs> = {
      success: true,
      data: jobs
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Jobs API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch jobs' 
      },
      { status: 500 }
    )
  }
}
