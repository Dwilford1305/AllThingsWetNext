import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth-middleware'
import { connectDB } from '@/lib/mongodb'
import ComprehensiveEmailService, { EmailTemplateType } from '@/lib/email/services/ComprehensiveEmailService'
import { User, Business, Event } from '@/models'

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    await connectDB()

    const {
      campaignName,
      templateType,
      subject,
      scheduledFor,
      targetAudience,
      templateData
    } = await request.json()

    if (!campaignName || !templateType || !subject) {
      return NextResponse.json(
        { error: 'Campaign name, template type, and subject are required' },
        { status: 400 }
      )
    }

    // Get target users based on audience criteria
    let targetUsers: any[] = []
    
    switch (targetAudience?.type) {
      case 'all_users':
        targetUsers = await User.find({
          emailVerified: true,
          'preferences.marketing': { $ne: false }
        })
        break
        
      case 'business_owners':
        const businessOwnerIds = await Business.distinct('ownerId', {
          status: 'approved'
        })
        targetUsers = await User.find({
          id: { $in: businessOwnerIds },
          emailVerified: true,
          'preferences.marketing': { $ne: false }
        })
        break
        
      case 'premium_subscribers':
        const premiumBusinessIds = await Business.distinct('ownerId', {
          subscriptionTier: { $in: ['premium', 'platinum'] }
        })
        targetUsers = await User.find({
          id: { $in: premiumBusinessIds },
          emailVerified: true,
          'preferences.marketing': { $ne: false }
        })
        break
        
      case 'recent_signups':
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        targetUsers = await User.find({
          createdAt: { $gte: thirtyDaysAgo },
          emailVerified: true,
          'preferences.marketing': { $ne: false }
        })
        break
        
      case 'custom':
        if (targetAudience.userIds?.length) {
          targetUsers = await User.find({
            id: { $in: targetAudience.userIds },
            emailVerified: true,
            'preferences.marketing': { $ne: false }
          })
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid target audience type' },
          { status: 400 }
        )
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: 'No users found matching the target audience criteria' },
        { status: 400 }
      )
    }

    // Generate campaign ID
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Schedule emails for all target users
    const emailPromises = targetUsers.map(user => {
      return ComprehensiveEmailService.queueEmail({
        to: user.email,
        subject,
        templateType: templateType as EmailTemplateType,
        templateData: {
          firstName: user.firstName,
          ...templateData
        },
        userId: user.id,
        campaignId,
        priority: 'normal',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        trackingEnabled: true
      })
    })

    await Promise.all(emailPromises)

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        campaignName,
        templateType,
        subject,
        scheduledFor,
        targetUsers: targetUsers.length,
        emailsQueued: targetUsers.length,
        status: scheduledFor ? 'scheduled' : 'queued'
      }
    })

  } catch (error) {
    console.error('Campaign creation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create email campaign',
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

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'scheduled', 'sent', 'all'
    const templateType = searchParams.get('templateType')
    
    // For now, return mock campaign data since full implementation would require 
    // additional database schema changes
    const mockCampaigns = [
      {
        campaignId: 'campaign_1703692800_abc123',
        campaignName: 'Winter Newsletter 2024',
        templateType: 'newsletter',
        subject: 'Your Weekly Wetaskiwin Update - Winter Events!',
        totalEmails: 150,
        sentEmails: 150,
        failedEmails: 2,
        scheduledFor: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-14T15:30:00Z',
        lastSentAt: '2024-01-15T10:05:00Z',
        status: 'completed',
        analytics: {
          openRate: 68.5,
          clickRate: 12.3,
          bounceRate: 1.3
        }
      },
      {
        campaignId: 'campaign_1703779200_def456',
        campaignName: 'Business Spotlight Campaign',
        templateType: 'marketing',
        subject: 'Discover Amazing Local Businesses This Month',
        totalEmails: 89,
        sentEmails: 45,
        failedEmails: 0,
        scheduledFor: '2024-01-20T14:00:00Z',
        createdAt: '2024-01-18T09:15:00Z',
        lastSentAt: null,
        status: 'scheduled',
        analytics: {
          openRate: 0,
          clickRate: 0,
          bounceRate: 0
        }
      },
      {
        campaignId: 'campaign_1703606400_ghi789',
        campaignName: 'Welcome Series - New Members',
        templateType: 'welcome',
        subject: 'Welcome to the Wetaskiwin Community!',
        totalEmails: 25,
        sentEmails: 25,
        failedEmails: 0,
        scheduledFor: '2024-01-12T11:30:00Z',
        createdAt: '2024-01-12T08:45:00Z',
        lastSentAt: '2024-01-12T11:35:00Z',
        status: 'completed',
        analytics: {
          openRate: 92.0,
          clickRate: 24.0,
          bounceRate: 0
        }
      }
    ]

    let filteredCampaigns = mockCampaigns

    if (status && status !== 'all') {
      filteredCampaigns = mockCampaigns.filter(campaign => 
        campaign.status === status
      )
    }

    if (templateType) {
      filteredCampaigns = filteredCampaigns.filter(campaign =>
        campaign.templateType === templateType
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        campaigns: filteredCampaigns,
        summary: {
          total: filteredCampaigns.length,
          scheduled: filteredCampaigns.filter(c => c.status === 'scheduled').length,
          completed: filteredCampaigns.filter(c => c.status === 'completed').length,
          inProgress: filteredCampaigns.filter(c => c.status === 'in_progress').length
        }
      }
    })

  } catch (error) {
    console.error('Campaign listing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaigns',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}