import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth-middleware';
import { connectDB } from '@/lib/mongodb';
import { EmailAnalytics, EmailQueue, EmailPreferences } from '@/models/email';
import PushNotificationService from '@/lib/pushNotificationService';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get email analytics data
    const [
      totalEmailsSent,
      emailsByTemplate,
      openRates,
      clickRates,
      bounceRates,
      queueStats,
      preferencesStats,
      pushStats,
      recentEmails
    ] = await Promise.all([
      // Total emails sent
      EmailAnalytics.countDocuments({
        sentAt: { $gte: startDate }
      }),

      // Emails by template type
      EmailAnalytics.aggregate([
        { $match: { sentAt: { $gte: startDate } } },
        { $group: { _id: '$templateType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Open rates by template
      EmailAnalytics.aggregate([
        { $match: { sentAt: { $gte: startDate } } },
        { 
          $group: { 
            _id: '$templateType', 
            total: { $sum: 1 },
            opened: { $sum: { $cond: ['$opened', 1, 0] } }
          } 
        },
        { 
          $project: { 
            _id: 1,
            total: 1,
            opened: 1,
            openRate: { 
              $round: [
                { $multiply: [{ $divide: ['$opened', '$total'] }, 100] }, 
                2
              ] 
            }
          } 
        },
        { $sort: { total: -1 } }
      ]),

      // Click rates by template
      EmailAnalytics.aggregate([
        { $match: { sentAt: { $gte: startDate } } },
        { 
          $group: { 
            _id: '$templateType', 
            total: { $sum: 1 },
            clicked: { $sum: { $cond: ['$clicked', 1, 0] } }
          } 
        },
        { 
          $project: { 
            _id: 1,
            total: 1,
            clicked: 1,
            clickRate: { 
              $round: [
                { $multiply: [{ $divide: ['$clicked', '$total'] }, 100] }, 
                2
              ] 
            }
          } 
        },
        { $sort: { total: -1 } }
      ]),

      // Bounce rates
      EmailAnalytics.aggregate([
        { $match: { sentAt: { $gte: startDate } } },
        { 
          $group: { 
            _id: '$templateType', 
            total: { $sum: 1 },
            bounced: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'bounced'] }, 1, 0] } }
          } 
        },
        { 
          $project: { 
            _id: 1,
            total: 1,
            bounced: 1,
            bounceRate: { 
              $round: [
                { $multiply: [{ $divide: ['$bounced', '$total'] }, 100] }, 
                2
              ] 
            }
          } 
        },
        { $sort: { total: -1 } }
      ]),

      // Email queue statistics
      EmailQueue.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // User preferences statistics
      EmailPreferences.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            marketingOptIn: { $sum: { $cond: ['$preferences.marketing', 1, 0] } },
            newsletterOptIn: { $sum: { $cond: ['$preferences.newsletter', 1, 0] } },
            eventNotificationsOptIn: { $sum: { $cond: ['$preferences.eventNotifications', 1, 0] } },
            pushNotificationsEnabled: { $sum: { $cond: ['$pushNotifications.enabled', 1, 0] } },
            unsubscribedAll: { $sum: { $cond: ['$unsubscribedFromAll', 1, 0] } }
          }
        }
      ]),

      // Push notification statistics
      PushNotificationService.getInstance().getStatistics(),

      // Recent email activity
      EmailAnalytics.find({
        sentAt: { $gte: startDate }
      })
      .sort({ sentAt: -1 })
      .limit(10)
      .select('templateType recipientEmail sentAt opened clicked deliveryStatus')
    ]);

    // Calculate daily email activity for the chart
    const dailyActivity = await EmailAnalytics.aggregate([
      { $match: { sentAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$sentAt' },
            month: { $month: '$sentAt' },
            day: { $dayOfMonth: '$sentAt' }
          },
          sent: { $sum: 1 },
          opened: { $sum: { $cond: ['$opened', 1, 0] } },
          clicked: { $sum: { $cond: ['$clicked', 1, 0] } },
          bounced: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'bounced'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Format queue statistics
    const queueStatsFormatted = queueStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      retrying: 0
    });

    // Calculate overall metrics
    const overallOpenRate = openRates.length > 0 
      ? Math.round((openRates.reduce((sum, rate) => sum + rate.opened, 0) / 
                   openRates.reduce((sum, rate) => sum + rate.total, 0)) * 100)
      : 0;

    const overallClickRate = clickRates.length > 0
      ? Math.round((clickRates.reduce((sum, rate) => sum + rate.clicked, 0) / 
                   clickRates.reduce((sum, rate) => sum + rate.total, 0)) * 100)
      : 0;

    const overallBounceRate = bounceRates.length > 0
      ? Math.round((bounceRates.reduce((sum, rate) => sum + rate.bounced, 0) / 
                   bounceRates.reduce((sum, rate) => sum + rate.total, 0)) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalEmailsSent,
          overallOpenRate,
          overallClickRate,
          overallBounceRate,
          timeRange: days
        },
        emailsByTemplate,
        openRates,
        clickRates,
        bounceRates,
        queueStats: queueStatsFormatted,
        preferencesStats: preferencesStats[0] || {
          totalUsers: 0,
          marketingOptIn: 0,
          newsletterOptIn: 0,
          eventNotificationsOptIn: 0,
          pushNotificationsEnabled: 0,
          unsubscribedAll: 0
        },
        pushStats,
        dailyActivity,
        recentEmails
      }
    });

  } catch (error) {
    console.error('Email analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email analytics' },
      { status: 500 }
    );
  }
}

// Process email queue manually (admin action)
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { action } = await request.json();

    switch (action) {
      case 'process_queue':
        // TODO: Trigger email queue processing
        // This would normally be handled by the cron job
        return NextResponse.json({
          success: true,
          message: 'Email queue processing triggered'
        });

      case 'clear_failed':
        await connectDB();
        const result = await EmailQueue.deleteMany({
          status: 'failed',
          attempts: { $gte: 3 }
        });
        
        return NextResponse.json({
          success: true,
          message: `Cleared ${result.deletedCount} failed emails from queue`
        });

      case 'retry_failed':
        await connectDB();
        await EmailQueue.updateMany(
          { status: 'failed', attempts: { $lt: 3 } },
          { 
            $set: { 
              status: 'pending',
              nextRetryAt: new Date()
            }
          }
        );
        
        return NextResponse.json({
          success: true,
          message: 'Failed emails scheduled for retry'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Email action error:', error);
    return NextResponse.json(
      { error: 'Failed to process email action' },
      { status: 500 }
    );
  }
}