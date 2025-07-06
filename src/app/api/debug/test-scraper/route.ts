import { NextRequest, NextResponse } from 'next/server'
import { WetaskiwinBusinessScraper } from '@/lib/scrapers/wetaskiwinBusiness'

export async function GET(request: NextRequest) {
  try {
    const scraper = new WetaskiwinBusinessScraper()
    
    // Test scraping just the first page to see parsing quality
    const businesses = await scraper.scrapeSinglePage('https://www.wetaskiwin.ca/businessdirectoryii.aspx')
    
    return NextResponse.json({
      success: true,
      data: {
        count: businesses.length,
        businesses: businesses.slice(0, 5) // Just first 5 for testing
      }
    })
  } catch (error) {
    console.error('Test scraper error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test scraper',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
