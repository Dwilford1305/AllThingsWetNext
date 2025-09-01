import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Event, NewsArticle, Business, JobPosting, MarketplaceListing } from '@/models'
import { User } from '@/models/auth'
import type { ApiResponse } from '@/types'

// Test business constants for super admin
const TEST_BUSINESS_ID = 'test-platinum-business-admin'

export async function ensureSuperAdminTestBusiness() {
  try {
    // Find super admin user
    const superAdmin = await User.findOne({ role: 'super_admin' })
    if (!superAdmin) {
      console.log('ℹ️ No super admin found, skipping test business creation')
      return null
    }

    // Check if test business already exists
    const existingBusiness = await Business.findOne({ id: TEST_BUSINESS_ID })
    
    const now = new Date()
    const subscriptionEnd = new Date(now)
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1) // 1 year from now

    const testBusinessData = {
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
      subscriptionStart: now,
      subscriptionEnd: subscriptionEnd,
      isClaimed: true,
      claimedBy: superAdmin.email,
      claimedByUserId: superAdmin.id,
      claimedAt: now,
      
      // Premium features enabled
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
      
      // Analytics
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
      tags: ['test', 'platinum', 'premium', 'demo'],
      
      updatedAt: now
    }

    let testBusiness
    if (existingBusiness) {
      // Update existing business to ensure it maintains platinum subscription
      testBusiness = await Business.findOneAndUpdate(
        { id: TEST_BUSINESS_ID },
        testBusinessData,
        { new: true }
      )
      console.log(`✅ Updated existing test business for super admin: ${superAdmin.email}`)
    } else {
      // Create new test business
      testBusiness = new Business({
        ...testBusinessData,
        createdAt: now
      })
      await testBusiness.save()
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

    return testBusiness
  } catch (error) {
    console.error('Error ensuring super admin test business:', error)
    return null
  }
}

export async function POST() {
  try {
    await connectDB()

    // Clear existing sample/fake data (optional - only for development)
    // Delete events without sourceUrl (these are fake sample events)
    await Event.deleteMany({
      $or: [
        { sourceUrl: { $exists: false } },
        { sourceUrl: null },
        { sourceUrl: '' },
        { id: { $in: ['ev1', 'ev2', 'ev3', 'ev4', 'ev5'] } } // Remove hardcoded sample IDs
      ]
    })
    
    // Delete news without sourceUrl (these are fake sample news)
    await NewsArticle.deleteMany({
      $or: [
        { sourceUrl: { $exists: false } },
        { sourceUrl: null },
        { sourceUrl: '' },
        { id: { $in: ['n1', 'n2', 'n3', 'n4'] } } // Remove hardcoded sample IDs
      ]
    })
    
    // Don't clear businesses as they are legitimate scraped data
    // Only clear sample businesses with hardcoded IDs
    await Business.deleteMany({
      id: { $in: ['b1', 'b2', 'b3', 'b4', 'b5'] } // Remove hardcoded sample IDs
    })

    // Ensure super admin test business exists with platinum subscription
    const testBusiness = await ensureSuperAdminTestBusiness()

    // Insert ONLY legitimate sample data that serves as examples
    // For now, don't insert any fake data - only keep real scraped data
    const [events, news, businesses] = await Promise.all([
      Event.find({}), // Just get current real events
      NewsArticle.find({}), // Just get current real news  
      Business.find({}) // Just get current real businesses
    ])

    const response: ApiResponse<{
      events: number;
      news: number;
      businesses: number;
      clearedFakeEvents: number;
      clearedFakeNews: number;
      clearedFakeBusinesses: number;
      testBusinessProvisioned: boolean;
    }> = {
      success: true,
      data: {
        events: events.length,
        news: news.length,
        businesses: businesses.length,
        clearedFakeEvents: 0, // We can add deletion counts if needed
        clearedFakeNews: 0,
        clearedFakeBusinesses: 0,
        testBusinessProvisioned: !!testBusiness
      },
      message: testBusiness ? 
        'Fake data cleared, legitimate data preserved, super admin test business ensured' :
        'Fake data cleared, legitimate data preserved'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Seed API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process database' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await connectDB()

    // Get counts of all collections
    const [eventsCount, newsCount, businessesCount, jobsCount, marketplaceCount] = await Promise.all([
      Event.countDocuments(),
      NewsArticle.countDocuments(),
      Business.countDocuments(),
      JobPosting.countDocuments(),
      MarketplaceListing.countDocuments()
    ])

    const response: ApiResponse<{
      events: number;
      news: number;
      businesses: number;
      jobs: number;
      marketplace: number;
      total: number;
    }> = {
      success: true,
      data: {
        events: eventsCount,
        news: newsCount,
        businesses: businessesCount,
        jobs: jobsCount,
        marketplace: marketplaceCount,
        total: eventsCount + newsCount + businessesCount + jobsCount + marketplaceCount
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Database status error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get database status' 
      },
      { status: 500 }
    )
  }
}
