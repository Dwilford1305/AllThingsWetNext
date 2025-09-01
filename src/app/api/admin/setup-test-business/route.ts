import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/auth'
import { Business } from '@/models'
import type { ApiResponse } from '@/types'

// Test business constants
const TEST_BUSINESS_ID = 'test-platinum-business-admin'
const TEST_BUSINESS_DATA = {
  id: TEST_BUSINESS_ID,
  name: 'Test Platinum Business',
  description: 'Test business for super admin to test all platinum subscription features. This business has full access to premium features for testing purposes.',
  category: 'professional' as const,
  address: '123 Test Street, Wetaskiwin, AB T9A 0A1',
  phone: '(780) 555-0123',
  email: 'test@testbusiness.example.com',
  website: 'https://testbusiness.example.com',
  contact: 'Test Business Manager',
  
  // Premium subscription settings
  subscriptionTier: 'platinum' as const,
  subscriptionStatus: 'active' as const,
  isClaimed: true,
  
  // Premium features enabled
  logo: null, // Can be uploaded during testing
  photos: [],
  hours: {
    monday: '9:00 AM - 5:00 PM',
    tuesday: '9:00 AM - 5:00 PM', 
    wednesday: '9:00 AM - 5:00 PM',
    thursday: '9:00 AM - 5:00 PM',
    friday: '9:00 AM - 5:00 PM',
    saturday: '10:00 AM - 3:00 PM',
    sunday: 'Closed'
  },
  socialMedia: {
    facebook: 'https://facebook.com/testbusiness',
    instagram: 'https://instagram.com/testbusiness', 
    twitter: 'https://twitter.com/testbusiness',
    linkedin: 'https://linkedin.com/company/testbusiness'
  },
  specialOffers: [
    {
      title: 'Test Special Offer',
      description: 'This is a test special offer to demonstrate platinum features.',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  ],
  
  // Analytics placeholder
  analytics: {
    views: 0,
    clicks: 0,
    callClicks: 0,
    websiteClicks: 0
  },
  
  // Unlimited job posting quota for platinum
  jobPostingQuota: {
    monthly: 9999, // Unlimited
    used: 0,
    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
  },
  
  // Basic fields
  featured: true, // Premium placement
  verified: true,
  rating: 5.0,
  reviewCount: 1,
  services: ['Testing', 'Premium Features', 'Business Management'],
  tags: ['test', 'platinum', 'premium', 'demo']
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Check if request is from super admin
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      )
    }

    // For now, allow setup key to provision test business
    const setupKey = process.env.SUPER_ADMIN_SETUP_KEY
    const { setupPassword } = await request.json()

    if (setupKey && setupPassword !== setupKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid setup key' },
        { status: 403 }
      )
    }

    // Find super admin user
    const superAdmin = await User.findOne({ role: 'super_admin' })
    if (!superAdmin) {
      return NextResponse.json(
        { success: false, error: 'Super admin not found. Please create super admin first.' },
        { status: 404 }
      )
    }

    // Set subscription dates (1 year from now)
    const now = new Date()
    const subscriptionEnd = new Date(now)
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1)

    // Check if test business already exists
    const existingBusiness = await Business.findOne({ id: TEST_BUSINESS_ID })
    
    let business
    if (existingBusiness) {
      // Update existing business to ensure it has platinum subscription
      business = await Business.findOneAndUpdate(
        { id: TEST_BUSINESS_ID },
        {
          ...TEST_BUSINESS_DATA,
          subscriptionStart: now,
          subscriptionEnd: subscriptionEnd,
          claimedBy: superAdmin.email,
          claimedByUserId: superAdmin.id,
          claimedAt: now,
          updatedAt: now
        },
        { new: true }
      )
      
      console.log(`✅ Updated existing test business for super admin: ${superAdmin.email}`)
    } else {
      // Create new test business
      business = new Business({
        ...TEST_BUSINESS_DATA,
        subscriptionStart: now,
        subscriptionEnd: subscriptionEnd,
        claimedBy: superAdmin.email,
        claimedByUserId: superAdmin.id,
        claimedAt: now,
        createdAt: now,
        updatedAt: now
      })
      
      await business.save()
      console.log(`🏢 Created new test business for super admin: ${superAdmin.email}`)
    }

    // Add business to super admin's businessIds if not already there
    if (!superAdmin.businessIds.includes(TEST_BUSINESS_ID)) {
      await User.findOneAndUpdate(
        { id: superAdmin.id },
        { 
          $addToSet: { businessIds: TEST_BUSINESS_ID },
          updatedAt: now
        }
      )
      console.log(`🔗 Linked test business to super admin account`)
    }

    const response: ApiResponse<typeof business> = {
      success: true,
      data: business,
      message: 'Test platinum business provisioned successfully for super admin'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Test business setup error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to setup test business' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await connectDB()

    // Check if test business exists
    const testBusiness = await Business.findOne({ id: TEST_BUSINESS_ID })
    const superAdmin = await User.findOne({ role: 'super_admin' })

    return NextResponse.json({
      success: true,
      message: 'Test business setup status',
      data: {
        testBusinessExists: !!testBusiness,
        superAdminExists: !!superAdmin,
        testBusiness: testBusiness ? {
          id: testBusiness.id,
          name: testBusiness.name,
          subscriptionTier: testBusiness.subscriptionTier,
          subscriptionStatus: testBusiness.subscriptionStatus,
          isClaimed: testBusiness.isClaimed,
          claimedBy: testBusiness.claimedBy
        } : null
      }
    })

  } catch (error) {
    console.error('Test business status error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check test business status' 
      },
      { status: 500 }
    )
  }
}