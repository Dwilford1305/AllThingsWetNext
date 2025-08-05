import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { AuthService } from '@/lib/auth'
import { User } from '@/models/auth'
import type { ApiResponse, User as UserType } from '@/types'

// GET /api/auth/me - Get current user profile
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No valid authorization token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    let decoded
    try {
      decoded = AuthService.verifyAccessToken(token)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 401 }
      )
    }

    // Find user
    const user = await User.findOne({ id: decoded.userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if account is still active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Account is suspended' },
        { status: 403 }
      )
    }

    // Return user data
    const sanitizedUser = AuthService.sanitizeUser(user.toObject())
    
    const response: ApiResponse<UserType> = {
      success: true,
      data: sanitizedUser as UserType,
      message: 'User profile retrieved successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
