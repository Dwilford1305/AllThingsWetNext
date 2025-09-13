import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth-middleware'
import { connectDB } from '@/lib/mongodb'
import ComprehensiveEmailService, { EmailTemplateType } from '@/lib/email/services/ComprehensiveEmailService'
import { User } from '@/models/auth'
import { v4 as uuidv4 } from 'uuid'

interface ABTestConfig {
  name: string
  description?: string
  templateType: EmailTemplateType
  variantA: {
    subject: string
    templateData: any
    weight: number // percentage 0-100
  }
  variantB: {
    subject: string
    templateData: any
    weight: number // percentage 0-100
  }
  targetAudience: {
    type: 'all_users' | 'business_owners' | 'premium_subscribers' | 'recent_signups' | 'custom'
    userIds?: string[]
  }
  duration: number // hours
  successMetric: 'open_rate' | 'click_rate' | 'conversion_rate'
  scheduledFor?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    await connectDB()

    const testConfig: ABTestConfig = await request.json()

    // Validate test configuration
    if (!testConfig.name || !testConfig.templateType) {
      return NextResponse.json(
        { error: 'Test name and template type are required' },
        { status: 400 }
      )
    }

    if (testConfig.variantA.weight + testConfig.variantB.weight !== 100) {
      return NextResponse.json(
        { error: 'Variant weights must sum to 100%' },
        { status: 400 }
      )
    }

    // Get target users (reuse logic from campaigns)
    let targetUsers: any[] = []
    
    switch (testConfig.targetAudience.type) {
      case 'all_users':
        targetUsers = await User.find({
          emailVerified: true,
          'preferences.marketing': { $ne: false }
        })
        break
      // Add other cases as needed
      default:
        targetUsers = await User.find({
          emailVerified: true,
          'preferences.marketing': { $ne: false }
        }).limit(100) // Limit for testing
    }

    if (targetUsers.length < 10) {
      return NextResponse.json(
        { error: 'A/B test requires at least 10 target users for statistical significance' },
        { status: 400 }
      )
    }

    // Randomly assign users to variants
    const shuffledUsers = targetUsers.sort(() => Math.random() - 0.5)
    const splitPoint = Math.floor(shuffledUsers.length * testConfig.variantA.weight / 100)
    
    const variantAUsers = shuffledUsers.slice(0, splitPoint)
    const variantBUsers = shuffledUsers.slice(splitPoint)

    // Generate test ID
    const abTestId = `abtest_${Date.now()}_${uuidv4().substring(0, 8)}`

    // Create campaigns for both variants
    const campaignPromises = []

    // Variant A
    const variantACampaignId = `${abTestId}_variant_a`
    const variantAEmails = variantAUsers.map(user => 
      ComprehensiveEmailService.queueEmail({
        to: user.email,
        subject: testConfig.variantA.subject,
        templateType: testConfig.templateType,
        templateData: {
          firstName: user.firstName,
          ...testConfig.variantA.templateData
        },
        userId: user.id,
        campaignId: variantACampaignId,
        priority: 'normal',
        scheduledFor: testConfig.scheduledFor ? new Date(testConfig.scheduledFor) : undefined,
        trackingEnabled: true
      })
    )

    // Variant B
    const variantBCampaignId = `${abTestId}_variant_b`
    const variantBEmails = variantBUsers.map(user => 
      ComprehensiveEmailService.queueEmail({
        to: user.email,
        subject: testConfig.variantB.subject,
        templateType: testConfig.templateType,
        templateData: {
          firstName: user.firstName,
          ...testConfig.variantB.templateData
        },
        userId: user.id,
        campaignId: variantBCampaignId,
        priority: 'normal',
        scheduledFor: testConfig.scheduledFor ? new Date(testConfig.scheduledFor) : undefined,
        trackingEnabled: true
      })
    )

    await Promise.all([...variantAEmails, ...variantBEmails])

    // Store A/B test configuration (in a real implementation, this would be in a database)
    const abTestResult = {
      abTestId,
      name: testConfig.name,
      description: testConfig.description,
      templateType: testConfig.templateType,
      status: testConfig.scheduledFor ? 'scheduled' : 'running',
      createdAt: new Date().toISOString(),
      scheduledFor: testConfig.scheduledFor,
      duration: testConfig.duration,
      successMetric: testConfig.successMetric,
      variants: {
        a: {
          campaignId: variantACampaignId,
          subject: testConfig.variantA.subject,
          weight: testConfig.variantA.weight,
          users: variantAUsers.length,
          templateData: testConfig.variantA.templateData
        },
        b: {
          campaignId: variantBCampaignId,
          subject: testConfig.variantB.subject,
          weight: testConfig.variantB.weight,
          users: variantBUsers.length,
          templateData: testConfig.variantB.templateData
        }
      },
      totalUsers: targetUsers.length
    }

    return NextResponse.json({
      success: true,
      data: abTestResult
    })

  } catch (error) {
    console.error('A/B test creation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create A/B test',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('testId')
    
    if (testId) {
      // Get specific A/B test results
      // In a real implementation, this would fetch from database
      // For now, return mock results
      const testResults = {
        abTestId: testId,
        name: 'Subject Line Test - Newsletter',
        description: 'Testing different subject line approaches',
        templateType: 'newsletter',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-16T14:00:00Z',
        duration: 24,
        successMetric: 'open_rate',
        variants: {
          a: {
            campaignId: `${testId}_variant_a`,
            subject: 'Your Weekly Wetaskiwin Update',
            weight: 50,
            users: 75,
            results: {
              sent: 75,
              opened: 45,
              clicked: 12,
              openRate: 60.0,
              clickRate: 16.0,
              conversions: 3
            }
          },
          b: {
            campaignId: `${testId}_variant_b`,
            subject: '🌟 This Week in Wetaskiwin - Don\'t Miss Out!',
            weight: 50,
            users: 75,
            results: {
              sent: 75,
              opened: 58,
              clicked: 18,
              openRate: 77.3,
              clickRate: 24.0,
              conversions: 7
            }
          }
        },
        winner: 'b',
        statisticalSignificance: 0.95,
        improvement: '+17.3% open rate, +50% more conversions',
        recommendation: 'Use Variant B approach with emoji and urgency in subject lines'
      }

      return NextResponse.json({
        success: true,
        data: testResults
      })
    }

    // List all A/B tests
    const mockTests = [
      {
        abTestId: 'abtest_1703692800_abc123',
        name: 'Subject Line Test - Newsletter',
        templateType: 'newsletter',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-16T14:00:00Z',
        successMetric: 'open_rate',
        winner: 'b',
        improvement: '+17.3%',
        totalUsers: 150
      },
      {
        abTestId: 'abtest_1703779200_def456',
        name: 'CTA Button Test - Marketing',
        templateType: 'marketing',
        status: 'running',
        createdAt: '2024-01-18T09:00:00Z',
        successMetric: 'click_rate',
        winner: null,
        improvement: null,
        totalUsers: 200,
        timeRemaining: '18 hours'
      },
      {
        abTestId: 'abtest_1703865600_ghi789',
        name: 'Welcome Content Test',
        templateType: 'welcome',
        status: 'scheduled',
        createdAt: '2024-01-20T14:30:00Z',
        scheduledFor: '2024-01-22T10:00:00Z',
        successMetric: 'click_rate',
        winner: null,
        improvement: null,
        totalUsers: 50
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        tests: mockTests,
        summary: {
          total: mockTests.length,
          running: mockTests.filter(t => t.status === 'running').length,
          completed: mockTests.filter(t => t.status === 'completed').length,
          scheduled: mockTests.filter(t => t.status === 'scheduled').length
        }
      }
    })

  } catch (error) {
    console.error('A/B test listing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch A/B tests',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}