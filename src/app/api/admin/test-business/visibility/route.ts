import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'
import { authenticate } from '@/lib/auth-middleware'
import type { ApiResponse } from '@/types'

const TEST_BUSINESS_ID = 'test-platinum-business-admin'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Verify super admin authentication
    const authResult = await authenticate(request)
    if (authResult.error || authResult.user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      )
    }

    const { isHidden } = await request.json()

    // Find and update the test business
    const updatedBusiness = await Business.findOneAndUpdate(
      { id: TEST_BUSINESS_ID },
      { 
        isHidden: Boolean(isHidden),
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedBusiness) {
      return NextResponse.json(
        { success: false, error: 'Test business not found. Please create it first.' },
        { status: 404 }
      )
    }

    console.log(`🔄 Test business visibility updated: ${isHidden ? 'hidden' : 'visible'}`)

    const response: ApiResponse<typeof updatedBusiness> = {
      success: true,
      data: updatedBusiness,
      message: `Test business is now ${isHidden ? 'hidden from' : 'visible in'} the directory`
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Test business visibility update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update visibility' 
      },
      { status: 500 }
    )
  }
}