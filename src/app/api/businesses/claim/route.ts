import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business, User } from '@/models'
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

    // Find the user by email
    const user = await User.findOne({ email: claimerEmail })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found. Please register an account first.' },
        { status: 404 }
      )
    }

    // For now, we'll mark it as claimed immediately
    // In a real system, you'd want to verify ownership first
    const updatedBusiness = await Business.findOneAndUpdate(
      { id: businessId },
      {
        isClaimed: true,
        claimedBy: claimerEmail,
        claimedByUserId: user._id.toString(),
        claimedAt: new Date(),
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        updatedAt: new Date()
      },
      { new: true }
    )

    // Add business ID to user's businessIds array if not already there
    if (!user.businessIds?.includes(businessId)) {
      await User.findByIdAndUpdate(
        user._id,
        {
          $addToSet: { businessIds: businessId },
          updatedAt: new Date()
        }
      )
    }

    // TODO: Send email notification to admin/review team
    // For now, log the claim request - in production, send email to wilfordderek@gmail.com
    console.log(`🏢 NEW BUSINESS CLAIM REQUEST`)
    console.log(`Business: ${business.name}`)
    console.log(`Claimed by: ${claimerName} (${claimerEmail})`)
    console.log(`Phone: ${business.phone || 'Not provided'}`)
    console.log(`Address: ${business.address || 'Not provided'}`)
    console.log(`Message: ${message || 'No message provided'}`)
    console.log(`📧 ADMIN NOTIFICATION: Send details to wilfordderek@gmail.com`)

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
