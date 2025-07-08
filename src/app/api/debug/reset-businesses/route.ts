// API endpoint to completely reset the business database
import { NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { Business } from '../../../../models'

export async function POST() {
  try {
    await connectDB()
    
    console.log('Resetting business database...')
    
    // Delete ALL businesses
    const result = await Business.deleteMany({})
    
    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Reset complete: deleted ${result.deletedCount} businesses`
    })
    
  } catch (error) {
    console.error('Error resetting database:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
