import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'
import type { ApiResponse } from '@/types'

// GET /api/businesses/[id] - Get single business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id: businessId } = await params

    console.log('Looking for business with ID:', businessId); // Debug log

    // Find the business
    const business = await Business.findOne({ id: businessId })
    if (!business) {
      console.log('Business not found for ID:', businessId); // Debug log
      return NextResponse.json(
        { 
          success: false, 
          error: 'Business not found' 
        },
        { status: 404 }
      )
    }

    console.log('Found business:', business.name, 'Claimed:', business.isClaimed); // Debug log

    return NextResponse.json({
      success: true,
      data: business
    })

  } catch (error) {
    console.error('Error fetching business:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch business' 
      },
      { status: 500 }
    )
  }
}

// PUT /api/businesses/[id] - Update business information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id: businessId } = await params
    const body = await request.json()
    const { name, description, phone, email, website, address } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Business name is required' 
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

    // Check if business is claimed (only claimed businesses can be edited)
    if (!business.isClaimed) {
      return NextResponse.json(
        { success: false, error: 'Only claimed businesses can be edited' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      description: description?.trim() || '',
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      website: website?.trim() || '',
      address: address?.trim() || '',
      updatedAt: new Date()
    }

    // Validate email format if provided
    if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate website URL format if provided
    if (updateData.website && updateData.website !== '') {
      try {
        new URL(updateData.website)
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid website URL format' },
          { status: 400 }
        )
      }
    }

    // Update business
    const updatedBusiness = await Business.findOneAndUpdate(
      { id: businessId },
      updateData,
      { new: true }
    )

    console.log(`📝 BUSINESS UPDATED: ${updatedBusiness.name} (${businessId})`)

    const response: ApiResponse<typeof updatedBusiness> = {
      success: true,
      data: updatedBusiness,
      message: 'Business information updated successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Update business error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update business information' 
      },
      { status: 500 }
    )
  }
}
