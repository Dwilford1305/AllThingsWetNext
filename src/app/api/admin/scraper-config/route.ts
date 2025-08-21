import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ScraperConfig } from '@/models';
import { withRole, type AuthenticatedRequest } from '@/lib/auth-middleware';

async function getScraperConfigs(request: AuthenticatedRequest) {
  try {
    await connectDB();
    
    // Get all scraper configurations
    const configs = await ScraperConfig.find({}).lean();
    
    // Initialize default configs if they don't exist
    const defaultConfigs = [
      { type: 'news', intervalHours: 6, isEnabled: true },
      { type: 'events', intervalHours: 6, isEnabled: true },
      { type: 'businesses', intervalHours: 168, isEnabled: true } // weekly
    ];
    
    for (const defaultConfig of defaultConfigs) {
      const exists = configs.find(c => c.type === defaultConfig.type);
      if (!exists) {
        const newConfig = new ScraperConfig(defaultConfig);
        await newConfig.save();
        configs.push(newConfig.toObject());
      }
    }
    
  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown';
  console.log(`🛠️ SCRAPER CONFIG LIST by ${actor}`);
  return NextResponse.json({
      success: true,
      configs
    });
  } catch (error) {
    console.error('Error fetching scraper configs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch scraper configurations'
    }, { status: 500 });
  }
}

async function updateScraperConfig(request: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { type, intervalHours, isEnabled } = body;
    
    // Validate required fields
    if (!type) {
      return NextResponse.json({
        success: false,
        error: 'Type is required'
      }, { status: 400 });
    }
    
    // Validate and convert intervalHours to a number
    const parsedIntervalHours = Number(intervalHours);
    if (isNaN(parsedIntervalHours) || parsedIntervalHours <= 0) {
      return NextResponse.json({
        success: false,
        error: 'intervalHours must be a positive number'
      }, { status: 400 });
    }
    
    // Calculate next run time
    const now = new Date();
    const nextRun = new Date(now.getTime() + (parsedIntervalHours * 60 * 60 * 1000));
    
    const config = await ScraperConfig.findOneAndUpdate(
      { type },
      {
        intervalHours: parsedIntervalHours,
        isEnabled: Boolean(isEnabled),
        nextRun: isEnabled ? nextRun : null,
        updatedAt: now
      },
      { 
        new: true, 
        upsert: true 
      }
    );
    
  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown';
  console.log(`🛠️ SCRAPER CONFIG UPSERT by ${actor}: ${type}`);
  return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error updating scraper config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update scraper configuration'
    }, { status: 500 });
  }
}

async function patchScraperConfig(request: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { type, isActive, lastRun } = body;
    
    if (!type) {
      return NextResponse.json({
        success: false,
        error: 'Type is required'
      }, { status: 400 });
    }
    
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    
    if (lastRun) {
      updateData.lastRun = new Date(lastRun);
      
      // Calculate next run based on interval
      const config = await ScraperConfig.findOne({ type });
      if (config && config.isEnabled && config.intervalHours && config.intervalHours > 0) {
        const nextRunTime = new Date(Date.now() + (config.intervalHours * 60 * 60 * 1000));
        updateData.nextRun = nextRunTime;
      }
    }
    
    const config = await ScraperConfig.findOneAndUpdate(
      { type },
      updateData,
      { new: true }
    );
    
    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Scraper configuration not found'
      }, { status: 404 });
    }
    
  const actor = request.user ? `${request.user.role}:${request.user.id}` : 'unknown';
  console.log(`🛠️ SCRAPER CONFIG PATCH by ${actor}: ${type}`);
  return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error updating scraper status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update scraper status'
    }, { status: 500 });
  }
}

export const GET = withRole(['admin','super_admin'], getScraperConfigs);
export const POST = withRole(['admin','super_admin'], updateScraperConfig);
export const PATCH = withRole(['admin','super_admin'], patchScraperConfig);
