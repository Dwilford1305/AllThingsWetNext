import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { BusinessRequest } from '@/models/businessRequest'
import { User } from '@/models/auth'
import { Business } from '@/models'
import { AuthService } from '@/lib/auth'
import { EmailService } from '@/lib/emailService'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the JWT token
    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = AuthService.verifyAccessToken(token)
    } catch (_error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const user = await User.findOne({ id: decoded.userId })
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'all'
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build query
    const query: { status?: string } = {}
    if (status !== 'all') {
      query.status = status
    }

    // Get business requests with pagination
    const requests = await BusinessRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const total = await BusinessRequest.countDocuments(query)

    // Get summary stats
    const stats = await BusinessRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count
      return acc
    }, { pending: 0, approved: 0, rejected: 0 })

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: statusCounts
    })

  } catch (error) {
    console.error('Error fetching business requests:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the JWT token
    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = AuthService.verifyAccessToken(token)
    } catch (_error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const admin = await User.findOne({ id: decoded.userId })
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { requestId, status, adminNotes } = body

    if (!requestId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid request. requestId and valid status (approved/rejected) are required' 
      }, { status: 400 })
    }

    // Find the business request
    const businessRequest = await BusinessRequest.findOne({ id: requestId })
    if (!businessRequest) {
      return NextResponse.json({ error: 'Business request not found' }, { status: 404 })
    }

    if (businessRequest.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending requests can be updated' 
      }, { status: 400 })
    }

    // Update the request
    businessRequest.status = status
    businessRequest.adminNotes = adminNotes || ''
    businessRequest.reviewedBy = decoded.userId
    businessRequest.reviewedAt = new Date()
    businessRequest.updatedAt = new Date()

    await businessRequest.save()

    // If approved, create the business listing
    if (status === 'approved') {
      try {
        const businessId = `business_${Date.now()}_${Math.random().toString(36).substring(2)}`
        
        const newBusiness = new Business({
          id: businessId,
          name: businessRequest.businessName,
          description: businessRequest.description,
          category: mapBusinessTypeToCategory(businessRequest.businessType),
          address: businessRequest.address,
          phone: businessRequest.phone,
          email: businessRequest.email,
          website: businessRequest.website,
          
          // Mark as claimed by the requester
          isClaimed: true,
          claimedBy: businessRequest.userEmail, // Use email for consistency with business lookup
          claimedAt: new Date(),
          
          // Set as verified since admin approved it
          verified: true,
          
          // Default values
          subscriptionTier: 'free',
          subscriptionStatus: 'inactive',
          analytics: {
            views: 0,
            clicks: 0,
            callClicks: 0,
            websiteClicks: 0
          },
          
          createdAt: new Date(),
          updatedAt: new Date()
        })

        await newBusiness.save()
        console.log(`Created business listing ${businessId} for approved request ${requestId}`)
        
        // Send business approval notification email
        try {
          await EmailService.sendBusinessApprovalNotification(
            businessRequest.userEmail,
            businessRequest.businessName,
            businessId
          )
          console.log(`Business approval notification sent to ${businessRequest.userEmail}`)
        } catch (emailError) {
          console.error('Failed to send approval notification email:', emailError)
        }
        
      } catch (businessError) {
        console.error('Failed to create business listing:', businessError)
        // Don't fail the whole operation if business creation fails
      }
    }

    // Don't send the generic confirmation email for status updates
    // The approval notification is sent above, rejection emails can be added separately if needed

    return NextResponse.json({
      success: true,
      message: `Business request ${status} successfully`,
      request: businessRequest
    })

  } catch (error) {
    console.error('Error updating business request:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper function to map business request types to business categories
function mapBusinessTypeToCategory(businessType: string): string {
  const typeMapping: Record<string, string> = {
    'restaurant': 'restaurant',
    'cafe': 'restaurant',
    'food': 'restaurant',
    'dining': 'restaurant',
    'retail': 'retail',
    'shop': 'retail',
    'store': 'retail',
    'shopping': 'retail',
    'automotive': 'automotive',
    'car': 'automotive',
    'auto': 'automotive',
    'vehicle': 'automotive',
    'health': 'health',
    'medical': 'health',
    'healthcare': 'health',
    'clinic': 'health',
    'doctor': 'health',
    'dental': 'health',
    'professional': 'professional',
    'service': 'professional',
    'consulting': 'professional',
    'legal': 'professional',
    'accounting': 'professional',
    'home': 'home-services',
    'construction': 'home-services',
    'contractor': 'home-services',
    'repair': 'home-services',
    'maintenance': 'home-services',
    'beauty': 'beauty',
    'salon': 'beauty',
    'spa': 'beauty',
    'hair': 'beauty',
    'nail': 'beauty',
    'recreation': 'recreation',
    'fitness': 'recreation',
    'gym': 'recreation',
    'sports': 'recreation',
    'entertainment': 'recreation',
    'education': 'education',
    'school': 'education',
    'training': 'education',
    'learning': 'education',
    'non-profit': 'non-profit',
    'charity': 'non-profit',
    'organization': 'non-profit'
  }

  // Convert to lowercase for matching
  const lowerType = businessType.toLowerCase()
  
  // Check for exact matches first
  if (typeMapping[lowerType]) {
    return typeMapping[lowerType]
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(typeMapping)) {
    if (lowerType.includes(key) || key.includes(lowerType)) {
      return value
    }
  }
  
  // Default fallback
  return 'other'
}
