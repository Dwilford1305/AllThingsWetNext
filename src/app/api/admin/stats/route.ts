import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Business } from '@/models';
import { Event } from '@/models';
import { NewsArticle } from '@/models';
import { withRole, type AuthenticatedRequest } from '@/lib/auth-middleware';

interface AdminStatsResponse {
  businesses: {
    total: number;
    claimed: number;
    premium: number;
    revenue: number;
  };
  content: {
    events: number;
    news: number;
    jobs: number;
    classifieds: number;
  };
  scrapers: {
    lastRun: string;
    status: 'active' | 'error' | 'idle';
    errors: number;
  };
  system: {
    uptime: string;
    dbSize: string;
    activeUsers: number;
  };
}

async function getStats(request: AuthenticatedRequest) {
  try {
    await connectDB();

    // Business statistics
    const totalBusinesses = await Business.countDocuments();
    const claimedBusinesses = await Business.countDocuments({ isClaimed: true });
    const premiumBusinesses = await Business.countDocuments({ 
      subscriptionTier: { $in: ['silver', 'gold', 'platinum'] } 
    });

    // Calculate revenue
    const subscriptionRevenue = await Business.aggregate([
      {
        $match: {
          subscriptionTier: { $in: ['silver', 'gold', 'platinum'] },
          subscriptionStatus: 'active'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$subscriptionTier', 'silver'] }, then: 19.99 },
                  { case: { $eq: ['$subscriptionTier', 'gold'] }, then: 39.99 },
                  { case: { $eq: ['$subscriptionTier', 'platinum'] }, then: 79.99 }
                ],
                default: 0
              }
            }
          }
        }
      }
    ]);

    const monthlyRevenue = subscriptionRevenue.length > 0 ? subscriptionRevenue[0].totalRevenue : 0;

    // Content statistics
    const eventsCount = await Event.countDocuments();
    const newsCount = await NewsArticle.countDocuments();

    // Scraper status (simplified - in production you'd check actual scraper logs)
    const lastScraperRun = await NewsArticle.findOne().sort({ createdAt: -1 });
    const scraperStatus = lastScraperRun ? 'active' : 'idle';

    // System statistics (simplified)
    const stats: AdminStatsResponse = {
      businesses: {
        total: totalBusinesses,
        claimed: claimedBusinesses,
        premium: premiumBusinesses,
        revenue: monthlyRevenue
      },
      content: {
        events: eventsCount,
        news: newsCount,
        jobs: 0, // Placeholder - implement if you have jobs model
        classifieds: 0 // Placeholder - implement if you have classifieds model
      },
      scrapers: {
        lastRun: lastScraperRun ? lastScraperRun.createdAt.toISOString() : new Date().toISOString(),
        status: scraperStatus,
        errors: 0 // Placeholder - implement error tracking
      },
      system: {
        uptime: process.uptime().toString(),
        dbSize: 'N/A', // Would need MongoDB admin access
        activeUsers: 0 // Placeholder - implement user tracking
      }
    };

  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown';
  console.log(`📊 ADMIN STATS VIEW by ${actor}`);
  return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch admin statistics' 
      },
      { status: 500 }
    );
  }
}

export const GET = withRole(['admin','super_admin'], getStats);
