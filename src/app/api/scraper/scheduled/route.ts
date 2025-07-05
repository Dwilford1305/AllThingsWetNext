import { NextRequest, NextResponse } from 'next/server'
import { ScraperService } from '@/lib/scraperService'
import type { ApiResponse } from '@/types'

// This endpoint can be called by cron jobs or external schedulers
export async function POST(request: NextRequest) {
  try {
    // Check for authorization header (basic security)
    const authHeader = request.headers.get('authorization')
    const expectedAuth = process.env.SCRAPER_AUTH_TOKEN
    
    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    const clearSeed = searchParams.get('clearSeed') === 'true'
    
    const scraperService = new ScraperService()
    
    // Check if we should run based on timing (unless forced)
    if (!force) {
      const lastRun = await getLastRunTime()
      const hoursSinceLastRun = lastRun ? (Date.now() - lastRun) / (1000 * 60 * 60) : 999
      
      // Only run if it's been more than 6 hours since last run
      if (hoursSinceLastRun < 6) {
        return NextResponse.json({
          success: true,
          message: `Skipped scraping - last run was ${hoursSinceLastRun.toFixed(1)} hours ago`,
          data: { skipped: true, lastRun: new Date(lastRun!) }
        })
      }
    }
    
    let clearedCount = 0
    
    // Clear seed data if requested
    if (clearSeed) {
      clearedCount = await scraperService.clearSeedData()
    }
    
    // Run the scrapers
    const results = await scraperService.scrapeAllEvents()
    
    // Update last run time
    await setLastRunTime(Date.now())
    
    const response: ApiResponse<typeof results & { clearedSeedEvents?: number; timestamp: string }> = {
      success: true,
      data: {
        ...results,
        ...(clearSeed && { clearedSeedEvents: clearedCount }),
        timestamp: new Date().toISOString()
      },
      message: `Scheduled scraping completed: ${results.new} new events, ${results.updated} updated events${clearSeed ? `, ${clearedCount} seed events cleared` : ''}`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Scheduled scraper error:', error)
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
    const lastRun = await getLastRunTime()
    
    return NextResponse.json({
      success: true,
      data: {
        lastRun: lastRun ? new Date(lastRun) : null,
        nextScheduled: lastRun ? new Date(lastRun + 6 * 60 * 60 * 1000) : null, // 6 hours later
        status: 'ready'
      },
      message: 'Scheduled scraper status'
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to get scraper status' },
      { status: 500 }
    )
  }
}

// Simple file-based storage for last run time
// In production, this could use Redis or database
async function getLastRunTime(): Promise<number | null> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), '.scraper-last-run')
    const content = await fs.readFile(filePath, 'utf8')
    return parseInt(content)
  } catch {
    return null
  }
}

async function setLastRunTime(timestamp: number): Promise<void> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), '.scraper-last-run')
    await fs.writeFile(filePath, timestamp.toString())
  } catch (error) {
    console.warn('Failed to save last run time:', error)
  }
}
