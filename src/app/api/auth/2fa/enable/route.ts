import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { connectDB } from '@/lib/mongodb'
import { User, UserActivityLog } from '@/models/auth'
import { verifyTOTP, generateBackupCodes } from '@/lib/totp'
import { AuthService } from '@/lib/auth'

// POST /api/auth/2fa/enable { code }
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    await connectDB()
    if (!request.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { code } = await request.json()
    if (!code) return NextResponse.json({ success: false, error: 'Code required' }, { status: 400 })
    const user = await User.findOne({ id: request.user.id })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    if (user.twoFactorEnabled) return NextResponse.json({ success: false, error: '2FA already enabled' }, { status: 400 })
    if (!user.twoFactorTempSecret || !user.twoFactorPendingUntil || user.twoFactorPendingUntil < new Date()) {
      return NextResponse.json({ success: false, error: 'No active 2FA setup session' }, { status: 400 })
    }
    if (!verifyTOTP(user.twoFactorTempSecret, code)) {
      return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 })
    }
    const backupCodesPlain = generateBackupCodes(8)
    const backupCodesHashed = await Promise.all(backupCodesPlain.map(c => AuthService.hashPassword(c)))
    user.twoFactorSecret = user.twoFactorTempSecret
    user.twoFactorTempSecret = undefined
    user.twoFactorPendingUntil = undefined
    user.twoFactorEnabled = true
    user.twoFactorBackupCodes = backupCodesHashed
    await user.save()
    await UserActivityLog.create({ id: AuthService.generateUserId(), userId: user.id, action: '2fa_enabled', details: {}, success: true })
    return NextResponse.json({ success: true, data: { backupCodes: backupCodesPlain } })
  } catch (e) {
    console.error('2fa enable error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
})
