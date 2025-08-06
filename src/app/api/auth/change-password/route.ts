import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { AuthService } from '@/lib/auth'
import { User } from '@/models/auth'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No valid authorization token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    let decoded
    try {
      decoded = AuthService.verifyAccessToken(token)
    } catch (_error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (!AuthService.validatePassword(newPassword)) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' },
        { status: 400 }
      )
    }

    // Find user
    const user = await User.findOne({ id: decoded.userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await AuthService.comparePassword(currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const newPasswordHash = await AuthService.hashPassword(newPassword)

    // Update password
    await User.updateOne(
      { id: decoded.userId },
      { 
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    )

    const response: ApiResponse<Record<string, never>> = {
      success: true,
      message: 'Password changed successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
