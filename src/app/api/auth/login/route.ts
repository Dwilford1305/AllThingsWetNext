import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { AuthService } from '@/lib/auth'
import { User, UserSession, UserActivityLog } from '@/models/auth'
import type { LoginRequest, ApiResponse, AuthSession, User as UserType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body: LoginRequest = await request.json()
    const { email, password, rememberMe = false } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!AuthService.validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.isLocked()) {
      return NextResponse.json(
        { success: false, error: 'Account is temporarily locked due to too many failed login attempts' },
        { status: 423 }
      )
    }

    // Check if account is suspended
    if (user.isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Account is suspended. Please contact support.' },
        { status: 403 }
      )
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = await AuthService.comparePassword(password, user.passwordHash)
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts()
      
      // Log failed login attempt
      await UserActivityLog.create({
        id: AuthService.generateUserId(), // reuse the generator
        userId: user.id,
        action: 'login_failed',
        details: { reason: 'invalid_password' },
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        errorMessage: 'Invalid password'
      })

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts()

    // Generate tokens
    const tokens = AuthService.generateTokens(user.toObject())

    // Create session
    const session = await UserSession.create({
      id: AuthService.generateSessionId(),
      userId: user.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      deviceInfo: {
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        device: 'web', // Could be enhanced to detect device type
        location: 'unknown' // Could be enhanced with geolocation
      },
      expiresAt: tokens.expiresAt
    })

    // Update user last login
    await User.updateOne(
      { _id: user._id },
      { 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      }
    )

    // Log successful login
    await UserActivityLog.create({
      id: AuthService.generateUserId(),
      userId: user.id,
      action: 'login_success',
      details: { 
        rememberMe,
        sessionId: session.id
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true
    })

    // Prepare response
    const sanitizedUser = AuthService.sanitizeUser(user.toObject())
    
    const response: ApiResponse<AuthSession> = {
      success: true,
      data: {
        user: sanitizedUser as UserType,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
      },
      message: 'Login successful'
    }

    // Set HTTP-only cookies for tokens if remember me is enabled
    const nextResponse = NextResponse.json(response)
    
    if (rememberMe) {
      nextResponse.cookies.set('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      })
    }

    return nextResponse

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
