import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User, UserActivityLog } from '@/models/auth'
import { AuthService } from '@/lib/auth'
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { EmailService } from '@/lib/emailService'

// POST /api/auth/request-email-verification
export async function POST(request: NextRequest) {
  try {
    await connectDB()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rl = rateLimit(`emailVerifyReq:${clientIp}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429, headers: rateLimitResponse(rl.remaining, rl.resetAt) })
  const { email } = await request.json()
    if (!email) return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 })
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return NextResponse.json({ success: true, message: 'If the email exists a verification link was sent.' })
    if (user.isEmailVerified) {
      return NextResponse.json({ success: true, message: 'Email already verified.' })
    }
  const token = AuthService.generateRandomToken()
  const expires = new Date(Date.now() + 60 * 60 * 1000)
  await User.updateOne({ _id: user._id }, { emailVerificationToken: token, emailVerificationTokenExpires: expires })
  await UserActivityLog.create({ id: AuthService.generateUserId(), userId: user.id, action: 'email_verification_requested', details: {}, success: true })
  // Send email (ignore failure to avoid user enumeration timing differences)
  EmailService.sendEmailVerification(user.email, token).catch(err => console.error('email verify send fail', err))
  const isDev = process.env.NODE_ENV !== 'production'
  return NextResponse.json({ success: true, message: 'Verification email sent.', ...(isDev ? { token } : {}) })
  } catch (e) {
    console.error('request-email-verification error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
