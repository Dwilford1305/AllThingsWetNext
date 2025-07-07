import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Event } from '@/models';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'Event ID and action are required' },
        { status: 400 }
      );
    }

    const event = await Event.findOne({ id });
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case 'approve':
        result = await Event.findOneAndUpdate(
          { id },
          { 
            status: 'approved',
            updatedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'reject':
        result = await Event.findOneAndUpdate(
          { id },
          { 
            status: 'rejected',
            updatedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'delete':
        result = await Event.deleteOne({ id });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Log admin action
    console.log(`🔧 ADMIN ACTION: ${action} performed on event ${event.title} (${id})`);

    return NextResponse.json({
      success: true,
      data: { event: result },
      message: `Event ${action} successful`
    });

  } catch (error) {
    console.error('Admin event action error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to perform event action' 
      },
      { status: 500 }
    );
  }
}
