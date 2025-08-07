import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { OfferCode } from '@/models'
import { v4 as uuidv4 } from 'uuid'
import type { ApiResponse, OfferCode as OfferCodeType, OfferType, SubscriptionTier, OfferCodeUsage } from '@/types'

// GET /api/admin/offer-codes - Get all offer codes
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const url = new URL(request.url)
    const activeOnly = url.searchParams.get('activeOnly') === 'true'
    
    const filter = activeOnly ? { isActive: true } : {}
    const offerCodes = await OfferCode.find(filter)
      .sort({ createdAt: -1 })
      .lean()

    const response: ApiResponse<OfferCodeType[]> = {
      success: true,
      data: offerCodes.map(code => ({
        id: code.id,
        code: code.code,
        name: code.name,
        description: code.description,
        offerType: code.offerType as OfferType,
        discountPercentage: code.discountPercentage,
        discountAmount: code.discountAmount,
        freeMonths: code.freeMonths,
        upgradeToTier: code.upgradeToTier as SubscriptionTier,
        maxUses: code.maxUses,
        usedCount: code.usedCount,
        validFrom: new Date(code.validFrom),
        validUntil: new Date(code.validUntil),
        applicableTiers: code.applicableTiers,
        isActive: code.isActive,
        createdBy: code.createdBy,
        createdAt: new Date(code.createdAt),
        updatedAt: new Date(code.updatedAt),
        usageHistory: code.usageHistory.map((usage: OfferCodeUsage) => ({
          businessId: usage.businessId,
          userId: usage.userId,
          usedAt: new Date(usage.usedAt),
          oldTier: usage.oldTier,
          newTier: usage.newTier,
          discountApplied: usage.discountApplied
        }))
      })),
      message: 'Offer codes retrieved successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get offer codes error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve offer codes' 
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/offer-codes - Create or update offer code
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { 
      id,
      code, 
      name, 
      description, 
      offerType, 
      discountPercentage,
      discountAmount,
      freeMonths,
      upgradeToTier,
      maxUses, 
      validFrom, 
      validUntil,
      applicableTiers,
      isActive,
      createdBy
    } = body

    // Validate required fields
    if (!code || !name || !description || !offerType || !validFrom || !validUntil || !createdBy) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: code, name, description, offerType, validFrom, validUntil, and createdBy are required' 
        },
        { status: 400 }
      )
    }

    // Validate offer type specific fields
    switch (offerType) {
      case 'discount_percentage':
        if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
          return NextResponse.json(
            { success: false, error: 'Valid discount percentage (1-100) is required for percentage discount' },
            { status: 400 }
          )
        }
        break
      case 'discount_fixed':
        if (!discountAmount || discountAmount <= 0) {
          return NextResponse.json(
            { success: false, error: 'Valid discount amount is required for fixed discount' },
            { status: 400 }
          )
        }
        break
      case 'free_months':
        if (!freeMonths || freeMonths <= 0) {
          return NextResponse.json(
            { success: false, error: 'Valid number of free months is required' },
            { status: 400 }
          )
        }
        break
      case 'free_upgrade':
        if (!upgradeToTier || !['silver', 'gold', 'platinum'].includes(upgradeToTier)) {
          return NextResponse.json(
            { success: false, error: 'Valid upgrade tier is required for free upgrade' },
            { status: 400 }
          )
        }
        break
    }

    // Validate dates
    const fromDate = new Date(validFrom)
    const untilDate = new Date(validUntil)
    
    if (fromDate >= untilDate) {
      return NextResponse.json(
        { success: false, error: 'Valid until date must be after valid from date' },
        { status: 400 }
      )
    }

    const offerCodeData = {
      code: code.toUpperCase(),
      name,
      description,
      offerType,
      discountPercentage: offerType === 'discount_percentage' ? discountPercentage : undefined,
      discountAmount: offerType === 'discount_fixed' ? discountAmount : undefined,
      freeMonths: offerType === 'free_months' ? freeMonths : undefined,
      upgradeToTier: offerType === 'free_upgrade' ? upgradeToTier : undefined,
      maxUses: maxUses || null,
      usedCount: 0,
      validFrom: fromDate,
      validUntil: untilDate,
      applicableTiers: applicableTiers || ['free', 'silver', 'gold'],
      isActive: isActive !== undefined ? isActive : true,
      createdBy,
      updatedAt: new Date()
    }

    let offerCode
    
    if (id) {
      // Update existing offer code
      offerCode = await OfferCode.findOneAndUpdate(
        { id },
        offerCodeData,
        { new: true }
      )
      
      if (!offerCode) {
        return NextResponse.json(
          { success: false, error: 'Offer code not found' },
          { status: 404 }
        )
      }
    } else {
      // Create new offer code
      const existingCode = await OfferCode.findOne({ code: code.toUpperCase() })
      if (existingCode) {
        return NextResponse.json(
          { success: false, error: 'Offer code already exists' },
          { status: 409 }
        )
      }

      offerCode = await OfferCode.create({
        id: `offer_${uuidv4()}`,
        ...offerCodeData,
        createdAt: new Date()
      })
    }

    console.log(`📋 ${id ? 'UPDATED' : 'CREATED'} OFFER CODE: ${offerCode.code} (${offerCode.name})`)

    const response: ApiResponse<OfferCodeType> = {
      success: true,
      data: {
        id: offerCode.id,
        code: offerCode.code,
        name: offerCode.name,
        description: offerCode.description,
        offerType: offerCode.offerType,
        discountPercentage: offerCode.discountPercentage,
        discountAmount: offerCode.discountAmount,
        freeMonths: offerCode.freeMonths,
        upgradeToTier: offerCode.upgradeToTier,
        maxUses: offerCode.maxUses,
        usedCount: offerCode.usedCount,
        validFrom: new Date(offerCode.validFrom),
        validUntil: new Date(offerCode.validUntil),
        applicableTiers: offerCode.applicableTiers,
        isActive: offerCode.isActive,
        createdBy: offerCode.createdBy,
        createdAt: new Date(offerCode.createdAt),
        updatedAt: new Date(offerCode.updatedAt),
        usageHistory: offerCode.usageHistory.map((usage: OfferCodeUsage) => ({
          businessId: usage.businessId,
          userId: usage.userId,
          usedAt: new Date(usage.usedAt),
          oldTier: usage.oldTier,
          newTier: usage.newTier,
          discountApplied: usage.discountApplied
        }))
      },
      message: `Offer code ${id ? 'updated' : 'created'} successfully`
    }

    return NextResponse.json(response, { status: id ? 200 : 201 })

  } catch (error) {
    console.error('Create/update offer code error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create/update offer code' 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/offer-codes - Delete offer code
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Offer code ID is required' },
        { status: 400 }
      )
    }

    const offerCode = await OfferCode.findOneAndDelete({ id })
    
    if (!offerCode) {
      return NextResponse.json(
        { success: false, error: 'Offer code not found' },
        { status: 404 }
      )
    }

    console.log(`🗑️ DELETED OFFER CODE: ${offerCode.code} (${offerCode.name})`)

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Offer code deleted successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Delete offer code error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete offer code' 
      },
      { status: 500 }
    )
  }
}
