import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'

export async function GET() {
  try {
    // Test database connection
    await connectDB()
    
    // Check environment variables
    const envCheck = {
      mongodb: !!process.env.MONGODB_URI,
      smtp: !!process.env.SMTP_HOST && !!process.env.SMTP_USER,
      admin: !!process.env.ADMIN_EMAIL,
      jwt: !!process.env.JWT_SECRET
    }
    
    const allGood = Object.values(envCheck).every(Boolean)
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {
        database: true,
        environment: envCheck,
        overall: allGood
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: false,
        overall: false
      }
    }, { status: 500 })
  }
}
