import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Business } from '@/models';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { businessId, action } = await request.json();

    if (!businessId || !action) {
      return NextResponse.json(
        { success: false, error: 'Business ID and action are required' },
        { status: 400 }
      );
    }

    const business = await Business.findOne({ id: businessId });
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'approve':
        updateData = {
          status: 'approved',
          updatedAt: new Date()
        };
        break;

      case 'reject':
        updateData = {
          status: 'rejected',
          updatedAt: new Date()
        };
        break;

      case 'feature':
        updateData = {
          featured: !business.featured,
          updatedAt: new Date()
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedBusiness = await Business.findOneAndUpdate(
      { id: businessId },
      updateData,
      { new: true }
    );

    // Log admin action
    console.log(`🔧 ADMIN ACTION: ${action} performed on business ${business.name} (${businessId})`);

    return NextResponse.json({
      success: true,
      data: { business: updatedBusiness },
      message: `Business ${action} successful`
    });

  } catch (error) {
    console.error('Admin business action error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to perform business action' 
      },
      { status: 500 }
    );
  }
}
