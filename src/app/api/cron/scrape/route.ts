import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import { ScraperLog, ScraperConfig } from '@/models'
import { ComprehensiveScraperService } from '@/lib/comprehensiveScraperService'
import { NewsScraperService, type NewsScrapingResult } from '@/lib/newsScraperService'
import { ScraperService } from '@/lib/scraperService'
import { BusinessScraperService } from '@/lib/businessScraperService'

interface ScraperResults {
  news?: NewsScrapingResult
  events?: {
    total: number
    new: number 
    updated: number
    errors: string[]
  }
  businesses?: {
    total: number
    new: number 
    updated: number
    errors: string[]
  }
}

// Helper function to log scraper activities
async function logScraperActivity(
  type: 'news' | 'events' | 'businesses',
  status: 'started' | 'completed' | 'error',
  message: string,
  duration?: number,
  itemsProcessed?: number,
  errors?: string[]
) {
  try {
    await connectDB()
    
    const log = new ScraperLog({
      type,
      status,
      message,
      duration,
      itemsProcessed: itemsProcessed || 0,
      errorMessages: errors || []
    })
    
    await log.save()
  } catch (error) {
    console.error('Failed to log scraper activity:', error)
  }
}

// Helper function to update scraper configuration after successful run
async function updateScraperConfig(type: 'news' | 'events' | 'businesses') {
  try {
    await connectDB()
    
    const now = new Date()
    
    // Calculate next run time based on scraper type
    let nextRun: Date
    
    if (type === 'businesses') {
      // Business scraper runs weekly at 6 AM Mountain Time (same time as daily scrapers, but weekly)
      nextRun = new Date(now)
      nextRun.setUTCHours(13, 0, 0, 0) // 6 AM Mountain Time = 1 PM UTC
      
      // Add 7 days for weekly schedule
      nextRun.setUTCDate(nextRun.getUTCDate() + 7)
      
      // If the calculated next run is in the past (shouldn't happen with +7 days, but safety check)
      if (nextRun <= now) {
        nextRun.setUTCDate(nextRun.getUTCDate() + 7)
      }
    } else {
      // News and events scrapers run daily at 6 AM Mountain Time
      // Mountain Time is UTC-7 (or UTC-6 during DST), so 6 AM MT = 13:00 UTC (or 12:00 UTC during DST)
      // For simplicity, using 13:00 UTC (1 PM UTC = 6 AM MT during standard time)
      nextRun = new Date(now)
      nextRun.setUTCHours(13, 0, 0, 0) // 6 AM Mountain Time = 1 PM UTC
      
      // If we've already passed 1 PM UTC today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setUTCDate(nextRun.getUTCDate() + 1)
      }
    }
    
    await ScraperConfig.findOneAndUpdate(
      { type },
      {
        lastRun: now,
        nextRun: nextRun,
        isActive: false, // Mark as not currently running
        updatedAt: now
      },
      { upsert: true }
    )
    
    console.log(`✅ Updated ${type} scraper config: lastRun=${now.toISOString()}, nextRun=${nextRun.toISOString()}`)
  } catch (error) {
    console.error(`Failed to update ${type} scraper config:`, error)
  }
}

// Shared executor used by both GET (Vercel Cron) and POST (manual/admin)
async function executeCron(request: NextRequest) {
  const startTime = Date.now()

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'both'
  const force = searchParams.get('force') === 'true'

  console.log(`🔄 Cron job triggered: type=${type}, force=${force}`)

  const results: ScraperResults = {}

  if (type === 'news' || type === 'both') {
    // Respect configuration (skip if disabled)
    const newsCfg = await ScraperConfig.findOne({ type: 'news' })
    if (newsCfg && newsCfg.isEnabled === false) {
      console.log('⏭️ News scraper skipped (disabled by config)')
      await logScraperActivity('news', 'completed', 'News scraper skipped (disabled)', 0, 0, [])
    } else {
      console.log('📰 Running news scraper...')
      await logScraperActivity('news', 'started', 'News scraper initiated by cron job')
      const newsStartTime = Date.now()
      try {
        const newsService = new NewsScraperService()
        const newsResults = await newsService.scrapeNews(['all'])
        results.news = newsResults
        const newsDuration = Date.now() - newsStartTime
        await logScraperActivity(
          'news',
          'completed',
          `News scraping completed: ${newsResults.new} new, ${newsResults.updated} updated, ${newsResults.errors.length} errors`,
          newsDuration,
          newsResults.total,
          newsResults.errors
        )
        await updateScraperConfig('news')
      } catch (error) {
        const newsDuration = Date.now() - newsStartTime
        const errorMessage = error instanceof Error ? error.message : 'News scraper failed'
        await logScraperActivity('news', 'error', errorMessage, newsDuration, 0, [errorMessage])
        throw error
      }
    }
  }

  if (type === 'events' || type === 'both') {
    const eventsCfg = await ScraperConfig.findOne({ type: 'events' })
    if (eventsCfg && eventsCfg.isEnabled === false) {
      console.log('⏭️ Events scraper skipped (disabled by config)')
      await logScraperActivity('events', 'completed', 'Events scraper skipped (disabled)', 0, 0, [])
    } else {
      console.log('📅 Running events scraper...')
      await logScraperActivity('events', 'started', 'Events scraper initiated by cron job')
      const eventsStartTime = Date.now()
      try {
        const eventsService = new ScraperService()
        const eventsResults = await eventsService.scrapeAllEvents()
        results.events = eventsResults
        const eventsDuration = Date.now() - eventsStartTime
        await logScraperActivity(
          'events',
          'completed',
          `Events scraping completed: ${eventsResults.new} new, ${eventsResults.updated} updated, ${eventsResults.errors.length} errors`,
          eventsDuration,
          eventsResults.total,
          eventsResults.errors
        )
        await updateScraperConfig('events')
      } catch (error) {
        const eventsDuration = Date.now() - eventsStartTime
        const errorMessage = error instanceof Error ? error.message : 'Events scraper failed'
        await logScraperActivity('events', 'error', errorMessage, eventsDuration, 0, [errorMessage])
        throw error
      }
    }
  }

  if (type === 'businesses' || type === 'all') {
    const bizCfg = await ScraperConfig.findOne({ type: 'businesses' })
    if (bizCfg && bizCfg.isEnabled === false) {
      console.log('⏭️ Business scraper skipped (disabled by config)')
      await logScraperActivity('businesses', 'completed', 'Business scraper skipped (disabled)', 0, 0, [])
    } else {
      console.log('🏢 Running business scraper...')
      await logScraperActivity('businesses', 'started', 'Business scraper initiated by cron job')
      const businessStartTime = Date.now()
      try {
        const businessService = new BusinessScraperService()
        const businessResults = await businessService.scrapeBusinesses()
        results.businesses = businessResults
        const businessDuration = Date.now() - businessStartTime
        await logScraperActivity(
          'businesses',
          'completed',
          `Business scraping completed: ${businessResults.new} new, ${businessResults.updated} updated, ${businessResults.errors.length} errors`,
          businessDuration,
          businessResults.total,
          businessResults.errors
        )
        await updateScraperConfig('businesses')
      } catch (error) {
        const businessDuration = Date.now() - businessStartTime
        const errorMessage = error instanceof Error ? error.message : 'Business scraper failed'
        await logScraperActivity('businesses', 'error', errorMessage, businessDuration, 0, [errorMessage])
        throw error
      }
    }
  }

  const totalDuration = Date.now() - startTime
  console.log(`✅ Cron job completed successfully in ${totalDuration}ms`)

  return NextResponse.json({
    success: true,
    data: results,
    timestamp: new Date().toISOString(),
    message: `Scheduled scraping completed for ${type}`,
    duration: totalDuration
  })
}

export async function GET(request: NextRequest) {
  // If request is from Vercel Cron (or authorized with CRON_SECRET), execute; otherwise return status
  const h = await headers()
  const isVercelCron = (h.get('vercel-cron') !== null) || (h.get('x-vercel-cron') !== null)
  const auth = h.get('authorization')
  const hasBearer = process.env.CRON_SECRET ? auth === `Bearer ${process.env.CRON_SECRET}` : false

  if (isVercelCron || hasBearer) {
    if (isVercelCron) console.log('⏰ Detected Vercel Cron (GET)')
    return executeCron(request)
  }

  try {
    // Status endpoint - check when scrapers last ran
    const scraperService = new ComprehensiveScraperService()
    const stats = await scraperService.getScrapingStats()
    
    return NextResponse.json({
      success: true,
      data: {
        lastEventsRun: stats.events.lastRun,
        lastNewsRun: stats.news.lastRun,
        systemHealth: stats.overall.systemHealth,
        nextScheduled: '6:00 AM Mountain Time daily'
      }
    })
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get scraper status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Allow manual POST if either Bearer token matches CRON_SECRET or request comes from Vercel Cron
  const h = await headers()
  const auth = h.get('authorization')
  const isVercelCron = (h.get('vercel-cron') !== null) || (h.get('x-vercel-cron') !== null)

  if (process.env.CRON_SECRET) {
    const ok = auth === `Bearer ${process.env.CRON_SECRET}` || isVercelCron
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    return await executeCron(request)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Scraping failed'
    console.error('❌ Cron job failed:', error)
    return NextResponse.json(
      { success: false, error: errorMessage, timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
