// Add debug endpoint to test business parsing
import { NextResponse } from 'next/server'
import { WetaskiwinBusinessScraper } from '../../../../lib/scrapers/wetaskiwinBusiness'

export async function GET() {
  try {
    console.log('Debug: Starting business scraper test...')
    
    const scraper = new WetaskiwinBusinessScraper()
    
    // Test the scraper with debug logging
    const businesses = await scraper.scrapeBusinessPage('https://www.wetaskiwin.ca/businessdirectoryii.aspx')
    
    console.log(`Debug: Found ${businesses.length} businesses`)
    
    return NextResponse.json({
      success: true,
      count: businesses.length,
      sample: businesses.slice(0, 3) // Return first 3 for debugging
    })
    
  } catch (error) {
    console.error('Debug: Error in business scraper test:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
