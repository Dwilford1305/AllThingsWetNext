import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { NewsArticle } from '@/models'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const featured = searchParams.get('featured') === 'true'
    const category = searchParams.get('category')

    const query: Record<string, unknown> = {}
    if (featured) query.featured = true
    if (category) query.category = category

    const news = await NewsArticle.find(query)
      .limit(limit)
      .sort({ publishedAt: -1 }) // Sort by publish date descending (newest first)
      .lean()

    const response: ApiResponse<typeof news> = {
      success: true,
      data: news
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch news' 
      },
      { status: 500 }
    )
  }
}
