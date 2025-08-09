import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { AuthService } from '@/lib/auth'
import { User } from '@/models/auth'
import type { ApiResponse, User as UserType, UserPreferences } from '@/types'

// GET /api/auth/me - Get current user profile
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get token from Authorization header or httpOnly cookie
    const authHeader = request.headers.get('authorization')
    let token: string | undefined
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      token = request.cookies.get('accessToken')?.value
    }
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

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

    // Find user
    const user = await User.findOne({ id: decoded.userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if account is still active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Account is suspended' },
        { status: 403 }
      )
    }

    // Return user data
    const sanitizedUser = AuthService.sanitizeUser(user.toObject())
    
    const response: ApiResponse<UserType> = {
      success: true,
      data: sanitizedUser as UserType,
      message: 'User profile retrieved successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/auth/me - Update user profile
export async function PUT(request: NextRequest) {
  try {
    await connectDB()

    // Get token from header or cookie
    const authHeader = request.headers.get('authorization')
    let token: string | undefined
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      token = request.cookies.get('accessToken')?.value
    }
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

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

    // Find user
    const user = await User.findOne({ id: decoded.userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, phone, email, preferences, profileImage } = body

    // Validate input
    const updates: Record<string, unknown> = {}
    
    if (firstName !== undefined) {
      if (!firstName.trim()) {
        return NextResponse.json(
          { success: false, error: 'First name cannot be empty' },
          { status: 400 }
        )
      }
      updates.firstName = firstName.trim()
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) {
        return NextResponse.json(
          { success: false, error: 'Last name cannot be empty' },
          { status: 400 }
        )
      }
      updates.lastName = lastName.trim()
    }

    if (phone !== undefined) {
      updates.phone = phone?.trim() || null
    }

    if (email !== undefined && email !== user.email) {
      if (!AuthService.validateEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
      
      // Check if email is already taken
      const existingUser = await User.findOne({ email: email.toLowerCase(), id: { $ne: user.id } })
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email is already taken' },
          { status: 400 }
        )
      }
      
      updates.email = email.toLowerCase()
      updates.isEmailVerified = false // Reset verification when email changes
    }

    if (profileImage !== undefined) {
      updates.profileImage = profileImage
    }

    if (preferences !== undefined) {
      // Validate preferences structure
      if (typeof preferences === 'object' && preferences !== null) {
        // Ensure all required fields are present with defaults
        const validPreferences: UserPreferences = {
          notifications: {
            email: preferences.notifications?.email ?? true,
            events: preferences.notifications?.events ?? true,
            news: preferences.notifications?.news ?? true,
            businessUpdates: preferences.notifications?.businessUpdates ?? true,
            marketing: preferences.notifications?.marketing ?? false,
          },
          privacy: {
            profileVisible: preferences.privacy?.profileVisible ?? true,
            contactInfoVisible: preferences.privacy?.contactInfoVisible ?? false,
          },
          theme: preferences.theme ?? 'system',
        }
        updates.preferences = validPreferences
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    updates.updatedAt = new Date()

    // Update user in database
    const updatedUser = await User.findOneAndUpdate(
      { id: decoded.userId },
      { $set: updates },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const sanitizedUser = AuthService.sanitizeUser(updatedUser.toObject())

    const response: ApiResponse<UserType> = {
      success: true,
      data: sanitizedUser as UserType,
      message: 'Profile updated successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Update user profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
