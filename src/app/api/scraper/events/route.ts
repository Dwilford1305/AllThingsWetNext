import { NextRequest, NextResponse } from 'next/server'
import { ScraperService } from '@/lib/scraperService'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clearSeed = searchParams.get('clearSeed') === 'true'
    
    const scraperService = new ScraperService()
    
    let clearedCount = 0
    
    // Clear seed data if requested
    if (clearSeed) {
      clearedCount = await scraperService.clearSeedData()
    }
    
    // Run the scrapers
    const results = await scraperService.scrapeAllEvents()
    
    const response: ApiResponse<typeof results & { clearedSeedEvents?: number }> = {
      success: true,
      data: {
        ...results,
        ...(clearSeed && { clearedSeedEvents: clearedCount })
      },
      message: `Scraping completed: ${results.new} new events, ${results.updated} updated events${clearSeed ? `, ${clearedCount} seed events cleared` : ''}`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Scraper API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to run scrapers'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Events scraper API is ready. Use POST to run scrapers.',
    endpoints: {
      'POST /api/scraper/events': 'Run event scrapers',
      'POST /api/scraper/events?clearSeed=true': 'Clear seed data and run event scrapers'
    }
  })
}
