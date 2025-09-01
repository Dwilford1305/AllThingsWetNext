import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/auth'
import { hash } from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

// Password validation
function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// One-time super admin setup endpoint
// This should be disabled in production after initial setup
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Check if any super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' })
    if (existingSuperAdmin) {
      return NextResponse.json({
        error: 'Super admin already exists. This endpoint is disabled.'
      }, { status: 403 })
    }

    // Only allow this in development or with a special setup key
    const setupKey = process.env.SUPER_ADMIN_SETUP_KEY
    const { setupPassword, email, password, firstName, lastName } = await request.json()

    // Verify setup key (you can set this in your .env.local)
    if (setupKey && setupPassword !== setupKey) {
      return NextResponse.json({
        error: 'Invalid setup key'
      }, { status: 403 })
    }

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({
        error: 'Email, password, firstName, and lastName are required'
      }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json({
        error: 'Password validation failed: ' + passwordValidation.errors.join(', ')
      }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({
        error: 'User with this email already exists'
      }, { status: 400 })
    }

    // Create super admin user
    const userId = `user_${uuidv4()}`
    const passwordHash = await hash(password, 12)

    const superAdmin = new User({
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role: 'super_admin',
      isEmailVerified: true, // Auto-verify super admin
      verificationStatus: 'verified',
      permissions: [
        'manage_users',
        'manage_businesses', 
        'manage_content',
        'manage_scrapers',
        'view_analytics',
        'manage_payments',
        'system_settings',
        'super_admin'
      ],
      marketplaceSubscription: {
        tier: 'unlimited',
        status: 'active',
        adQuota: {
          monthly: 9999,
          used: 0,
          resetDate: new Date()
        },
        features: {
          featuredAds: true,
          analytics: true,
          prioritySupport: true,
          photoLimit: 99,
          adDuration: 365
        }
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await superAdmin.save()

    // Log the creation
    console.log(`🔐 Super Admin Created: ${email} (${firstName} ${lastName})`)

    return NextResponse.json({
      message: 'Super admin account created successfully',
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        role: 'super_admin'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Super admin setup error:', error)
    return NextResponse.json({
      error: 'Failed to create super admin account'
    }, { status: 500 })
  }
}

// Get setup status
export async function GET() {
  try {
    await connectDB()
    
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' })
    
    return NextResponse.json({
      setupRequired: !existingSuperAdmin,
      hasSuperAdmin: !!existingSuperAdmin
    })
    
  } catch (error) {
    console.error('Setup status check error:', error)
    return NextResponse.json({
      error: 'Failed to check setup status'
    }, { status: 500 })
  }
}
