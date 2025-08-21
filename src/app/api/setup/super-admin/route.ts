import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/auth'
import { AuthService } from '@/lib/auth'

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
    if (!AuthService.validatePassword(password)) {
      return NextResponse.json({
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
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
    const userId = AuthService.generateUserId()
    const passwordHash = await AuthService.hashPassword(password)

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
