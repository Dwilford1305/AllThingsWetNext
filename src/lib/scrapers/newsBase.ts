import axios, { AxiosInstance } from 'axios'
import http from 'node:http'
import https from 'node:https'
import * as cheerio from 'cheerio'
import type { CheerioAPI, Cheerio as CheerioType } from 'cheerio'
import type { Element } from 'domhandler'
import { generateArticleId } from '../utils/idGenerator'

export interface NewsScraperConfig {
  url: string
  sourceName: string
  userAgent?: string
  timeout?: number
  headers?: Record<string, string>
  retryAttempts?: number
  delayMinMs?: number
  delayMaxMs?: number
}

export interface ScrapedNewsArticle {
  title: string
  summary: string
  content?: string
  category: string
  author?: string
  publishedAt: Date
  imageUrl?: string
  sourceUrl: string
  sourceName: string
  tags?: string[]
}

export abstract class BaseNewsScraper {
  protected config: NewsScraperConfig
  protected axiosInstance: AxiosInstance
  private delayMin: number
  private delayMax: number

  constructor(config: NewsScraperConfig) {
    this.config = config
    this.delayMin = typeof config.delayMinMs === 'number' ? config.delayMinMs : 200
    this.delayMax = typeof config.delayMaxMs === 'number' ? config.delayMaxMs : 600
    this.axiosInstance = axios.create({
      timeout: config.timeout || 30000,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 4 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 4 }),
      decompress: true,
      headers: {
        'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': config.url,
        ...config.headers
      }
    })
  }

  protected async fetchPage(url: string): Promise<CheerioAPI> {
    // Small polite delay to reduce likelihood of triggering rate limits/WAF
    await this.sleep(this.delayMin + Math.floor(Math.random() * (this.delayMax - this.delayMin + 1)))

    const maxAttempts = this.config.retryAttempts && this.config.retryAttempts > 0 ? this.config.retryAttempts : 4
    let attempt = 0
    let lastError: unknown

    while (attempt < maxAttempts) {
      attempt++
      try {
        console.log(`Fetching: ${url}`)
        const response = await this.axiosInstance.get(url, { validateStatus: () => true })

        // Successful response
        if (response.status >= 200 && response.status < 300) {
          return cheerio.load(response.data)
        }

        // Retry on transient statuses
        if (this.isRetryableStatus(response.status) && attempt < maxAttempts) {
          const backoff = this.computeBackoff(attempt)
          console.warn(`Transient HTTP ${response.status} for ${url}. Retrying in ${backoff}ms (attempt ${attempt}/${maxAttempts})`)
          await this.sleep(backoff)
          continue
        }

        // Non-retryable HTTP status
        lastError = new Error(`HTTP ${response.status} for ${url}`)
        break
      } catch (error: unknown) {
        lastError = error
        // Retry on network errors
        if (this.isRetryableNetworkError(error) && attempt < maxAttempts) {
          const backoff = this.computeBackoff(attempt)
      const code = (error as { code?: string; message?: string })?.code
      const message = (error as { message?: string })?.message
      console.warn(`Network error for ${url}: ${code || message}. Retrying in ${backoff}ms (attempt ${attempt}/${maxAttempts})`)
          await this.sleep(backoff)
          continue
        }
        break
      }
    }

    console.error(`Error fetching ${url}:`, lastError)
    throw new Error(`Failed to fetch page: ${url}`)
  }

  private isRetryableStatus(status: number): boolean {
    if (status === 429) return true
    if (status >= 500 && status < 600) return true // 5xx
    // Some sites return 403 intermittently under WAF; treat as retryable once or twice
    if (status === 403) return true
    return false
  }

  private isRetryableNetworkError(error: unknown): boolean {
    const codes = new Set(['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'])
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code?: string }).code
      if (code && codes.has(code)) return true
    }
    // Axios v1 error.code may be 'ERR_NETWORK' or 'ERR_BAD_RESPONSE'
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code?: string }).code
      if (code === 'ERR_NETWORK') return true
    }
    return false
  }

  private computeBackoff(attempt: number): number {
    // Exponential backoff with jitter: base 500ms * 2^(attempt-1) +/- up to 300ms
    const base = 500 * Math.pow(2, attempt - 1)
    const jitter = Math.floor(Math.random() * 300)
    return base + jitter
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  protected generateArticleId(title: string, publishedAt: Date): string {
    return generateArticleId(title, publishedAt)
  }

  protected categorizeNews(title: string, content: string): string {
    const titleOnly = title.toLowerCase()
    
    // PRIORITY 1: Title-based categorization (most reliable for section pages)
    // Sports sections - check for sports keywords FIRST and most specifically
    if (titleOnly.includes('sports news') || titleOnly.includes('local wetaskiwin sports')) return 'sports'
    if (titleOnly.includes('hockey') || titleOnly.includes('nhl')) return 'sports'
    if (titleOnly.includes('football') || titleOnly.includes('cfl') || titleOnly.includes('nfl')) return 'sports'
    if (titleOnly.includes('soccer') || titleOnly.includes('mls')) return 'sports'
    if (titleOnly.includes('baseball') || titleOnly.includes('mlb')) return 'sports'
    if (titleOnly.includes('basketball') || titleOnly.includes('nba')) return 'sports'
    if (titleOnly.includes('curling')) return 'sports'
    if (titleOnly.includes('sports')) return 'sports'
    
    // News sections
    if (titleOnly.includes('latest local headlines') || titleOnly.includes('wetaskiwin news')) return 'local-news'
    if (titleOnly.includes('world news') || titleOnly.includes('international headlines')) return 'local-news'
    if (titleOnly.includes('canada news') || titleOnly.includes('national headlines')) return 'local-news'
    
    // Health
    if (titleOnly.includes('health')) return 'health'
    
    // Business - be more specific
    if (titleOnly.includes('employment') || titleOnly.includes('business spotlight') || titleOnly.includes('business news')) return 'business'
    
    // Community/Events
    if (titleOnly.includes('festival') || titleOnly.includes('celebration')) return 'community'
    
    // Government/Politics - check after sports to avoid conflicts
    if (titleOnly.includes('alberta news') || titleOnly.includes('provincial news')) return 'city-council'
    if (titleOnly.includes('separation') || (titleOnly.includes('alberta') && titleOnly.includes('surplus'))) return 'city-council'
    
    // Accidents/Crime/Weather
    if (titleOnly.includes('collision') || titleOnly.includes('dies') || titleOnly.includes('killed') || titleOnly.includes('funnel cloud')) return 'weather'
    
    // PRIORITY 2: Content-based categorization (for individual articles)
    const text = `${title} ${content}`.toLowerCase()
    
    // Education
    if (text.includes('school') || text.includes('collegiate') || text.includes('education') || text.includes('student') || text.includes('teacher')) return 'education'
    
    // Government/Politics - be more specific to avoid false positives
    if (text.includes('council') || text.includes('mayor') || text.includes('municipal') || text.includes('city hall')) return 'city-council'
    if (text.includes('government') && !text.includes('sports')) return 'city-council'
    if (text.includes('provincial') && !text.includes('sports')) return 'city-council'
    
    // Business (be more specific to avoid false positives)
    if (text.includes('business') && !text.includes('sports')) return 'business'
    if (text.includes('economic') || text.includes('company') || text.includes('employment centre')) return 'business'
    
    // Community
    if (text.includes('community') || text.includes('event') || text.includes('festival') || text.includes('volunteer')) return 'community'
    
    return 'local-news'
  }

  protected parseDate(dateStr: string): Date {
    try {
      // Handle various date formats commonly found in news sites
      let date: Date
      
      // Handle "Published Jul 04, 2025 • 4 minute read" format (extract just the date part)
      if (dateStr.includes('Published')) {
        const dateMatch = dateStr.match(/Published\s+([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/)
        if (dateMatch) {
          date = new Date(dateMatch[1])
        } else {
          date = new Date()
        }
      }
      // Handle "July 5, 2025" format
      else if (dateStr.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/)) {
        date = new Date(dateStr)
      }
      // Handle "5 days ago", "1 week ago" etc
      else if (dateStr.includes('ago')) {
        const now = new Date()
        if (dateStr.includes('hour')) {
          const hours = parseInt(dateStr.match(/\d+/)?.[0] || '0')
          date = new Date(now.getTime() - hours * 60 * 60 * 1000)
        } else if (dateStr.includes('day')) {
          const days = parseInt(dateStr.match(/\d+/)?.[0] || '0')
          date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        } else if (dateStr.includes('week')) {
          const weeks = parseInt(dateStr.match(/\d+/)?.[0] || '0')
          date = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000)
        } else {
          date = now
        }
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

      // Ensure the date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date created from: ${dateStr}`)
        return new Date() // Return current date as fallback
      }

      return date
    } catch (error) {
      console.warn(`Failed to parse date: ${dateStr}`, error)
      return new Date() // Return current date as fallback
    }
  }

  protected resolveUrl(url: string, baseUrl: string): string {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('//')) return `https:${url}`
    if (url.startsWith('/')) return `${baseUrl}${url}`
    return `${baseUrl}/${url}`
  }

  protected extractTextContent(element: CheerioType<Element>): string {
    return element.text().replace(/\s+/g, ' ').trim()
  }

  abstract scrape(): Promise<ScrapedNewsArticle[]>
}
