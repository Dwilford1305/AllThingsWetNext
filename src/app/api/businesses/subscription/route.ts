import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { businessId, subscriptionTier, duration = 12 } = body

    // Validate required fields
    if (!businessId || !subscriptionTier) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: businessId and subscriptionTier are required' 
        },
        { status: 400 }
      )
    }

    // Validate subscription tier
    const validTiers = ['free', 'silver', 'gold', 'platinum']
    if (!validTiers.includes(subscriptionTier)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid subscription tier. Must be one of: ${validTiers.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Find the business
    const business = await Business.findOne({ id: businessId })
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check if business is claimed
    if (!business.isClaimed) {
      return NextResponse.json(
        { success: false, error: 'Business must be claimed before upgrading subscription' },
        { status: 403 }
      )
    }

    // Calculate subscription dates
    const now = new Date()
    const subscriptionEnd = new Date(now)
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + duration)

    // Pricing information (for logging/tracking)
    const pricing = {
      silver: { monthly: 19.99, annual: 199.99 },
      gold: { monthly: 39.99, annual: 399.99 },
      platinum: { monthly: 79.99, annual: 799.99 }
    }

    const isAnnual = duration >= 12
    const tierPricing = pricing[subscriptionTier as keyof typeof pricing]
    const cost = tierPricing ? (isAnnual ? tierPricing.annual : tierPricing.monthly * duration) : 0

    // Update business subscription
    const updatedBusiness = await Business.findOneAndUpdate(
      { id: businessId },
      {
        subscriptionTier,
        subscriptionStatus: 'active',
        subscriptionStart: now,
        subscriptionEnd,
        featured: subscriptionTier !== 'free', // Premium tiers get featured placement
        updatedAt: now
      },
      { new: true }
    )

    // TODO: Integrate with payment processor (Stripe, PayPal, etc.)
    console.log(`Subscription upgrade for ${business.name}:`)
    console.log(`  Tier: ${subscriptionTier}`)
    console.log(`  Duration: ${duration} months`)
    console.log(`  Cost: $${cost}`)
    console.log(`  Valid until: ${subscriptionEnd.toDateString()}`)

    const response: ApiResponse<{ business: typeof updatedBusiness; pricing: { tier: string; cost: number; duration: number } }> = {
      success: true,
      data: { 
        business: updatedBusiness,
        pricing: {
          tier: subscriptionTier,
          cost,
          duration
        }
      },
      message: `Subscription upgraded to ${subscriptionTier} tier successfully.`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Business subscription API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process subscription upgrade' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Business subscription API is ready. Use POST to upgrade subscription.',
    endpoints: {
      'POST /api/businesses/subscription': 'Upgrade business subscription'
    },
    subscriptionTiers: {
      silver: {
        price: '$19.99/month or $199.99/year',
        features: ['Enhanced listing', 'Contact form', 'Basic analytics', 'Business hours']
      },
      gold: {
        price: '$39.99/month or $399.99/year',
        features: ['Everything in Silver', 'Photo gallery', 'Social media links', 'Special offers', 'Featured placement']
      },
      platinum: {
        price: '$79.99/month or $799.99/year',
        features: ['Everything in Gold', 'Logo upload', 'Advanced analytics', 'Priority support', 'Custom description']
      }
    },
    requiredFields: ['businessId', 'subscriptionTier'],
    optionalFields: ['duration (months, default: 12)']
  })
}
