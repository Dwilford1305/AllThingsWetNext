import { NextRequest, NextResponse } from 'next/server'
import { NewsScraperService } from '@/lib/newsScraperService'
import { ScraperService } from '@/lib/scraperService'
import { BusinessScraperService } from '@/lib/businessScraperService'
import type { ApiResponse } from '@/types'

// This endpoint handles scheduled scraping for both news and events
// It can be called by Vercel Cron Jobs or external schedulers
export async function POST(request: NextRequest) {
  try {
    // Verify this is coming from a cron job or has the right authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Check for cron secret or Vercel cron headers
    const isVercelCron = request.headers.get('vercel-cron') === '1'
    const hasValidAuth = cronSecret && authHeader === `Bearer ${cronSecret}`
    
    if (!isVercelCron && !hasValidAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // 'news', 'events', 'businesses', or 'all'
    const force = searchParams.get('force') === 'true'
    
    const results = {
      news: { total: 0, new: 0, updated: 0, errors: [] as string[] },
      events: { total: 0, new: 0, updated: 0, errors: [] as string[] },
      businesses: { total: 0, new: 0, updated: 0, errors: [] as string[] },
      timestamp: new Date().toISOString()
    }
    
    // Check if we should run based on timing (unless forced)
    if (!force) {
      const lastRun = await getLastRunTime(type)
      const hoursSinceLastRun = lastRun ? (Date.now() - lastRun) / (1000 * 60 * 60) : 999
      
      // Only run if it's been more than 5 hours since last run (to avoid overlap)
      if (hoursSinceLastRun < 5) {
        return NextResponse.json({
          success: true,
          message: `Skipped ${type} scraping - last run was ${hoursSinceLastRun.toFixed(1)} hours ago`,
          data: { skipped: true, lastRun: new Date(lastRun!), type }
        })
      }
    }
    
    // Run news scraping
    if (type === 'news' || type === 'all') {
      try {
        console.log('Starting scheduled news scraping...')
        const newsScraperService = new NewsScraperService()
        const newsResults = await newsScraperService.scrapeNews(['all'])
        results.news = newsResults
        console.log(`News scraping completed: ${newsResults.new} new, ${newsResults.updated} updated`)
        
        // Update last run time for news
        await setLastRunTime('news', Date.now())
      } catch (error) {
        console.error('Scheduled news scraping error:', error)
        results.news.errors.push(error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    // Run events scraping  
    if (type === 'events' || type === 'all') {
      try {
        console.log('Starting scheduled events scraping...')
        const scraperService = new ScraperService()
        const eventsResults = await scraperService.scrapeAllEvents()
        results.events = eventsResults
        console.log(`Events scraping completed: ${eventsResults.new} new, ${eventsResults.updated} updated`)
        
        // Update last run time for events
        await setLastRunTime('events', Date.now())
      } catch (error) {
        console.error('Scheduled events scraping error:', error)
        results.events.errors.push(error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Run business scraping (less frequent - only when explicitly requested)
    if (type === 'businesses' || (type === 'all' && force)) {
      try {
        console.log('Starting scheduled business scraping...')
        const businessScraperService = new BusinessScraperService()
        const businessResults = await businessScraperService.scrapeBusinesses()
        results.businesses = businessResults
        console.log(`Business scraping completed: ${businessResults.new} new, ${businessResults.updated} updated`)
        
        // Update last run time for businesses
        await setLastRunTime('businesses', Date.now())
      } catch (error) {
        console.error('Scheduled business scraping error:', error)
        results.businesses.errors.push(error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    // Update last run time for combined runs
    if (type === 'all') {
      await setLastRunTime('all', Date.now())
    }
    
    const totalNew = results.news.new + results.events.new
    const totalUpdated = results.news.updated + results.events.updated
    const hasErrors = results.news.errors.length > 0 || results.events.errors.length > 0
    
    const response: ApiResponse<typeof results> = {
      success: !hasErrors,
      data: results,
      message: `Scheduled scraping completed: ${totalNew} new items, ${totalUpdated} updated items${hasErrors ? ' (with errors)' : ''}`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Scheduled scraper API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to run scheduled scrapers',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const newsLastRun = await getLastRunTime('news')
    const eventsLastRun = await getLastRunTime('events')
    const bothLastRun = await getLastRunTime('both')
    
    return NextResponse.json({
      success: true,
      data: {
        news: {
          lastRun: newsLastRun ? new Date(newsLastRun) : null,
          nextScheduled: newsLastRun ? new Date(newsLastRun + 6 * 60 * 60 * 1000) : null,
        },
        events: {
          lastRun: eventsLastRun ? new Date(eventsLastRun) : null,  
          nextScheduled: eventsLastRun ? new Date(eventsLastRun + 6 * 60 * 60 * 1000) : null,
        },
        both: {
          lastRun: bothLastRun ? new Date(bothLastRun) : null,
          nextScheduled: bothLastRun ? new Date(bothLastRun + 6 * 60 * 60 * 1000) : null,
        },
        status: 'ready'
      },
      message: 'Scheduled scraper status'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get scraper status' },
      { status: 500 }
    )
  }
}

// Simple in-memory storage for last run times (in production, use Redis or database)
const lastRunTimes = new Map<string, number>()

async function getLastRunTime(type: string): Promise<number | null> {
  // In production, you might want to store this in your database or Redis
  return lastRunTimes.get(type) || null
}

async function setLastRunTime(type: string, timestamp: number): Promise<void> {
  // In production, you might want to store this in your database or Redis
  lastRunTimes.set(type, timestamp)
}
