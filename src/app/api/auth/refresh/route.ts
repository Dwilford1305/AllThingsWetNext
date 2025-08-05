import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { AuthService } from '@/lib/auth'
import { User, UserSession } from '@/models/auth'
import type { ApiResponse, AuthSession, User as UserType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { refreshToken } = body

    // Try to get refresh token from body or cookie
    const token = refreshToken || request.cookies.get('refreshToken')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Verify refresh token
    let decoded
    try {
      decoded = AuthService.verifyRefreshToken(token)
    } catch (_error) {
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Find the session
    const session = await UserSession.findOne({
      refreshToken: token,
      isActive: true,
      userId: decoded.userId
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found or expired' },
        { status: 401 }
      )
    }

    // Get user
    const user = await User.findOne({ 
      id: decoded.userId, 
      isActive: true,
      isSuspended: false
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 401 }
      )
    }

    // Generate new tokens
    const newTokens = AuthService.generateTokens(user.toObject())

    // Update session with new tokens
    await UserSession.updateOne(
      { _id: session._id },
      {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: newTokens.expiresAt,
        lastUsedAt: new Date()
      }
    )

    // Prepare response
    const sanitizedUser = AuthService.sanitizeUser(user.toObject())
    
    const response: ApiResponse<AuthSession> = {
      success: true,
      data: {
        user: sanitizedUser as UserType,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: newTokens.expiresAt
      },
      message: 'Tokens refreshed successfully'
    }

    // Update HTTP-only cookie if it was set before
    const nextResponse = NextResponse.json(response)
    
    if (request.cookies.get('refreshToken')) {
      nextResponse.cookies.set('refreshToken', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      })
    }

    return nextResponse

  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
