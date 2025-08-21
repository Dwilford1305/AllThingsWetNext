import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business, OfferCode } from '@/models'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { businessId, subscriptionTier, duration = 12, offerCode, userId } = body

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
    let actualDuration = duration

    // Pricing information (for logging/tracking)
    const pricing = {
      silver: { monthly: 19.99, annual: 199.99 },
      gold: { monthly: 39.99, annual: 399.99 },
      platinum: { monthly: 79.99, annual: 799.99 }
    }

    const isAnnual = duration >= 12
    const tierPricing = pricing[subscriptionTier as keyof typeof pricing]
    const originalCost = tierPricing ? (isAnnual ? tierPricing.annual : tierPricing.monthly * duration) : 0
    let finalCost = originalCost
    let appliedOfferCode = null
    let discountApplied = 0

    // Handle offer code if provided
    if (offerCode) {
      const offerCodeDoc = await OfferCode.findOne({ 
        code: offerCode.toUpperCase(),
        isActive: true 
      })

      if (offerCodeDoc) {
        // Validate offer code
        const now = new Date()
        const isValidDate = now >= new Date(offerCodeDoc.validFrom) && now <= new Date(offerCodeDoc.validUntil)
        const hasUsageLeft = !offerCodeDoc.maxUses || offerCodeDoc.usedCount < offerCodeDoc.maxUses
        const isTierApplicable = offerCodeDoc.applicableTiers.includes(business.subscriptionTier || 'free')

        if (isValidDate && hasUsageLeft && isTierApplicable) {
          appliedOfferCode = offerCodeDoc

          // Apply offer code benefits
          switch (offerCodeDoc.offerType) {
            case 'discount_percentage':
              if (offerCodeDoc.discountPercentage) {
                discountApplied = (originalCost * offerCodeDoc.discountPercentage) / 100
                finalCost = Math.max(0, originalCost - discountApplied)
              }
              break

            case 'discount_fixed':
              if (offerCodeDoc.discountAmount) {
                discountApplied = Math.min(offerCodeDoc.discountAmount, originalCost)
                finalCost = Math.max(0, originalCost - discountApplied)
              }
              break

            case 'free_months':
              if (offerCodeDoc.freeMonths) {
                actualDuration += offerCodeDoc.freeMonths
                // Keep the same cost but extend duration
              }
              break

            case 'free_upgrade':
              if (offerCodeDoc.upgradeToTier) {
                const tierOrder = { free: 0, silver: 1, gold: 2, platinum: 3 }
                const currentTierLevel = tierOrder[business.subscriptionTier as keyof typeof tierOrder] || 0
                const upgradeTierLevel = tierOrder[offerCodeDoc.upgradeToTier as keyof typeof tierOrder]
                const targetTierLevel = tierOrder[subscriptionTier as keyof typeof tierOrder]

                if (targetTierLevel <= upgradeTierLevel && targetTierLevel > currentTierLevel) {
                  finalCost = 0 // Free upgrade
                  discountApplied = originalCost
                }
              }
              break
          }

          // Update offer code usage
          await OfferCode.findOneAndUpdate(
            { id: offerCodeDoc.id },
            {
              $inc: { usedCount: 1 },
              $push: {
                usageHistory: {
                  businessId,
                  userId: userId || 'unknown',
                  usedAt: now,
                  oldTier: business.subscriptionTier || 'free',
                  newTier: subscriptionTier,
                  discountApplied
                }
              },
              updatedAt: now
            }
          )

          console.log(`🎫 OFFER CODE APPLIED: ${offerCodeDoc.code} - $${discountApplied.toFixed(2)} discount`)
        }
      }
    }

    // Set final subscription end date
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + actualDuration)

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
    console.log(`  Duration: ${actualDuration} months`)
    console.log(`  Original Cost: $${originalCost}`)
    if (appliedOfferCode) {
      console.log(`  Offer Code: ${appliedOfferCode.code} (${appliedOfferCode.name})`)
      console.log(`  Discount Applied: $${discountApplied.toFixed(2)}`)
    }
    console.log(`  Final Cost: $${finalCost}`)
    console.log(`  Valid until: ${subscriptionEnd.toDateString()}`)

    const response: ApiResponse<{ 
      business: typeof updatedBusiness; 
      pricing: { 
        tier: string; 
        originalCost: number; 
        finalCost: number;
        duration: number;
        offerCode?: {
          code: string;
          name: string;
          discountApplied: number;
        }
      } 
    }> = {
      success: true,
      data: { 
        business: updatedBusiness,
        pricing: {
          tier: subscriptionTier,
          originalCost,
          finalCost,
          duration: actualDuration,
          ...(appliedOfferCode && {
            offerCode: {
              code: appliedOfferCode.code,
              name: appliedOfferCode.name,
              discountApplied
            }
          })
        }
      },
      message: `Subscription upgraded to ${subscriptionTier} tier successfully.${appliedOfferCode ? ` Offer code ${appliedOfferCode.code} applied.` : ''}`
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
