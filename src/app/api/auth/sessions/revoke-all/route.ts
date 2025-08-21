import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { UserSession, UserActivityLog } from '@/models/auth'
import { connectDB } from '@/lib/mongodb'

// POST /api/auth/sessions/revoke-all { exceptCurrent?: boolean }
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    await connectDB()
    const body = await request.json().catch(() => ({}))
    const exceptCurrent = !!body.exceptCurrent
    if (!request.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const currentAccess = request.cookies.get('accessToken')?.value
    const sessions = await UserSession.find({ userId: request.user.id, isActive: true })
    let revoked = 0
    for (const s of sessions) {
      if (exceptCurrent && currentAccess && s.accessToken === currentAccess) continue
      s.isActive = false
      await s.save()
      revoked++
    }
    if (revoked > 0) {
      await UserActivityLog.create({ id: `log_${Date.now()}`, userId: request.user.id, action: 'sessions_revoked_bulk', details: { revoked, exceptCurrent }, success: true })
    }
    return NextResponse.json({ success: true, message: `Revoked ${revoked} sessions` })
  } catch (e) {
    console.error('Revoke-all sessions error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
})
