import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business as BusinessModel } from '@/models'
import type { ApiResponse, Business } from '@/types'

// PATCH /api/admin/businesses/[id] - Admin actions on businesses
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id: businessId } = await params
    const body = await request.json()
    const { action } = body

    // Find the business
    const business = await BusinessModel.findOne({ id: businessId })
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      )
    }

    const updateData: Partial<Business> = {}

    switch (action) {
      case 'toggle_featured':
        Object.assign(updateData, { featured: !business.featured })
        break
      case 'toggle_verified':
        Object.assign(updateData, { verified: !business.verified })
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update the business
    const updatedBusiness = await BusinessModel.findOneAndUpdate(
      { id: businessId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    )

    console.log(`🔧 ADMIN ACTION: ${action} on business ${business.name} (${businessId})`)

    const response: ApiResponse<typeof updatedBusiness> = {
      success: true,
      data: updatedBusiness,
      message: `Business ${action} completed successfully`
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Admin business action error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to perform admin action' 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/businesses/[id] - Delete unclaimed business
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id: businessId } = await params

    // Find the business
    const business = await BusinessModel.findOne({ id: businessId })
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of unclaimed businesses
    if (business.isClaimed) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete claimed businesses' },
        { status: 403 }
      )
    }

    // Delete the business
    await BusinessModel.deleteOne({ id: businessId })

    console.log(`🗑️ ADMIN DELETE: Unclaimed business ${business.name} (${businessId}) deleted`)

    const response: ApiResponse<null> = {
      success: true,
      message: 'Business deleted successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Admin business deletion error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete business' 
      },
      { status: 500 }
    )
  }
}
