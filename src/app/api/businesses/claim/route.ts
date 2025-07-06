import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { businessId, claimerEmail, claimerName, message } = body

    // Validate required fields
    if (!businessId || !claimerEmail || !claimerName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: businessId, claimerEmail, and claimerName are required' 
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

    // Check if already claimed
    if (business.isClaimed) {
      return NextResponse.json(
        { success: false, error: 'This business has already been claimed' },
        { status: 409 }
      )
    }

    // For now, we'll mark it as claimed immediately
    // In a real system, you'd want to verify ownership first
    const updatedBusiness = await Business.findOneAndUpdate(
      { id: businessId },
      {
        isClaimed: true,
        claimedBy: claimerEmail,
        claimedAt: new Date(),
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        updatedAt: new Date()
      },
      { new: true }
    )

    // TODO: Send email notification to admin/review team
    console.log(`Business claim request for ${business.name} by ${claimerName} (${claimerEmail})`)
    console.log(`Message: ${message || 'No message provided'}`)

    const response: ApiResponse<{ business: typeof updatedBusiness }> = {
      success: true,
      data: { business: updatedBusiness },
      message: 'Business claim request submitted successfully. You can now manage your listing.'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Business claim API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process claim request' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Business claim API is ready. Use POST to submit a claim request.',
    endpoints: {
      'POST /api/businesses/claim': 'Submit a business claim request'
    },
    requiredFields: ['businessId', 'claimerEmail', 'claimerName'],
    optionalFields: ['message']
  })
}
