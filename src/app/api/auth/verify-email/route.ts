import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User, UserActivityLog } from '@/models/auth'
import { AuthService } from '@/lib/auth'
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit'

// POST /api/auth/verify-email { token }
export async function POST(request: NextRequest) {
  try {
    await connectDB()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rl = rateLimit(`emailVerify:${clientIp}`, 15, 60 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ success: false, error: 'Too many attempts' }, { status: 429, headers: rateLimitResponse(rl.remaining, rl.resetAt) })
  const { token } = await request.json()
    if (!token) return NextResponse.json({ success: false, error: 'Token required' }, { status: 400 })
    const user = await User.findOne({ emailVerificationToken: token, emailVerificationTokenExpires: { $gt: new Date() } })
    if (!user) return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 })
    await User.updateOne({ _id: user._id }, { isEmailVerified: true, emailVerificationToken: null, emailVerificationTokenExpires: null })
    await UserActivityLog.create({ id: AuthService.generateUserId(), userId: user.id, action: 'email_verified', details: {}, success: true })
    return NextResponse.json({ success: true, message: 'Email verified successfully' })
  } catch (e) {
    console.error('verify-email error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
