import { NextRequest, NextResponse } from 'next/server'
import { BusinessScraperService } from '@/lib/businessScraperService'
import type { ApiResponse } from '@/types'

// POST endpoint to trigger business scraping
export async function POST(request: NextRequest) {
  try {
    console.log('Business scraper API called')
    
    const businessScraperService = new BusinessScraperService()
    const result = await businessScraperService.scrapeBusinesses()
    
    const hasErrors = result.errors.length > 0
    
    const response: ApiResponse<typeof result> = {
      success: !hasErrors,
      data: result,
      message: `Business scraping completed: ${result.new} new businesses, ${result.updated} updated businesses${hasErrors ? ' (with errors)' : ''}`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Business scraper API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to scrape businesses' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check scraper status and recent stats
export async function GET() {
  try {
    const businessScraperService = new BusinessScraperService()
    
    // Get some basic stats
    const allBusinesses = await businessScraperService.getBusinesses({ limit: 1000 })
    const freeBusinesses = await businessScraperService.getBusinesses({ subscriptionTier: 'free', limit: 1000 })
    const premiumBusinesses = await businessScraperService.getBusinesses({})
    const featuredBusinesses = await businessScraperService.getBusinesses({ featured: true, limit: 1000 })
    
    const premiumCount = premiumBusinesses.filter(b => 
      ['silver', 'gold', 'platinum'].includes(b.subscriptionTier)
    ).length
    
    const claimedCount = premiumBusinesses.filter(b => b.isClaimed).length
    
    const stats = {
      total: allBusinesses.length,
      free: freeBusinesses.length,
      premium: premiumCount,
      featured: featuredBusinesses.length,
      claimed: claimedCount,
      categories: getCategoryBreakdown(allBusinesses)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'ready',
        stats: stats,
        message: 'Business scraper is operational'
      }
    })
  } catch (error) {
    console.error('Business scraper status error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get business scraper status' 
      },
      { status: 500 }
    )
  }
}

function getCategoryBreakdown(businesses: any[]) {
  const categories: Record<string, number> = {}
  
  businesses.forEach(business => {
    const category = business.category || 'other'
    categories[category] = (categories[category] || 0) + 1
  })
  
  return categories
}
