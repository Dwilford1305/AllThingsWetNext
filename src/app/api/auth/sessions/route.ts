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

    const data = sessions.map(s => ({
      id: s.id,
      deviceInfo: s.deviceInfo,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      isActive: s.isActive,
      current: !!(currentAccess && s.accessToken === currentAccess)
    }))

    // If authenticated via Auth0 (no legacy access token), surface a synthetic current session for the UI
    const isAuth0Provider = (
      reqSession: unknown
    ): reqSession is { provider: 'auth0' } =>
      !!reqSession && typeof reqSession === 'object' && (reqSession as { provider?: unknown }).provider === 'auth0'

    if (isAuth0Provider(request.session)) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
      // Put the synthetic session at the top
      data.unshift({
        id: 'auth0_current',
        // Shape matches UI's getBrowserName parser: deviceInfo.ua.browser.name
        deviceInfo: { ua: { browser: { name: 'This device' } }, ip },
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: undefined,
        isActive: true,
        current: true,
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('List sessions error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
})
