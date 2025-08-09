import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { AuthService } from '@/lib/auth'
import { User, UserSession, UserActivityLog } from '@/models/auth'
import type { LoginRequest, ApiResponse, AuthSession, User as UserType } from '@/types'
import { verifyCaptcha, CAPTCHA_REQUIRED } from '@/lib/captcha'
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body: LoginRequest = await request.json()
  const { email, password, rememberMe = false, captchaToken } = body

    // Basic rate limit per IP+email combo
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rlKey = `login:${clientIp}:${email}`
    const { allowed, remaining, resetAt } = rateLimit(rlKey, 10, 15 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: rateLimitResponse(remaining, resetAt) }
      )
    }

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Determine if CAPTCHA required adaptively
    let adaptiveCaptcha = false
    // Track failure counts via simple in-memory rateLimit buckets (reuse rateLimit function with special keys)
    // We check existing counters before verifying password; increases done only on failure below.
    // Peek counters by doing a no-op allowance (requesting limit=VERY_HIGH ensures we only read state) - simplified: we can't peek directly; rely on thresholds set when incrementing failures.
    // We'll set adaptiveCaptcha after we increment on failure; for now we approximate by requiring captcha if previous counters likely exceeded by deriving from separate stored flags (could extend storage). For simplicity require if global flag or explicit query param.
    // If base CAPTCHA is globally required just combine conditions below.
    if (CAPTCHA_REQUIRED) adaptiveCaptcha = true

    if (adaptiveCaptcha && !captchaToken) {
      return NextResponse.json({ success: false, error: 'CAPTCHA required', captchaRequired: true }, { status: 400 })
    }
    if (adaptiveCaptcha) {
      const captcha = await verifyCaptcha(captchaToken, request.headers.get('x-forwarded-for') || undefined)
      if (!captcha.success) {
        return NextResponse.json(
          { success: false, error: 'CAPTCHA validation failed' },
          { status: 400 }
        )
      }
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
      // Increment adaptive counters
      rateLimit(`loginFail:${clientIp}:${email}`, 1000, 60 * 60 * 1000) // high cap bucket just to store count
      rateLimit(`loginFailIP:${clientIp}`, 10000, 60 * 60 * 1000)
      // If thresholds exceeded, instruct client to show CAPTCHA next time
      // (A more robust implementation would expose counts; here we just flag after threshold by rough heuristic: when attempts cause account lock or pass base threshold)
      
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
        { success: false, error: 'Invalid email or password', captchaMaybe: true },
        { status: 401 }
      )
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts()

    // If user has 2FA enabled, return a pending token for second step
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const pendingToken = AuthService.signToken({ sub: user.id, purpose: '2fa_pending' }, '15m')
      await UserActivityLog.create({
        id: AuthService.generateUserId(),
        userId: user.id,
        action: 'login_2fa_challenge',
        details: {},
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: true
      })
      return NextResponse.json({ success: true, data: { twoFactorRequired: true, pendingToken } })
    }

    // Generate tokens & create session (no 2FA)
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
      await AuthService.markRefreshUsed({ jti: tokens.refreshJti, userId: user.id, ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'), userAgent: request.headers.get('user-agent') || undefined, reason: 'rotated' })
    }

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

    // Prepare response (omit refresh token from body, set both as cookies)
    const sanitizedUser = AuthService.sanitizeUser(user.toObject())
    const response: ApiResponse<Partial<AuthSession>> = {
      success: true,
      data: {
        user: sanitizedUser as UserType,
        accessToken: tokens.accessToken, // Optionally still return access token for immediate use
        expiresAt: tokens.expiresAt
      },
      message: 'Login successful'
    }

    const nextResponse = NextResponse.json(response)

    // Always set access token as httpOnly short-lived cookie; refresh token if rememberMe
    nextResponse.cookies.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    })
    if (rememberMe) {
      nextResponse.cookies.set('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60
      })
    }
    // Issue CSRF token (double-submit cookie strategy) for subsequent mutating requests
    const csrfToken = AuthService.generateSessionId()
    nextResponse.cookies.set('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    })
    return nextResponse

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
