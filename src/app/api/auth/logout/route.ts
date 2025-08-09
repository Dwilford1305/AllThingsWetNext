import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { UserSession, UserActivityLog } from '@/models/auth'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { AuthService } from '@/lib/auth'
import type { ApiResponse } from '@/types'

async function logoutHandler(request: AuthenticatedRequest) {
  try {
    await connectDB()
    const accessToken = request.cookies.get('accessToken')?.value
    let session = null
    if (accessToken) {
      session = await UserSession.findOneAndUpdate(
        { accessToken, isActive: true },
        { isActive: false, updatedAt: new Date() },
        { new: true }
      )
    }
    if (session) {
      await UserActivityLog.create({
        id: AuthService.generateUserId(),
        userId: session.userId,
        action: 'logout',
        details: { sessionId: session.id, logoutType: 'manual' },
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: true
      })
    }
    const response: ApiResponse<null> = { success: true, message: 'Logged out successfully' }
    const res = NextResponse.json(response)
    res.cookies.delete('refreshToken')
    res.cookies.delete('accessToken')
    res.cookies.delete('csrfToken')
    return res
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withAuth(logoutHandler)
