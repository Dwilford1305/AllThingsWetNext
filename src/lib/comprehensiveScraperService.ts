import { connectDB } from '@/lib/mongodb'
import { Event, NewsArticle, Business, ScraperLog } from '@/models'
import { ScraperService } from './scraperService'
import { NewsScraperService } from './newsScraperService'
import { BusinessScraperService } from './businessScraperService'

export interface ScrapingResult {
  type: 'news' | 'events' | 'businesses'
  success: boolean
  total: number
  new: number
  updated: number
  deleted: number
  errors: string[]
  timestamp: Date
  duration: number
}

export interface ScrapingStats {
  lastRun: Date | null
  nextRun: Date | null
  isRunning: boolean
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  averageDuration: number
  lastErrors: string[]
}

export class ComprehensiveScraperService {
  private eventService = new ScraperService()
  private newsService = new NewsScraperService()
  private businessService = new BusinessScraperService()

  async scrapeAll(options: {
    clearOldData?: boolean
    forceRefresh?: boolean
  } = {}): Promise<{
    events: ScrapingResult
    news: ScrapingResult
    businesses: ScrapingResult
    summary: {
      totalItems: number
      totalNew: number
      totalUpdated: number
      totalDeleted: number
      totalErrors: number
      duration: number
    }
  }> {
    const startTime = Date.now()
    
    console.log('🚀 Starting comprehensive scraping process...')
    
    try {
      await connectDB()
      
      // Run all scrapers concurrently for better performance
      const [eventsResult, newsResult, businessResult] = await Promise.all([
        this.scrapeEvents(options),
        this.scrapeNews(options),
        this.scrapeBusinesses(options)
      ])
      
      const duration = Date.now() - startTime
      
      // Save scraping session log
      await this.saveScrapingSession({
        events: eventsResult,
        news: newsResult,
        businesses: businessResult,
        duration
      })
      
      const summary = {
        totalItems: eventsResult.total + newsResult.total + businessResult.total,
        totalNew: eventsResult.new + newsResult.new + businessResult.new,
        totalUpdated: eventsResult.updated + newsResult.updated + businessResult.updated,
        totalDeleted: eventsResult.deleted + newsResult.deleted + businessResult.deleted,
        totalErrors: eventsResult.errors.length + newsResult.errors.length + businessResult.errors.length,
        duration
      }
      
      console.log(`✅ Comprehensive scraping completed in ${duration}ms`)
      console.log(`📊 Summary: ${summary.totalItems} items, ${summary.totalNew} new, ${summary.totalUpdated} updated, ${summary.totalDeleted} deleted`)
      
      return {
        events: eventsResult,
        news: newsResult,
        businesses: businessResult,
        summary
      }
      
    } catch (error) {
      console.error('❌ Comprehensive scraping failed:', error)
      throw error
    }
  }

  private async scrapeEvents(options: { clearOldData?: boolean, forceRefresh?: boolean }): Promise<ScrapingResult> {
    const startTime = Date.now()
    let deletedCount = 0
    
    try {
      console.log('📅 Starting events scraping...')
      
      // Always clean up old events (events past their scheduled date)
      console.log('🗑️ Cleaning up past events...')
      const now = new Date()
      now.setHours(23, 59, 59, 999) // End of today
      
      const pastEventsResult = await Event.deleteMany({
        $or: [
          { startDate: { $lt: now } },
          { date: { $lt: now } },
          { endDate: { $lt: now } }
        ]
      })
      deletedCount += pastEventsResult.deletedCount || 0
      console.log(`Deleted ${pastEventsResult.deletedCount || 0} past events`)
      
      // Clear old data if requested
      if (options.clearOldData) {
        console.log('🗑️ Clearing old events data...')
        const deleteResult = await Event.deleteMany({})
        deletedCount = deleteResult.deletedCount || 0
        console.log(`Deleted ${deletedCount} old events`)
      }
      
      // If force refresh, clear all scraped events (keep manual ones)
      if (options.forceRefresh) {
        console.log('🔄 Force refreshing events...')
        const deleteResult = await Event.deleteMany({
          $and: [
            { sourceUrl: { $exists: true } },
            { sourceUrl: { $ne: null } },
            { sourceUrl: { $ne: '' } }
          ]
        })
        deletedCount = deleteResult.deletedCount || 0
        console.log(`Deleted ${deletedCount} scraped events for refresh`)
      }
      
      const result = await this.eventService.scrapeAllEvents()
      
      return {
        type: 'events',
        success: true,
        total: result.total,
        new: result.new,
        updated: result.updated,
        deleted: deletedCount,
        errors: result.errors,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
      
    } catch (error) {
      console.error('❌ Events scraping failed:', error)
      return {
        type: 'events',
        success: false,
        total: 0,
        new: 0,
        updated: 0,
        deleted: deletedCount,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async scrapeNews(options: { clearOldData?: boolean, forceRefresh?: boolean }): Promise<ScrapingResult> {
    const startTime = Date.now()
    let deletedCount = 0
    
    try {
      console.log('📰 Starting news scraping...')
      
      // Always clean up old news articles (older than 15 days)
      console.log('🗑️ Cleaning up old news articles...')
      const fifteenDaysAgo = new Date()
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
      
      const oldNewsResult = await NewsArticle.deleteMany({
        $or: [
          { publishedAt: { $lt: fifteenDaysAgo } },
          { createdAt: { $lt: fifteenDaysAgo } }
        ]
      })
      deletedCount += oldNewsResult.deletedCount || 0
      console.log(`Deleted ${oldNewsResult.deletedCount || 0} old news articles`)
      
      // Clear old data if requested
      if (options.clearOldData) {
        console.log('🗑️ Clearing old news data...')
        const deleteResult = await NewsArticle.deleteMany({})
        deletedCount = deleteResult.deletedCount || 0
        console.log(`Deleted ${deletedCount} old news articles`)
      }
      
      // If force refresh, clear all scraped news (keep manual ones)
      if (options.forceRefresh) {
        console.log('🔄 Force refreshing news...')
        const deleteResult = await NewsArticle.deleteMany({
          $and: [
            { sourceUrl: { $exists: true } },
            { sourceUrl: { $ne: null } },
            { sourceUrl: { $ne: '' } }
          ]
        })
        deletedCount = deleteResult.deletedCount || 0
        console.log(`Deleted ${deletedCount} scraped news articles for refresh`)
      }
      
      const result = await this.newsService.scrapeNews(['all'])
      
      return {
        type: 'news',
        success: true,
        total: result.total,
        new: result.new,
        updated: result.updated,
        deleted: deletedCount,
        errors: result.errors,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
      
    } catch (error) {
      console.error('❌ News scraping failed:', error)
      return {
        type: 'news',
        success: false,
        total: 0,
        new: 0,
        updated: 0,
        deleted: deletedCount,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async scrapeBusinesses(options: { clearOldData?: boolean, forceRefresh?: boolean }): Promise<ScrapingResult> {
    const startTime = Date.now()
    let deletedCount = 0
    
    try {
      console.log('🏢 Starting businesses scraping...')
      
      // Clear old data if requested (but preserve claimed businesses)
      if (options.clearOldData) {
        console.log('🗑️ Clearing old unclaimed businesses data...')
        const deleteResult = await Business.deleteMany({
          isClaimed: { $ne: true }
        })
        deletedCount = deleteResult.deletedCount || 0
        console.log(`Deleted ${deletedCount} old unclaimed businesses`)
      }
      
      // If force refresh, clear all scraped businesses (but preserve claimed ones)
      if (options.forceRefresh) {
        console.log('🔄 Force refreshing businesses...')
        const deleteResult = await Business.deleteMany({
          $and: [
            { isClaimed: { $ne: true } },
            { sourceUrl: { $exists: true } },
            { sourceUrl: { $ne: null } },
            { sourceUrl: { $ne: '' } }
          ]
        })
        deletedCount = deleteResult.deletedCount || 0
        console.log(`Deleted ${deletedCount} scraped businesses for refresh`)
      }
      
      const result = await this.businessService.scrapeBusinesses()
      
      return {
        type: 'businesses',
        success: true,
        total: result.total,
        new: result.new,
        updated: result.updated,
        deleted: deletedCount,
        errors: result.errors,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
      
    } catch (error) {
      console.error('❌ Businesses scraping failed:', error)
      return {
        type: 'businesses',
        success: false,
        total: 0,
        new: 0,
        updated: 0,
        deleted: deletedCount,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async saveScrapingSession(data: {
    events: ScrapingResult
    news: ScrapingResult
    businesses: ScrapingResult
    duration: number
  }) {
    try {
      const logEntry = new ScraperLog({
        type: 'comprehensive',
        status: 'completed',
        results: data,
        timestamp: new Date(),
        duration: data.duration
      })
      
      await logEntry.save()
      
      // Keep only last 100 log entries
      const logCount = await ScraperLog.countDocuments()
      if (logCount > 100) {
        const oldLogs = await ScraperLog.find().sort({ timestamp: 1 }).limit(logCount - 100)
        await ScraperLog.deleteMany({ _id: { $in: oldLogs.map(log => log._id) } })
      }
      
    } catch (error) {
      console.error('Error saving scraping session:', error)
    }
  }

  async getScrapingStats(): Promise<{
    events: ScrapingStats
    news: ScrapingStats
    businesses: ScrapingStats
    overall: {
      totalItems: number
      lastFullScrape: Date | null
      systemHealth: 'healthy' | 'warning' | 'error'
    }
  }> {
    try {
      await connectDB()
      
      // Get recent logs for each type
      const [eventsLogs, newsLogs, businessLogs, comprehensiveLogs] = await Promise.all([
        ScraperLog.find({ type: 'events' }).sort({ timestamp: -1 }).limit(10),
        ScraperLog.find({ type: 'news' }).sort({ timestamp: -1 }).limit(10),
        ScraperLog.find({ type: 'businesses' }).sort({ timestamp: -1 }).limit(10),
        ScraperLog.find({ type: 'comprehensive' }).sort({ timestamp: -1 }).limit(5)
      ])
      
      // Get current counts
      const [eventCount, newsCount, businessCount] = await Promise.all([
        Event.countDocuments(),
        NewsArticle.countDocuments(),
        Business.countDocuments()
      ])
      
      const eventsStats = this.calculateStats(eventsLogs)
      const newsStats = this.calculateStats(newsLogs)
      const businessStats = this.calculateStats(businessLogs)
      
      const lastFullScrape = comprehensiveLogs.length > 0 ? comprehensiveLogs[0].timestamp : null
      
      // Determine system health
      let systemHealth: 'healthy' | 'warning' | 'error' = 'healthy'
      if (eventsStats.lastRun && (Date.now() - eventsStats.lastRun.getTime()) > 24 * 60 * 60 * 1000) {
        systemHealth = 'warning' // Last scrape was more than 24 hours ago
      }
      if (eventsStats.lastErrors.length > 0 || newsStats.lastErrors.length > 0 || businessStats.lastErrors.length > 0) {
        systemHealth = 'error'
      }
      
      return {
        events: eventsStats,
        news: newsStats,
        businesses: businessStats,
        overall: {
          totalItems: eventCount + newsCount + businessCount,
          lastFullScrape,
          systemHealth
        }
      }
      
    } catch (error) {
      console.error('Error getting scraping stats:', error)
      throw error
    }
  }

  private calculateStats(logs: unknown[]): ScrapingStats {
    if (logs.length === 0) {
      return {
        lastRun: null,
        nextRun: null,
        isRunning: false,
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageDuration: 0,
        lastErrors: []
      }
    }
    
    const successfulRuns = (logs as { status: string }[]).filter(log => log.status === 'completed').length
    const failedRuns = (logs as { status: string }[]).filter(log => log.status === 'failed').length
    const totalDuration = (logs as { duration?: number }[]).reduce((sum, log) => sum + (log.duration || 0), 0)
    
    return {
      lastRun: new Date((logs[0] as { timestamp: string | Date }).timestamp),
      nextRun: null, // Will be calculated based on schedule
      isRunning: (logs[0] as { status: string }).status === 'running',
      totalRuns: logs.length,
      successfulRuns,
      failedRuns,
      averageDuration: (totalDuration as number) / logs.length,
      lastErrors: (logs.slice(0, 3) as { errors?: string[] }[]).flatMap(log => log.errors || [])
    }
  }

  async clearAllData(): Promise<{
    events: number
    news: number
    businesses: number
  }> {
    try {
      await connectDB()
      
      console.log('🗑️ Clearing all scraped data...')
      
      const [eventsResult, newsResult, businessResult] = await Promise.all([
        Event.deleteMany({}),
        NewsArticle.deleteMany({}),
        Business.deleteMany({ isClaimed: { $ne: true } }) // Keep claimed businesses
      ])
      
      const cleared = {
        events: eventsResult.deletedCount || 0,
        news: newsResult.deletedCount || 0,
        businesses: businessResult.deletedCount || 0
      }
      
      console.log(`🗑️ Cleared: ${cleared.events} events, ${cleared.news} news, ${cleared.businesses} businesses`)
      
      return cleared
      
    } catch (error) {
      console.error('Error clearing data:', error)
      throw error
    }
  }
}
