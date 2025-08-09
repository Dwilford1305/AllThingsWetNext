import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { connectDB } from '@/lib/mongodb'
import { User, UserActivityLog } from '@/models/auth'
import { verifyTOTP } from '@/lib/totp'
import { AuthService } from '@/lib/auth'

// POST /api/auth/2fa/disable { code }
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    await connectDB()
    if (!request.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { code } = await request.json()
    if (!code) return NextResponse.json({ success: false, error: 'Code required' }, { status: 400 })
    const user = await User.findOne({ id: request.user.id })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    if (!user.twoFactorEnabled || !user.twoFactorSecret) return NextResponse.json({ success: false, error: '2FA not enabled' }, { status: 400 })
    const valid = verifyTOTP(user.twoFactorSecret, code)
    if (!valid) return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 })
    user.twoFactorEnabled = false
    user.twoFactorSecret = undefined
    user.twoFactorBackupCodes = []
    await user.save()
    await UserActivityLog.create({ id: AuthService.generateUserId(), userId: user.id, action: '2fa_disabled', details: {}, success: true })
    return NextResponse.json({ success: true, message: '2FA disabled' })
  } catch (e) {
    console.error('2fa disable error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
})
