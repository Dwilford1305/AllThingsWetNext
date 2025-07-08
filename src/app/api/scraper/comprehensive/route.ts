import { NextRequest, NextResponse } from 'next/server'
import { ComprehensiveScraperService } from '@/lib/comprehensiveScraperService'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clearOldData = searchParams.get('clearOldData') === 'true'
    const forceRefresh = searchParams.get('forceRefresh') === 'true'
    
    console.log('🚀 Starting comprehensive scraping...')
    console.log(`Options: clearOldData=${clearOldData}, forceRefresh=${forceRefresh}`)
    
    const scraperService = new ComprehensiveScraperService()
    
    const results = await scraperService.scrapeAll({
      clearOldData,
      forceRefresh
    })
    
    const response: ApiResponse<typeof results> = {
      success: true,
      data: results,
      message: `Comprehensive scraping completed: ${results.summary.totalNew} new items, ${results.summary.totalUpdated} updated, ${results.summary.totalDeleted} deleted in ${results.summary.duration}ms`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Comprehensive scraper API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to run comprehensive scrapers'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const scraperService = new ComprehensiveScraperService()
    const stats = await scraperService.getScrapingStats()
    
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      message: 'Comprehensive scraper status retrieved successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Comprehensive scraper status API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get comprehensive scraper status'
      },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ Clearing all scraped data...')
    
    const scraperService = new ComprehensiveScraperService()
    const cleared = await scraperService.clearAllData()
    
    const response: ApiResponse<typeof cleared> = {
      success: true,
      data: cleared,
      message: `All scraped data cleared: ${cleared.events} events, ${cleared.news} news, ${cleared.businesses} businesses`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Clear data API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear scraped data'
      },
      { status: 500 }
    )
  }
}
