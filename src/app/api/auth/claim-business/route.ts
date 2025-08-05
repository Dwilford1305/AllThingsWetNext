import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'
import { BusinessClaimRequest, UserActivityLog } from '@/models/auth'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { AuthService } from '@/lib/auth'
import type { ApiResponse } from '@/types'

// POST /api/auth/claim-business - Submit business claim request
async function submitClaimRequest(request: AuthenticatedRequest) {
  try {
    await connectDB()

    const user = request.user
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { businessId, message, verificationDocuments = [] } = body

    // Validate required fields
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Check if business exists
    const business = await Business.findOne({ id: businessId })
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check if business is already claimed
    if (business.isClaimed) {
      return NextResponse.json(
        { success: false, error: 'Business is already claimed' },
        { status: 409 }
      )
    }

    // Check if user already has a pending claim for this business
    const existingClaim = await BusinessClaimRequest.findOne({
      businessId,
      userId: user.id,
      status: 'pending'
    })

    if (existingClaim) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending claim for this business' },
        { status: 409 }
      )
    }

    // Create claim request
    const claimRequestId = AuthService.generateClaimRequestId()
    
    const claimRequest = await BusinessClaimRequest.create({
      id: claimRequestId,
      businessId,
      userId: user.id,
      claimerName: `${user.firstName} ${user.lastName}`,
      claimerEmail: user.email,
      phone: user.phone || '',
      message: message || '',
      verificationDocuments,
      status: 'pending'
    })

    // Log the claim request
    await UserActivityLog.create({
      id: AuthService.generateUserId(),
      userId: user.id,
      action: 'business_claim_submitted',
      details: {
        businessId,
        businessName: business.name,
        claimRequestId: claimRequest.id
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true
    })

    // TODO: Send email notification to admin
    console.log(`🏢 NEW BUSINESS CLAIM REQUEST`)
    console.log(`Business: ${business.name} (${businessId})`)
    console.log(`Claimed by: ${user.firstName} ${user.lastName} (${user.email})`)
    console.log(`Claim ID: ${claimRequest.id}`)
    console.log(`📧 ADMIN NOTIFICATION: Send details to wilfordderek@gmail.com`)

    const response: ApiResponse<Record<string, unknown>> = {
      success: true,
      data: {
        id: claimRequest.id,
        businessId,
        userId: user.id,
        status: 'pending',
        submittedAt: claimRequest.submittedAt
      },
      message: 'Business claim request submitted successfully. An administrator will review your request.'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Business claim request error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/auth/claim-business - Get user's claim requests
async function getClaimRequests(request: AuthenticatedRequest) {
  try {
    await connectDB()

    const user = request.user
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get all claim requests for this user
    const claimRequests = await BusinessClaimRequest.find({ userId: user.id })
      .sort({ submittedAt: -1 })

    // Get business details for each claim
    const claimRequestsWithBusiness = await Promise.all(
      claimRequests.map(async (claim) => {
        const business = await Business.findOne({ id: claim.businessId })
        return {
          ...claim.toObject(),
          business: business ? {
            id: business.id,
            name: business.name,
            category: business.category,
            address: business.address
          } : null
        }
      })
    )

    const response: ApiResponse<Record<string, unknown>[]> = {
      success: true,
      data: claimRequestsWithBusiness,
      message: 'Claim requests retrieved successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get claim requests error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(submitClaimRequest)
export const GET = withAuth(getClaimRequests)
