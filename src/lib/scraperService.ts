import { connectDB } from '@/lib/mongodb'
import { Event } from '@/models'
import { ConnectWetaskiwinScraper, WetaskiwinCaScraper } from './scrapers'
import type { ScrapedEvent } from './scrapers'

export class ScraperService {
  private scrapers = [
    new ConnectWetaskiwinScraper(),
    new WetaskiwinCaScraper()
  ]

  async scrapeAllEvents(): Promise<{ total: number; new: number; updated: number; errors: string[] }> {
    const results = { total: 0, new: 0, updated: 0, errors: [] as string[] }
    
    try {
      await connectDB()
      
      // Get all scraped events
      const allScrapedEvents: ScrapedEvent[] = []
      
      for (const scraper of this.scrapers) {
        try {
          console.log(`Running scraper: ${scraper.constructor.name}`)
          const events = await scraper.scrape()
          allScrapedEvents.push(...events)
          console.log(`${scraper.constructor.name} found ${events.length} events`)
        } catch (error) {
          const errorMsg = `Error in ${scraper.constructor.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg)
          results.errors.push(errorMsg)
        }
      }

      results.total = allScrapedEvents.length

      // Process and save events to database
      for (const scrapedEvent of allScrapedEvents) {
        try {
          const eventId = this.generateEventId(scrapedEvent.title, scrapedEvent.date)
          
          // Check if event already exists
          const existingEvent = await Event.findOne({ id: eventId })
          
          const eventData = {
            id: eventId,
            title: scrapedEvent.title,
            description: scrapedEvent.description,
            date: scrapedEvent.date,
            endDate: scrapedEvent.endDate,
            time: scrapedEvent.time,
            location: scrapedEvent.location,
            category: scrapedEvent.category,
            organizer: scrapedEvent.organizer,
            contactEmail: scrapedEvent.contactEmail,
            contactPhone: scrapedEvent.contactPhone,
            website: scrapedEvent.website,
            imageUrl: scrapedEvent.imageUrl,
            featured: false, // Scraped events are not featured by default
            price: scrapedEvent.price || 0,
            ticketUrl: scrapedEvent.ticketUrl,
            sourceUrl: scrapedEvent.sourceUrl,
            sourceName: scrapedEvent.sourceName,
            updatedAt: new Date()
          }

          if (existingEvent) {
            // Update existing event
            await Event.findOneAndUpdate({ id: eventId }, eventData)
            results.updated++
            console.log(`Updated event: ${scrapedEvent.title}`)
          } else {
            // Create new event
            const newEvent = new Event({
              ...eventData,
              createdAt: new Date()
            })
            await newEvent.save()
            results.new++
            console.log(`Created new event: ${scrapedEvent.title}`)
          }
        } catch (error) {
          const errorMsg = `Error saving event "${scrapedEvent.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg)
          results.errors.push(errorMsg)
        }
      }

      console.log(`Scraping completed: ${results.total} total, ${results.new} new, ${results.updated} updated, ${results.errors.length} errors`)
      return results
      
    } catch (error) {
      const errorMsg = `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
      return results
    }
  }

  async clearSeedData(): Promise<number> {
    try {
      await connectDB()
      
      // Delete events that don't have a sourceUrl (these are seed data)
      const deleteResult = await Event.deleteMany({ 
        $or: [
          { sourceUrl: { $exists: false } },
          { sourceUrl: null },
          { sourceUrl: '' }
        ]
      })
      
      console.log(`Deleted ${deleteResult.deletedCount} seed events`)
      return deleteResult.deletedCount
    } catch (error) {
      console.error('Error clearing seed data:', error)
      throw error
    }
  }

  private generateEventId(title: string, date: Date): string {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
    const dateStr = date.toISOString().split('T')[0]
    return `${cleanTitle}-${dateStr}`
  }
}
