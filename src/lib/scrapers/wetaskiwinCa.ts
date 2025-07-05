import { BaseScraper, ScrapedEvent, ScraperConfig } from './base'

export class WetaskiwinCaScraper extends BaseScraper {
  constructor() {
    const config: ScraperConfig = {
      url: 'https://wetaskiwin.ca',
      sourceName: 'City of Wetaskiwin',
      timeout: 30000
    }
    super(config)
  }

  async scrape(): Promise<ScrapedEvent[]> {
    try {
      const events: ScrapedEvent[] = []
      
      // Scrape the calendar page with both City and Community events
      const calendarUrl = 'https://wetaskiwin.ca/calendar.aspx?CID=25,23&showPastEvents=false'
      await this.scrapeCalendarPage(calendarUrl, events)
      
      console.log(`Wetaskiwin.ca scraper found ${events.length} events`)
      return events
    } catch (error) {
      console.error('Wetaskiwin.ca scraper error:', error)
      return []
    }
  }

  private async scrapeCalendarPage(calendarUrl: string, events: ScrapedEvent[]): Promise<void> {
    try {
      const $ = await this.fetchPage(calendarUrl)
      
      // Look for event headings - they are h3 elements with links to Calendar.aspx
      $('h3').each((index, element) => {
        try {
          const $heading = $(element)
          const $link = $heading.find('a[href*="Calendar.aspx"]')
          
          if ($link.length > 0) {
            const title = $link.text().trim()
            const eventUrl = $link.attr('href')
            
            if (title && eventUrl) {
              // Look for event details in the content after the heading
              let description = ''
              let dateText = ''
              let timeText = ''
              let location = ''
              
              // Get the text content after the heading to parse date, time, and location
              let $current = $heading.next()
              while ($current.length > 0 && $current.prop('tagName') !== 'H3') {
                const text = $current.text().trim()
                
                if (text) {
                  // Normalize whitespace - replace non-breaking spaces and other Unicode spaces with regular spaces
                  const normalizedText = text.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
                  
                  // Look for various date and time patterns
                  // Pattern 1: "July 9, 2025, 3:00 PM - 6:00 PM @ Location" or "July 9, 2025, 3:00 PM - 6:00 PM@ Location" (with or without space before @)
                  let dateTimeMatch = normalizedText.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)(?:\s*-\s*\d{1,2}:\d{2} [AP]M)?\s*@?\s*(.+)?/)
                  
                  // Pattern 2: "July 26, 2025, 9:00 AM - July 27, 2025, 5:00 PM" (multi-day)
                  if (!dateTimeMatch) {
                    dateTimeMatch = normalizedText.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)\s*-\s*[A-Za-z]+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/)
                  }
                  
                  // Pattern 3: Simple date time only "July 26, 2025, 10:00 AM" (no end time, no location)
                  if (!dateTimeMatch) {
                    dateTimeMatch = normalizedText.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)/)
                  }
                  
                  if (dateTimeMatch) {
                    dateText = dateTimeMatch[1]
                    timeText = dateTimeMatch[2]
                    
                    // Extract location from the text
                    const locationMatch = normalizedText.match(/@\s*(.+)$/)
                    if (locationMatch) {
                      location = locationMatch[1].trim()
                    } else if (dateTimeMatch[3] && dateTimeMatch[3].trim()) {
                      // If there's a third capture group and it's not empty, it might be location
                      const potentialLocation = dateTimeMatch[3].trim()
                      if (potentialLocation && !potentialLocation.includes('AM') && !potentialLocation.includes('PM')) {
                        location = potentialLocation
                      }
                    }
                    
                    // Get description from the next text content
                    const $nextDesc = $current.next()
                    if ($nextDesc.length > 0) {
                      const descText = $nextDesc.text().trim()
                      if (descText && descText.length > 10 && !descText.includes('More Details')) {
                        description = descText
                      }
                    }
                    
                    break
                  }
                  
                  // If no structured date found, look for description
                  if (!description && text.length > 10 && !text.includes('More Details')) {
                    description = text
                  }
                }
                
                $current = $current.next()
              }
              
              // If we found date information, create the event
              if (dateText && timeText) {
                try {
                  const eventDate = this.parseDate(dateText, timeText)
                  
                  // Only include future events
                  if (eventDate > new Date()) {
                    const event: ScrapedEvent = {
                      title,
                      description: description || title,
                      date: eventDate,
                      time: timeText,
                      location: location || 'Wetaskiwin, AB',
                      category: this.categorizeEvent(title, description || title),
                      organizer: 'City of Wetaskiwin',
                      website: this.resolveUrl(eventUrl),
                      sourceUrl: calendarUrl,
                      sourceName: this.config.sourceName
                    }
                    
                    events.push(event)
                    console.log(`Found event: ${title} on ${eventDate.toDateString()} at ${timeText}`)
                  }
                } catch (parseError) {
                  console.warn(`Error parsing date for event "${title}": ${dateText}, ${timeText}`, parseError)
                }
              } else {
                console.log(`Skipping event "${title}" - no date/time information found`)
              }
            }
          }
        } catch (error) {
          console.warn(`Error processing calendar event at index ${index}:`, error)
        }
      })
    } catch (error) {
      console.warn('Error scraping calendar page:', error)
    }
  }

  private resolveUrl(url: string): string {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('//')) return `https:${url}`
    if (url.startsWith('/')) return `https://wetaskiwin.ca${url}`
    return `https://wetaskiwin.ca/${url}`
  }
}
