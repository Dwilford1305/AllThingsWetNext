// API endpoint to check for duplicate businesses
import { NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { Business } from '../../../../models'

export async function GET() {
  try {
    await connectDB()
    
    console.log('Checking for duplicate businesses...')
    
    // Get all businesses
    const allBusinesses = await Business.find({}).select('id name address')
    console.log(`Total businesses in database: ${allBusinesses.length}`)
    
    // Check for duplicates by name
    const nameGroups: { [key: string]: unknown[] } = {}
    allBusinesses.forEach(business => {
      const key = business.name.toLowerCase().trim()
      if (!nameGroups[key]) {
        nameGroups[key] = []
      }
      nameGroups[key].push(business)
    })
    
    // Find duplicates
    const duplicates = Object.entries(nameGroups).filter(([, businesses]) => businesses.length > 1)
    
    const duplicateInfo = duplicates.slice(0, 20).map(([name, businesses]) => ({
      name,
      count: businesses.length,
      entries: (businesses as { id: string; address: string }[]).map(b => ({ id: b.id, address: b.address }))
    }))
    
    return NextResponse.json({
      success: true,
      totalBusinesses: allBusinesses.length,
      duplicateNames: duplicates.length,
      duplicates: duplicateInfo
    })
    
  } catch (error) {
    console.error('Error checking duplicates:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
