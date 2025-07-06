import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'

export async function GET() {
  try {
    console.log('Testing database connection...')
    await connectDB()
    console.log('Database connection successful!')
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database connection test failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
