import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { UserSession, UserActivityLog } from '@/models/auth'
import { withAuth } from '@/lib/auth-middleware'
import { AuthService } from '@/lib/auth'
import type { ApiResponse } from '@/types'

async function logoutHandler(request: NextRequest) {
  try {
    await connectDB()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No authorization header found' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Find and deactivate the session
    const session = await UserSession.findOneAndUpdate(
      { accessToken: token, isActive: true },
      { 
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (session) {
      // Log logout activity
      await UserActivityLog.create({
        id: AuthService.generateUserId(),
        userId: session.userId,
        action: 'logout',
        details: { 
          sessionId: session.id,
          logoutType: 'manual'
        },
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: true
      })
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Logged out successfully'
    }

    // Clear any HTTP-only cookies
    const nextResponse = NextResponse.json(response)
    nextResponse.cookies.delete('refreshToken')

    return nextResponse

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(logoutHandler)
