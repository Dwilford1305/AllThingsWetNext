import axios, { AxiosInstance } from 'axios'
import * as cheerio from 'cheerio'

export interface ScraperConfig {
  url: string
  sourceName: string
  userAgent?: string
  timeout?: number
  headers?: Record<string, string>
}

export interface ScrapedEvent {
  title: string
  description: string
  date: Date
  endDate?: Date
  time: string
  location: string
  category: string
  organizer: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  imageUrl?: string
  price?: number
  ticketUrl?: string
  sourceUrl: string
  sourceName: string
}

export abstract class BaseScraper {
  protected config: ScraperConfig
  protected axiosInstance: AxiosInstance

  constructor(config: ScraperConfig) {
    this.config = config
    this.axiosInstance = axios.create({
      timeout: config.timeout || 30000,
      headers: {
        'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...config.headers
      }
    })
  }

  protected async fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    try {
      console.log(`Fetching: ${url}`)
      const response = await this.axiosInstance.get(url)
      return cheerio.load(response.data)
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      throw new Error(`Failed to fetch page: ${url}`)
    }
  }

  protected generateEventId(title: string, date: Date): string {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
    const dateStr = date.toISOString().split('T')[0]
    return `${cleanTitle}-${dateStr}`
  }

  protected categorizeEvent(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase()
    
    if (text.includes('music') || text.includes('concert') || text.includes('band')) return 'music'
    if (text.includes('sport') || text.includes('hockey') || text.includes('baseball') || text.includes('soccer')) return 'sports'
    if (text.includes('art') || text.includes('gallery') || text.includes('exhibition')) return 'arts'
    if (text.includes('food') || text.includes('restaurant') || text.includes('dining') || text.includes('market')) return 'food'
    if (text.includes('education') || text.includes('school') || text.includes('learning') || text.includes('workshop')) return 'education'
    if (text.includes('business') || text.includes('networking') || text.includes('conference')) return 'business'
    if (text.includes('family') || text.includes('kids') || text.includes('children')) return 'family'
    if (text.includes('health') || text.includes('fitness') || text.includes('wellness')) return 'health'
    
    return 'community'
  }

  protected parseDate(dateStr: string, timeStr?: string): Date {
    try {
      // Handle various date formats
      let date: Date
      
      // Handle "July 9, 2025" format from wetaskiwin.ca
      if (dateStr.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/)) {
        date = new Date(dateStr)
      }
      // Handle MM/DD/YYYY format
      else if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/')
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      } 
      // Handle YYYY-MM-DD format
      else if (dateStr.includes('-')) {
        date = new Date(dateStr)
      } 
      // Try generic parsing
      else {
        date = new Date(dateStr)
      }

      // Add time if provided
      if (timeStr) {
        const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i)
        if (timeParts) {
          let hours = parseInt(timeParts[1])
          const minutes = parseInt(timeParts[2])
          const ampm = timeParts[3]?.toLowerCase()

          if (ampm === 'pm' && hours !== 12) hours += 12
          if (ampm === 'am' && hours === 12) hours = 0

          date.setHours(hours, minutes, 0, 0)
        }
      }

      // Ensure the date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date created from: ${dateStr} ${timeStr}`)
        return new Date()
      }

      return date
    } catch (error) {
      console.warn(`Failed to parse date: ${dateStr} ${timeStr}`, error)
      return new Date()
    }
  }

  abstract scrape(): Promise<ScrapedEvent[]>
}
