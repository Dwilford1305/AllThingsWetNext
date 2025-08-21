import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ScraperLog } from '@/models';
import { withRole, type AuthenticatedRequest } from '@/lib/auth-middleware';

async function getScraperLogs(request: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // If requesting specific type, return 3 most recent logs for that type
    if (type) {
      const logs = await ScraperLog.find({ type })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();
      
  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown';
  console.log(`🪵 SCRAPER LOGS VIEW (${type}) by ${actor}`);
  return NextResponse.json({
        success: true,
        logs
      });
    }
    
    // If no type specified, return 3 most recent logs for each type
    const allLogs = await ScraperLog.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    // Group by type and get 3 most recent for each
    const logsByType = {
      news: allLogs.filter(log => log.type === 'news').slice(0, 3),
      events: allLogs.filter(log => log.type === 'events').slice(0, 3),
      businesses: allLogs.filter(log => log.type === 'businesses').slice(0, 3)
    };
    
    // Combine and sort by creation date
    const filteredLogs = [...logsByType.news, ...logsByType.events, ...logsByType.businesses]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown';
  console.log(`🪵 SCRAPER LOGS DASHBOARD VIEW by ${actor}`);
  return NextResponse.json({
      success: true,
      logs: filteredLogs
    });
  } catch (error) {
    console.error('Error fetching scraper logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch scraper logs'
    }, { status: 500 });
  }
}

async function createScraperLog(request: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { type, status, message, duration, itemsProcessed, errors } = body;
    
    const newLog = new ScraperLog({
      type,
      status,
      message,
      duration,
      itemsProcessed,
      errorMessages: errors || [] // Map 'errors' input to 'errorMessages' field
    });
    
    await newLog.save();
    
    // Clean up old logs - keep only last 50 logs per type
    const logsToKeep = await ScraperLog.find({ type })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('_id');
    
    const idsToKeep = logsToKeep.map(log => log._id);
    await ScraperLog.deleteMany({ 
      type, 
      _id: { $nin: idsToKeep } 
    });
    
  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown';
  console.log(`🪵 SCRAPER LOG CREATED by ${actor}: ${type} ${status}`);
  return NextResponse.json({
      success: true,
      log: newLog
    });
  } catch (error) {
    console.error('Error creating scraper log:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create scraper log'
    }, { status: 500 });
  }
}

export const GET = withRole(['admin','super_admin'], getScraperLogs);
export const POST = withRole(['admin','super_admin'], createScraperLog);
