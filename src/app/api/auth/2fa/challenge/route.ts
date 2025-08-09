import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User, UserActivityLog, UserSession } from '@/models/auth'
import { verifyTOTP } from '@/lib/totp'
import { AuthService } from '@/lib/auth'
import type { ApiResponse, User as UserType } from '@/types'

// POST /api/auth/2fa/challenge { pendingToken, code }
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { pendingToken, code } = await request.json()
    if (!pendingToken || !code) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    // Decode pending token (JWT) containing user id and marker 2fa_pending
  const decoded = AuthService.verifyToken(pendingToken)
    if (!decoded || decoded.purpose !== '2fa_pending' || !decoded.sub) {
      return NextResponse.json({ success: false, error: 'Invalid pending token' }, { status: 400 })
    }
    const user = await User.findOne({ id: decoded.sub })
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ success: false, error: '2FA not enabled' }, { status: 400 })
    }
    // Accept either TOTP or backup code
    let codeValid = verifyTOTP(user.twoFactorSecret, code)
    if (!codeValid && user.twoFactorBackupCodes?.length) {
      // Compare hashed backup codes
      for (const hashed of user.twoFactorBackupCodes) {
        if (await AuthService.comparePassword(code, hashed)) {
          codeValid = true
          // remove used backup code
          user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter((h: string) => h !== hashed)
          await user.save()
          break
        }
      }
    }
    if (!codeValid) return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 })

    // Generate full tokens
    const tokens = AuthService.generateTokens(user.toObject())
    const session = await UserSession.create({
      id: AuthService.generateSessionId(),
      userId: user.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      deviceInfo: {
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        device: 'web',
        location: 'unknown'
      },
      expiresAt: tokens.expiresAt
    })

    if (tokens.refreshJti) {
      await AuthService.markRefreshUsed({ jti: tokens.refreshJti, userId: user.id, ip: request.headers.get('x-forwarded-for') || undefined, userAgent: request.headers.get('user-agent') || undefined, reason: 'rotated' })
    }

    await UserActivityLog.create({ id: AuthService.generateUserId(), userId: user.id, action: 'login_success', details: { sessionId: session.id, twoFactor: true }, success: true })

  const sanitizedUser = AuthService.sanitizeUser(user.toObject()) as Partial<UserType>
  const response: ApiResponse<{ user: Partial<UserType>; accessToken: string; expiresAt: Date }> = { success: true, data: { user: sanitizedUser, accessToken: tokens.accessToken, expiresAt: tokens.expiresAt }, message: 'Login successful' }
    const res = NextResponse.json(response)
    res.cookies.set('accessToken', tokens.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 })
    res.cookies.set('refreshToken', tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 })
    const csrfToken = AuthService.generateSessionId()
    res.cookies.set('csrfToken', csrfToken, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 })
    return res
  } catch (e) {
    console.error('2fa challenge error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
