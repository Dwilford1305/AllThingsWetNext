import { NextRequest, NextResponse } from 'next/server'
import { NewsScraperService } from '@/lib/newsScraperService'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { source } = body
    
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
  } catch (error) {
    console.error('News scraper API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
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
  } catch (error) {
    console.error('News scraper status API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}
