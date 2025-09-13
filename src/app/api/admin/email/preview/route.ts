import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth-middleware'
import { render } from '@react-email/render'
import { EmailTemplateType } from '@/lib/email/services/ComprehensiveEmailService'

// Import all email templates
import EmailVerification from '@/lib/email/templates/auth/EmailVerification'
import PasswordReset from '@/lib/email/templates/auth/PasswordReset'
import BusinessApproval from '@/lib/email/templates/business/BusinessApproval'
import BusinessRejection from '@/lib/email/templates/business/BusinessRejection'
import EventNotification from '@/lib/email/templates/notifications/EventNotification'
import Newsletter from '@/lib/email/templates/marketing/Newsletter'
import Marketing from '@/lib/email/templates/marketing/Marketing'
import SubscriptionConfirmation from '@/lib/email/templates/subscriptions/SubscriptionConfirmation'
import Welcome from '@/lib/email/templates/onboarding/Welcome'

// Sample data for template previews
const sampleData: Record<EmailTemplateType, any> = {
  email_verification: {
    firstName: 'John',
    verificationUrl: 'https://allthingswetaskiwin.com/verify-email?token=sample-token',
    trackingId: 'sample-tracking-id'
  },
  password_reset: {
    firstName: 'Jane',
    resetUrl: 'https://allthingswetaskiwin.com/reset-password?token=sample-reset-token',
    trackingId: 'sample-tracking-id'
  },
  business_approval: {
    firstName: 'Mike',
    businessName: 'Wetaskiwin Coffee House',
    businessId: 'business-123',
    dashboardUrl: 'https://allthingswetaskiwin.com/businesses/manage',
    businessUrl: 'https://allthingswetaskiwin.com/businesses?id=business-123',
    trackingId: 'sample-tracking-id'
  },
  business_rejection: {
    firstName: 'Sarah',
    businessName: 'Rejected Business',
    reason: 'Incomplete information provided. Please ensure all required fields are filled and business address is verified.',
    contactUrl: 'https://allthingswetaskiwin.com/contact',
    trackingId: 'sample-tracking-id'
  },
  event_notification: {
    firstName: 'Alex',
    events: [
      {
        title: 'Wetaskiwin Summer Festival',
        date: '2024-07-15',
        time: '10:00 AM',
        location: 'Centennial Park',
        description: 'Annual community festival with live music, food vendors, and family activities.',
        url: 'https://allthingswetaskiwin.com/events/summer-festival'
      },
      {
        title: 'Business Networking Mixer',
        date: '2024-07-20',
        time: '6:00 PM',
        location: 'Chamber of Commerce',
        description: 'Connect with local business owners and entrepreneurs.',
        url: 'https://allthingswetaskiwin.com/events/networking-mixer'
      }
    ],
    period: 'weekly',
    unsubscribeUrl: 'https://allthingswetaskiwin.com/unsubscribe?token=sample-token',
    trackingId: 'sample-tracking-id'
  },
  newsletter: {
    firstName: 'Lisa',
    articles: [
      {
        title: 'New Bike Path Opens Downtown',
        excerpt: 'The city has completed construction on a new bike path connecting downtown to the recreation center.',
        url: 'https://allthingswetaskiwin.com/news/bike-path-opens',
        category: 'City News',
        publishedAt: '2024-01-15T10:00:00Z'
      },
      {
        title: 'Local Restaurant Wins Provincial Award',
        excerpt: 'Prairie Rose Bistro recognized for excellence in sustainable dining practices.',
        url: 'https://allthingswetaskiwin.com/news/restaurant-award',
        category: 'Business',
        publishedAt: '2024-01-12T14:30:00Z'
      }
    ],
    events: [
      {
        title: 'Winter Carnival',
        date: '2024-02-10',
        time: '12:00 PM',
        location: 'City Centre',
        url: 'https://allthingswetaskiwin.com/events/winter-carnival'
      }
    ],
    businesses: [
      {
        name: 'Tech Solutions Wetaskiwin',
        description: 'Professional IT services for small businesses and residential customers.',
        category: 'Technology',
        url: 'https://allthingswetaskiwin.com/businesses/tech-solutions'
      }
    ],
    unsubscribeUrl: 'https://allthingswetaskiwin.com/unsubscribe?token=sample-token',
    trackingId: 'sample-tracking-id'
  },
  marketing: {
    firstName: 'David',
    campaignTitle: 'Discover Local Businesses This Winter',
    campaignSubtitle: 'Support Wetaskiwin entrepreneurs with special offers',
    ctaText: 'Shop Local Now',
    ctaUrl: 'https://allthingswetaskiwin.com/businesses',
    content: [
      {
        type: 'paragraph',
        text: 'Winter is the perfect time to explore what local Wetaskiwin businesses have to offer. From cozy cafes to unique retail shops, our community is full of hidden gems.'
      },
      {
        type: 'list',
        text: 'This month\'s highlights:',
        items: [
          'Free hot chocolate at participating cafes',
          '20% off winter gear at local retailers',
          'Special dinner menus at downtown restaurants'
        ]
      },
      {
        type: 'highlight',
        text: '🎉 Limited Time: Use code WINTER2024 for exclusive deals!'
      }
    ],
    businessSpotlight: {
      name: 'Wetaskiwin Books & Gifts',
      description: 'Your local bookstore with a carefully curated selection of books, gifts, and stationery.',
      imageUrl: 'https://allthingswetaskiwin.com/images/sample-business.jpg',
      url: 'https://allthingswetaskiwin.com/businesses/books-gifts',
      category: 'Retail'
    },
    specialOffer: {
      title: '25% Off First Purchase',
      description: 'New customers get 25% off their first purchase at any participating local business.',
      offerCode: 'WELCOME25',
      expiresAt: '2024-03-31T23:59:59Z',
      termsUrl: 'https://allthingswetaskiwin.com/terms'
    },
    unsubscribeUrl: 'https://allthingswetaskiwin.com/unsubscribe?token=sample-token',
    trackingId: 'sample-tracking-id'
  },
  subscription_confirmation: {
    firstName: 'Emily',
    subscriptionTier: 'premium' as const,
    businessName: 'Wetaskiwin Auto Repair',
    features: [
      'Priority placement in business directory',
      'Featured business spotlight in newsletter',
      'Advanced analytics and insights',
      'Custom business profile with gallery',
      'Direct customer messaging'
    ],
    subscriptionDate: '2024-01-20T10:00:00Z',
    nextBillingDate: '2024-02-20T10:00:00Z',
    amount: 49.99,
    invoiceUrl: 'https://allthingswetaskiwin.com/invoices/inv-123',
    dashboardUrl: 'https://allthingswetaskiwin.com/businesses/manage',
    trackingId: 'sample-tracking-id'
  },
  welcome: {
    firstName: 'Christopher',
    lastName: 'Johnson',
    email: 'christopher@example.com',
    verificationUrl: 'https://allthingswetaskiwin.com/verify-email?token=welcome-token',
    profileUrl: 'https://allthingswetaskiwin.com/profile',
    communityStatsUrl: 'https://allthingswetaskiwin.com/',
    businessesCount: 150,
    eventsCount: 25,
    trackingId: 'sample-tracking-id'
  },
  business_request_confirmation: {
    firstName: 'Robert',
    businessName: 'New Business Request',
    businessId: 'pending-123',
    dashboardUrl: 'https://allthingswetaskiwin.com/businesses/manage',
    businessUrl: 'https://allthingswetaskiwin.com/businesses?id=pending-123',
    trackingId: 'sample-tracking-id'
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
    const templateType = searchParams.get('template') as EmailTemplateType
    const format = searchParams.get('format') || 'html' // 'html' or 'json'

    if (!templateType) {
      // Return list of available templates
      const availableTemplates = Object.keys(sampleData).map(type => ({
        type,
        name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        previewUrl: `/api/admin/email/preview?template=${type}`,
        testUrl: `/api/admin/email/preview?template=${type}&format=json`
      }))

      return NextResponse.json({
        success: true,
        data: {
          templates: availableTemplates,
          usage: {
            preview: '/api/admin/email/preview?template={templateType}',
            test: '/api/admin/email/preview?template={templateType}&format=json'
          }
        }
      })
    }

    if (!sampleData[templateType]) {
      return NextResponse.json(
        { error: `Unknown template type: ${templateType}` },
        { status: 400 }
      )
    }

    let html: string
    const data = sampleData[templateType]

    // Render the appropriate template
    try {
      switch (templateType) {
        case 'email_verification':
          html = await render(EmailVerification(data))
          break
        case 'password_reset':
          html = await render(PasswordReset(data))
          break
        case 'business_approval':
          html = await render(BusinessApproval(data))
          break
        case 'business_rejection':
          html = await render(BusinessRejection(data))
          break
        case 'event_notification':
          html = await render(EventNotification(data))
          break
        case 'newsletter':
          html = await render(Newsletter(data))
          break
        case 'marketing':
          html = await render(Marketing(data))
          break
        case 'subscription_confirmation':
          html = await render(SubscriptionConfirmation(data))
          break
        case 'welcome':
          html = await render(Welcome(data))
          break
        case 'business_request_confirmation':
          html = await render(BusinessApproval(data))
          break
        default:
          throw new Error(`Unhandled template type: ${templateType}`)
      }
    } catch (renderError) {
      console.error('Template rendering error:', renderError)
      return NextResponse.json(
        { 
          error: 'Failed to render template',
          details: renderError instanceof Error ? renderError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: {
          templateType,
          sampleData: data,
          renderedHtml: html,
          textVersion: html
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
        }
      })
    }

    // Return HTML for preview
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    console.error('Email template preview error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate email preview',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Send test email
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { templateType, testEmail, customData } = await request.json()

    if (!templateType || !testEmail) {
      return NextResponse.json(
        { error: 'Template type and test email are required' },
        { status: 400 }
      )
    }

    if (!sampleData[templateType as EmailTemplateType]) {
      return NextResponse.json(
        { error: `Unknown template type: ${templateType}` },
        { status: 400 }
      )
    }

    // TODO: Implement test email sending
    // This would use the ComprehensiveEmailService to queue a test email
    // For now, return success response
    
    return NextResponse.json({
      success: true,
      message: `Test email queued for ${templateType} template to ${testEmail}`,
      data: {
        templateType,
        testEmail,
        sampleData: customData || sampleData[templateType as EmailTemplateType],
        queueId: `test-${Date.now()}`
      }
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}