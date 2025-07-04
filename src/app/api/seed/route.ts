import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Event, NewsArticle, Business, JobPosting, Classified } from '@/models'
import { sampleEvents, sampleNews, sampleBusinesses, sampleJobs, sampleClassifieds } from '@/data/sampleData'
import type { ApiResponse } from '@/types'

export async function POST() {
  try {
    await connectDB()

    // Clear existing data (optional - only for development)
    await Event.deleteMany({})
    await NewsArticle.deleteMany({})
    await Business.deleteMany({})
    await JobPosting.deleteMany({})
    await Classified.deleteMany({})

    // Insert sample data
    const [events, news, businesses, jobs, classifieds] = await Promise.all([
      Event.insertMany(sampleEvents),
      NewsArticle.insertMany(sampleNews),
      Business.insertMany(sampleBusinesses),
      JobPosting.insertMany(sampleJobs),
      Classified.insertMany(sampleClassifieds)
    ])

    const response: ApiResponse<{
      events: number;
      news: number;
      businesses: number;
      jobs: number;
      classifieds: number;
    }> = {
      success: true,
      data: {
        events: events.length,
        news: news.length,
        businesses: businesses.length,
        jobs: jobs.length,
        classifieds: classifieds.length
      },
      message: 'Database seeded successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Seed API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed database' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await connectDB()

    // Get counts of all collections
    const [eventsCount, newsCount, businessesCount, jobsCount, classifiedsCount] = await Promise.all([
      Event.countDocuments(),
      NewsArticle.countDocuments(),
      Business.countDocuments(),
      JobPosting.countDocuments(),
      Classified.countDocuments()
    ])

    const response: ApiResponse<{
      events: number;
      news: number;
      businesses: number;
      jobs: number;
      classifieds: number;
      total: number;
    }> = {
      success: true,
      data: {
        events: eventsCount,
        news: newsCount,
        businesses: businessesCount,
        jobs: jobsCount,
        classifieds: classifiedsCount,
        total: eventsCount + newsCount + businessesCount + jobsCount + classifiedsCount
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
