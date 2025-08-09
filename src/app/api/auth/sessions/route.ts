import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { UserSession } from '@/models/auth'
import { connectDB } from '@/lib/mongodb'

// GET /api/auth/sessions - list current user's sessions
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    await connectDB()
    if (!request.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const sessions = await UserSession.find({ userId: request.user.id }).sort({ lastUsedAt: -1 }).lean()
    const currentAccess = request.cookies.get('accessToken')?.value
    return NextResponse.json({
      success: true,
      data: sessions.map(s => ({
        id: s.id,
        deviceInfo: s.deviceInfo,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        expiresAt: s.expiresAt,
        isActive: s.isActive,
        current: currentAccess && s.accessToken === currentAccess
      }))
    })
  } catch (e) {
    console.error('List sessions error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
})
