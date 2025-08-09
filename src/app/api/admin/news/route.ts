import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { NewsArticle } from '@/models';
import { withRole, type AuthenticatedRequest } from '@/lib/auth-middleware';

async function postNewsAction(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'News article ID and action are required' },
        { status: 400 }
      );
    }

    const article = await NewsArticle.findOne({ id });
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'News article not found' },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case 'approve':
        result = await NewsArticle.findOneAndUpdate(
          { id },
          { 
            status: 'approved',
            updatedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'reject':
        result = await NewsArticle.findOneAndUpdate(
          { id },
          { 
            status: 'rejected',
            updatedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'delete':
        result = await NewsArticle.deleteOne({ id });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Log admin action
  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown';
  console.log(`🔧 ADMIN NEWS ACTION (${actor}): ${action} on article ${article.title} (${id})`);

    return NextResponse.json({
      success: true,
      data: { article: result },
      message: `News article ${action} successful`
    });

  } catch (error) {
    console.error('Admin news action error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to perform news action' 
      },
      { status: 500 }
    );
  }
}

export const POST = withRole(['admin','super_admin'], postNewsAction);
