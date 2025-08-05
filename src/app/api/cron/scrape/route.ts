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

export async function GET() {
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
  const startTime = Date.now()
  
  try {
    // Verify this is actually from Vercel Cron
    const headersList = await headers()
    const cronSecret = headersList.get('authorization')
    const _vercelCron = headersList.get('vercel-cron')
    
    // Basic security check
    if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'both'
    const force = searchParams.get('force') === 'true'

    console.log(`🔄 Cron job triggered: type=${type}, force=${force}`)

    const results: ScraperResults = {}

    if (type === 'news' || type === 'both') {
      console.log('📰 Running news scraper...')
      
      // Log news scraper start
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
        
        // Update scraper configuration with last run time
        await updateScraperConfig('news')
      } catch (error) {
        const newsDuration = Date.now() - newsStartTime
        const errorMessage = error instanceof Error ? error.message : 'News scraper failed'
        await logScraperActivity('news', 'error', errorMessage, newsDuration, 0, [errorMessage])
        throw error
      }
    }

    if (type === 'events' || type === 'both') {
      console.log('📅 Running events scraper...')
      
      // Log events scraper start
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
        
        // Update scraper configuration with last run time
        await updateScraperConfig('events')
      } catch (error) {
        const eventsDuration = Date.now() - eventsStartTime
        const errorMessage = error instanceof Error ? error.message : 'Events scraper failed'
        await logScraperActivity('events', 'error', errorMessage, eventsDuration, 0, [errorMessage])
        throw error
      }
    }

    if (type === 'businesses' || type === 'all') {
      console.log('🏢 Running business scraper...')
      
      // Log business scraper start
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
        
        // Update scraper configuration with last run time
        await updateScraperConfig('businesses')
      } catch (error) {
        const businessDuration = Date.now() - businessStartTime
        const errorMessage = error instanceof Error ? error.message : 'Business scraper failed'
        await logScraperActivity('businesses', 'error', errorMessage, businessDuration, 0, [errorMessage])
        throw error
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

  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error('❌ Cron job failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Scraping failed',
        timestamp: new Date().toISOString(),
        duration: totalDuration
      },
      { status: 500 }
    )
  }
}
