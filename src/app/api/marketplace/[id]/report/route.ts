import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MarketplaceListing, Report, User } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { v4 as uuidv4 } from 'uuid'
import type { ApiResponse } from '@/types'

// Report a marketplace listing
async function reportListing(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    
    const listingId = (context?.params as { id?: string } | undefined)?.id
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID missing' },
        { status: 400 }
      )
    }
    
    const userId = request.user?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Verify listing exists
    const listing = await MarketplaceListing.findOne({ id: listingId })
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { reason, description } = body

    if (!reason || !description) {
      return NextResponse.json(
        { success: false, error: 'Reason and description are required' },
        { status: 400 }
      )
    }

    // Get user info
    const user = await User.findOne({ id: userId })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already reported this listing
    const existingReport = await Report.findOne({
      reporterUserId: userId,
      reportType: 'listing',
      contentId: listingId
    })

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'You have already reported this listing' },
        { status: 409 }
      )
    }

    const reporterName = `${user.firstName} ${user.lastName}`

    // Create report
    const reportId = uuidv4()
    const report = new Report({
      id: reportId,
      reporterUserId: userId,
      reporterName,
      reportType: 'listing',
      contentId: listingId,
      reason,
      description,
      status: 'pending'
    })

    await report.save()

    // Update listing report count
    listing.isReported = true
    listing.reportCount += 1
    await listing.save()

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      data: { reportId }
    })

  } catch (error) {
    console.error('Report listing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit report' 
      },
      { status: 500 }
    )
  }
}

export const POST = withAuth(reportListing)