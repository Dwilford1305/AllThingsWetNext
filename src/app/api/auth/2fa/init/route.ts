import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/auth'
import { generateBase32Secret } from '@/lib/totp'

// POST /api/auth/2fa/init
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    await connectDB()
    if (!request.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = await User.findOne({ id: request.user.id })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    if (user.twoFactorEnabled) return NextResponse.json({ success: false, error: '2FA already enabled' }, { status: 400 })
    const secret = generateBase32Secret(20)
    const otpauthUrl = `otpauth://totp/AllThingsWetaskiwinq:${encodeURIComponent(user.email)}?secret=${secret}&issuer=AllThingsWetaskiwinq`
    const pendingUntil = new Date(Date.now() + 10 * 60 * 1000)
    user.twoFactorTempSecret = secret
    user.twoFactorPendingUntil = pendingUntil
    await user.save()
    return NextResponse.json({ success: true, data: { secret, otpauthUrl, expiresAt: pendingUntil.toISOString() } })
  } catch (e) {
    console.error('2fa init error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
})
