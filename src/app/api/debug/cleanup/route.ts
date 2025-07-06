import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    // Delete only scraped businesses (keep the seed businesses like "Main Street Cafe")
    const result = await Business.deleteMany({ 
      sourceUrl: { $exists: true },
      id: { $not: /^b\d+$/ } // Keep businesses with IDs like b1, b2 (seed data)
    })

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: `Deleted ${result.deletedCount} scraped businesses`
    })
  } catch (error) {
    console.error('Cleanup API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cleanup businesses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
