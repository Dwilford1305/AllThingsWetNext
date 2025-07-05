import { BaseScraper, ScrapedEvent, ScraperConfig } from './base'

export class ConnectWetaskiwinScraper extends BaseScraper {
  constructor() {
    const config: ScraperConfig = {
      url: 'https://connectwetaskiwin.com/calendar-of-events.html',
      sourceName: 'Connect Wetaskiwin',
      timeout: 30000
    }
    super(config)
  }

  async scrape(): Promise<ScrapedEvent[]> {
    try {
      const events: ScrapedEvent[] = []

      console.log('Connect Wetaskiwin: Fetching events from Tockify calendar...')
      
      // Fetch the Tockify calendar page directly, which contains the JSON-LD structured data
      const tockifyUrl = 'https://tockify.com/connectwetaskiwin'
      const $ = await this.fetchPage(tockifyUrl)
      
      // The Tockify calendar page contains events in JSON-LD script tags
      $('script[type="application/ld+json"]').each((index, element) => {
        try {
          const jsonText = $(element).html()
          if (jsonText) {
            const structuredData = JSON.parse(jsonText)
            
            // Handle both single events and arrays of events
            const eventsArray = Array.isArray(structuredData) ? structuredData : [structuredData]
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            eventsArray.forEach((eventData: any) => {
              try {
                if (eventData['@type'] === 'Event') {
                  const title = eventData.name || 'Untitled Event'
                  const description = eventData.description || title
                  const startDate = eventData.startDate
                  const endDate = eventData.endDate
                  
                  if (!startDate) {
                    console.log(`Skipping event without start date: ${title}`)
                    return
                  }
                  
                  // Parse the date - it's in ISO format
                  const eventDate = new Date(startDate)
                  
                  // Validate the date
                  if (isNaN(eventDate.getTime())) {
                    console.log(`Skipping event with invalid date: ${title} - ${startDate}`)
                    return
                  }
                  
                  // Only include future events
                  if (eventDate <= new Date()) {
                    return
                  }
                  
                  // Extract location information
                  let location = 'Wetaskiwin, AB'
                  let address = ''
                  
                  if (eventData.location) {
                    if (Array.isArray(eventData.location)) {
                      // Handle multiple locations (virtual + physical)
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const physicalLocation = eventData.location.find((loc: any) => loc['@type'] === 'Place')
                      if (physicalLocation) {
                        location = physicalLocation.name || location
                        if (physicalLocation.address) {
                          address = physicalLocation.address.streetAddress || ''
                        }
                      }
                    } else if (eventData.location['@type'] === 'Place') {
                      location = eventData.location.name || location
                      if (eventData.location.address) {
                        address = eventData.location.address.streetAddress || ''
                      }
                    }
                  }
                  
                  // Combine location and address
                  if (address && address !== location) {
                    location = `${location}, ${address}`
                  }
                  
                  // Extract time from the ISO date with proper validation
                  let timeStr = 'All Day'
                  if (eventDate && !isNaN(eventDate.getTime())) {
                    // Check if the original startDate contains time information
                    if (startDate && typeof startDate === 'string' && startDate.includes('T')) {
                      // Has time information
                      timeStr = eventDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })
                    } else {
                      // No time information, treat as all-day event
                      timeStr = 'All Day'
                    }
                  }
                  
                  // Extract image URL
                  let imageUrl: string | undefined
                  if (eventData.image && Array.isArray(eventData.image) && eventData.image.length > 0) {
                    imageUrl = eventData.image[0]
                  }
                  
                  // Create the event object
                  const event: ScrapedEvent = {
                    title,
                    description,
                    date: eventDate,
                    endDate: endDate ? new Date(endDate) : undefined,
                    time: timeStr,
                    location: location.trim(),
                    category: this.categorizeEvent(title, description),
                    organizer: 'Connect Wetaskiwin',
                    website: eventData.url || this.config.url,
                    imageUrl,
                    sourceUrl: this.config.url, // Keep original source URL
                    sourceName: this.config.sourceName
                  }
                  
                  events.push(event)
                  console.log(`Found event: ${title} on ${eventDate.toDateString()}`)
                }
              } catch (error) {
                console.warn('Error processing individual event:', error)
              }
            })
          }
        } catch (error) {
          console.warn(`Error parsing JSON-LD script at index ${index}:`, error)
        }
      })

      console.log(`ConnectWetaskiwin scraper found ${events.length} events`)
      return events
    } catch (error) {
      console.error('ConnectWetaskiwin scraper error:', error)
      return []
    }
  }

  private resolveUrl(url: string): string {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('//')) return `https:${url}`
    if (url.startsWith('/')) return `https://connectwetaskiwin.com${url}`
    return `https://connectwetaskiwin.com/${url}`
  }
}
