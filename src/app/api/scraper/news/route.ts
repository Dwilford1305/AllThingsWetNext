import { NextRequest, NextResponse } from 'next/server'
import { NewsScraperService } from '@/lib/newsScraperService'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    let source: string | undefined = undefined
    
    // Try to parse JSON body, but don't fail if it's empty
    try {
      const body = await request.json()
      source = body.source
    } catch (_error) {
      // No JSON body provided, use default
      console.log('No JSON body provided, using default sources')
    }
    
    const scraperService = new NewsScraperService()
    const sources = source ? [source] : ['all']
    
    console.log(`Starting news scraping for: ${sources.join(', ')}`)
    const result = await scraperService.scrapeNews(sources)
    
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: `Scraping completed: ${result.new} new articles, ${result.updated} updated articles`
    }

    return NextResponse.json(response)
  } catch (_error) {
    console.error('News scraper API error:', _error)
    return NextResponse.json(
      { 
        success: false, 
        error: _error instanceof Error ? _error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const scraperService = new NewsScraperService()
    const status = await scraperService.getScrapingStatus()
    
    const response: ApiResponse<typeof status> = {
      success: true,
      data: status
    }

    return NextResponse.json(response)
  } catch (_error) {
    console.error('News scraper status API error:', _error)
    return NextResponse.json(
      { 
        success: false, 
        error: _error instanceof Error ? _error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}
