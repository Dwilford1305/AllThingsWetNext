// API endpoint to clean up duplicate businesses
import { NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { Business } from '../../../../models'

export async function POST() {
  try {
    await connectDB()
    
    console.log('Cleaning up duplicate businesses...')
    
    // Remove businesses with generic names that shouldn't exist
    const genericNames = ['wetaskiwin', 'pizza']
    let deletedCount = 0
    
    for (const genericName of genericNames) {
      const result = await Business.deleteMany({ 
        name: { $regex: new RegExp(`^${genericName}$`, 'i') }
      })
      deletedCount += result.deletedCount || 0
      console.log(`Deleted ${result.deletedCount} businesses with name "${genericName}"`)
    }
    
    // Get updated count
    const remainingCount = await Business.countDocuments()
    
    return NextResponse.json({
      success: true,
      deletedCount,
      remainingBusinesses: remainingCount,
      message: `Cleaned up ${deletedCount} duplicate/invalid businesses`
    })
    
  } catch (error) {
    console.error('Error cleaning duplicates:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
