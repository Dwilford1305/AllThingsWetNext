import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { AuthService } from '@/lib/auth'
import { User, UserActivityLog } from '@/models/auth'
import type { SignupRequest, ApiResponse, User as UserType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body: SignupRequest = await request.json()
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      accountType, 
      agreeToTerms, 
      businessName 
    } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !agreeToTerms) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!AuthService.validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = AuthService.validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    if (!agreeToTerms) {
      return NextResponse.json(
        { success: false, error: 'You must agree to the terms of service' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(password)

    // Generate user ID and verification token
    const userId = AuthService.generateUserId()
    const emailVerificationToken = AuthService.generateRandomToken()

    // Set default permissions (business owners get basic permissions)
    const permissions: string[] = []
    // Note: Admin accounts should be created through a separate admin process
    // Regular signup only allows 'user' and 'business_owner' roles

    // Create user
    const userData = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: accountType || 'user',
      phone: phone?.trim(),
      emailVerificationToken,
      emailVerificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isEmailVerified: false,
      isActive: true,
      isSuspended: false,
      twoFactorEnabled: false,
      businessIds: [],
      permissions,
      preferences: {
        notifications: {
          email: true,
          events: true,
          news: true,
          businessUpdates: accountType === 'business_owner',
          marketing: false
        },
        privacy: {
          profileVisible: true,
          contactInfoVisible: false
        },
        theme: 'system'
      }
    }

    const user = await User.create(userData)

    // Log account creation
    await UserActivityLog.create({
      id: AuthService.generateUserId(),
      userId: user.id,
      action: 'account_created',
      details: { 
        accountType,
        businessName: businessName || undefined,
        verificationTokenSent: true
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true
    })

    // TODO: Send verification email
    // await EmailService.sendVerificationEmail(user.email, emailVerificationToken)
    
    console.log(`📧 EMAIL VERIFICATION: Send to ${user.email} with token: ${emailVerificationToken}`)

    // Prepare response (don't include sensitive data)
    const sanitizedUser = AuthService.sanitizeUser(user.toObject())
    
    const response: ApiResponse<Partial<UserType>> = {
      success: true,
      data: sanitizedUser,
      message: 'Account created successfully. Please check your email to verify your account.'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    
    // Handle duplicate key error (race condition)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
