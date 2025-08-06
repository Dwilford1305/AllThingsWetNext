import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'
import { User } from '@/models/auth'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the JWT token
    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = AuthService.verifyAccessToken(token)
    } catch (_error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user info
    const user = await User.findOne({ id: decoded.userId })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find businesses claimed by this user's email
    const claimedBusinesses = await Business.find({ 
      claimedBy: user.email,
      isClaimed: true 
    }).sort({ claimedAt: -1 }).lean()

    return NextResponse.json({
      success: true,
      businesses: claimedBusinesses
    })

  } catch (error) {
    console.error('Error fetching user businesses:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
