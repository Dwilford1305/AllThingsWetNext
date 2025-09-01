import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Event, NewsArticle, Business, JobPosting, MarketplaceListing } from '@/models'
import type { ApiResponse } from '@/types'

export async function POST() {
  try {
    await connectDB()

    // Clear existing sample/fake data (optional - only for development)
    // Delete events without sourceUrl (these are fake sample events)
    await Event.deleteMany({
      $or: [
        { sourceUrl: { $exists: false } },
        { sourceUrl: null },
        { sourceUrl: '' },
        { id: { $in: ['ev1', 'ev2', 'ev3', 'ev4', 'ev5'] } } // Remove hardcoded sample IDs
      ]
    })
    
    // Delete news without sourceUrl (these are fake sample news)
    await NewsArticle.deleteMany({
      $or: [
        { sourceUrl: { $exists: false } },
        { sourceUrl: null },
        { sourceUrl: '' },
        { id: { $in: ['n1', 'n2', 'n3', 'n4'] } } // Remove hardcoded sample IDs
      ]
    })
    
    // Don't clear businesses as they are legitimate scraped data
    // Only clear sample businesses with hardcoded IDs
    await Business.deleteMany({
      id: { $in: ['b1', 'b2', 'b3', 'b4', 'b5'] } // Remove hardcoded sample IDs
    })

    // Insert ONLY legitimate sample data that serves as examples
    // For now, don't insert any fake data - only keep real scraped data
    const [events, news, businesses] = await Promise.all([
      Event.find({}), // Just get current real events
      NewsArticle.find({}), // Just get current real news  
      Business.find({}) // Just get current real businesses
    ])

    const response: ApiResponse<{
      events: number;
      news: number;
      businesses: number;
      clearedFakeEvents: number;
      clearedFakeNews: number;
      clearedFakeBusinesses: number;
    }> = {
      success: true,
      data: {
        events: events.length,
        news: news.length,
        businesses: businesses.length,
        clearedFakeEvents: 0, // We can add deletion counts if needed
        clearedFakeNews: 0,
        clearedFakeBusinesses: 0
      },
      message: 'Fake data cleared, legitimate data preserved'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Seed API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process database' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await connectDB()

    // Get counts of all collections
    const [eventsCount, newsCount, businessesCount, jobsCount, marketplaceCount] = await Promise.all([
      Event.countDocuments(),
      NewsArticle.countDocuments(),
      Business.countDocuments(),
      JobPosting.countDocuments(),
      MarketplaceListing.countDocuments()
    ])

    const response: ApiResponse<{
      events: number;
      news: number;
      businesses: number;
      jobs: number;
      marketplace: number;
      total: number;
    }> = {
      success: true,
      data: {
        events: eventsCount,
        news: newsCount,
        businesses: businessesCount,
        jobs: jobsCount,
        marketplace: marketplaceCount,
        total: eventsCount + newsCount + businessesCount + jobsCount + marketplaceCount
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Database status error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get database status' 
      },
      { status: 500 }
    )
  }
}
