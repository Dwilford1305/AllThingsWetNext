import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { UserSession, UserActivityLog } from '@/models/auth'
import { connectDB } from '@/lib/mongodb'

// POST /api/auth/sessions/revoke { sessionId }
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    await connectDB()
    const { sessionId } = await request.json()
    if (!sessionId) return NextResponse.json({ success: false, error: 'sessionId required' }, { status: 400 })
    if (!request.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const session = await UserSession.findOne({ id: sessionId, userId: request.user.id })
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    if (!session.isActive) return NextResponse.json({ success: true, message: 'Session already inactive' })
    session.isActive = false
    await session.save()
    await UserActivityLog.create({ id: `log_${Date.now()}`, userId: request.user.id, action: 'session_revoked', details: { sessionId }, success: true })
    return NextResponse.json({ success: true, message: 'Session revoked' })
  } catch (e) {
    console.error('Revoke session error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
})
