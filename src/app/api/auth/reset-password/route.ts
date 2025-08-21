import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User, UserActivityLog } from '@/models/auth'
import { AuthService } from '@/lib/auth'

// POST /api/auth/reset-password { token, newPassword }
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { token, newPassword } = await request.json()
    if (!token || !newPassword) return NextResponse.json({ success: false, error: 'Token and newPassword required' }, { status: 400 })
    const user = await User.findOne({ passwordResetToken: token, passwordResetTokenExpires: { $gt: new Date() } })
    if (!user) return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 })
    const { isValid, errors } = AuthService.validatePassword(newPassword)
    if (!isValid) return NextResponse.json({ success: false, error: errors.join(', ') }, { status: 400 })
    const passwordHash = await AuthService.hashPassword(newPassword)
    await User.updateOne({ _id: user._id }, { passwordHash, passwordResetToken: null, passwordResetTokenExpires: null })
    await UserActivityLog.create({ id: AuthService.generateUserId(), userId: user.id, action: 'password_reset', details: {}, success: true })
    return NextResponse.json({ success: true, message: 'Password reset successful' })
  } catch (e) {
    console.error('reset-password error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
