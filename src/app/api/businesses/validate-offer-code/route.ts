import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { OfferCode } from '@/models'
import type { ApiResponse, OfferCodeValidationResult } from '@/types'

// POST /api/businesses/validate-offer-code - Validate offer code for business subscription
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { code, currentTier, targetTier, basePrice } = body

    // Validate required fields
    if (!code || !currentTier || !targetTier || basePrice === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: code, currentTier, targetTier, and basePrice are required' 
        },
        { status: 400 }
      )
    }

    // Find offer code
    const offerCode = await OfferCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    })

    if (!offerCode) {
      const response: ApiResponse<OfferCodeValidationResult> = {
        success: true,
        data: {
          isValid: false,
          error: 'Invalid or inactive offer code'
        },
        message: 'Offer code validation completed'
      }
      return NextResponse.json(response)
    }

    // Check if code is still valid (date range)
    const now = new Date()
    if (now < new Date(offerCode.validFrom) || now > new Date(offerCode.validUntil)) {
      const response: ApiResponse<OfferCodeValidationResult> = {
        success: true,
        data: {
          isValid: false,
          error: 'Offer code has expired or is not yet valid'
        },
        message: 'Offer code validation completed'
      }
      return NextResponse.json(response)
    }

    // Check usage limits
    if (offerCode.maxUses && offerCode.usedCount >= offerCode.maxUses) {
      const response: ApiResponse<OfferCodeValidationResult> = {
        success: true,
        data: {
          isValid: false,
          error: 'Offer code has reached its usage limit'
        },
        message: 'Offer code validation completed'
      }
      return NextResponse.json(response)
    }

    // Check if current tier is eligible
    if (!offerCode.applicableTiers.includes(currentTier)) {
      const response: ApiResponse<OfferCodeValidationResult> = {
        success: true,
        data: {
          isValid: false,
          error: `This offer code is not applicable to ${currentTier} tier`
        },
        message: 'Offer code validation completed'
      }
      return NextResponse.json(response)
    }

    // Calculate discount/benefit based on offer type
    const validationResult: OfferCodeValidationResult = {
      isValid: true,
      description: offerCode.description
    }

    switch (offerCode.offerType) {
      case 'discount_percentage':
        if (offerCode.discountPercentage) {
          const discountAmount = (basePrice * offerCode.discountPercentage) / 100
          validationResult.discountPercentage = offerCode.discountPercentage
          validationResult.discountAmount = discountAmount
          validationResult.finalPrice = Math.max(0, basePrice - discountAmount)
        }
        break

      case 'discount_fixed':
        if (offerCode.discountAmount) {
          validationResult.discountAmount = offerCode.discountAmount
          validationResult.finalPrice = Math.max(0, basePrice - offerCode.discountAmount)
        }
        break

      case 'free_months':
        if (offerCode.freeMonths) {
          validationResult.freeMonths = offerCode.freeMonths
          validationResult.finalPrice = basePrice // Base price for calculation, free months applied separately
        }
        break

      case 'free_upgrade':
        if (offerCode.upgradeToTier) {
          // Check if the target tier matches the upgrade tier or is lower
          const tierOrder = { free: 0, silver: 1, gold: 2, platinum: 3 }
          const currentTierLevel = tierOrder[currentTier as keyof typeof tierOrder]
          const upgradeTierLevel = tierOrder[offerCode.upgradeToTier as keyof typeof tierOrder]
          const targetTierLevel = tierOrder[targetTier as keyof typeof tierOrder]

          if (targetTierLevel <= upgradeTierLevel && targetTierLevel > currentTierLevel) {
            validationResult.upgradeToTier = offerCode.upgradeToTier
            validationResult.finalPrice = 0 // Free upgrade
          } else {
            validationResult.isValid = false
            validationResult.error = `This upgrade code can only be used for ${offerCode.upgradeToTier} tier or lower`
          }
        }
        break

      default:
        validationResult.isValid = false
        validationResult.error = 'Unknown offer type'
    }

    const response: ApiResponse<OfferCodeValidationResult> = {
      success: true,
      data: validationResult,
      message: 'Offer code validation completed'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Validate offer code error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate offer code' 
      },
      { status: 500 }
    )
  }
}
