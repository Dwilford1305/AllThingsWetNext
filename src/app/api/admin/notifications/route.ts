import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth-middleware';
import AdminNotificationService from '@/lib/adminNotificationService';

/**
 * GET /api/admin/notifications
 * Fetch admin notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeRead = searchParams.get('includeRead') === 'true';

    const notificationService = AdminNotificationService.getInstance();
    
    const [notifications, unreadCount, statistics] = await Promise.all([
      notificationService.getRecentNotifications(limit, includeRead),
      notificationService.getUnreadCount(),
      notificationService.getStatistics()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        statistics
      }
    });

  } catch (error) {
    console.error('Admin notifications API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/notifications
 * Mark notification(s) as read
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    const notificationService = AdminNotificationService.getInstance();

    if (markAllAsRead) {
      const count = await notificationService.markAllAsRead();
      return NextResponse.json({
        success: true,
        message: `Marked ${count} notifications as read`
      });
    } else if (notificationId) {
      const success = await notificationService.markAsRead(notificationId);
      return NextResponse.json({
        success,
        message: success ? 'Notification marked as read' : 'Notification not found or already read'
      });
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or markAllAsRead must be provided' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Admin notifications PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/notifications
 * Cleanup old notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('daysOld') || '90');

    const notificationService = AdminNotificationService.getInstance();
    const deletedCount = await notificationService.cleanupOldNotifications(daysOld);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} old notifications`,
      deletedCount
    });

  } catch (error) {
    console.error('Admin notifications DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup notifications' },
      { status: 500 }
    );
  }
}
