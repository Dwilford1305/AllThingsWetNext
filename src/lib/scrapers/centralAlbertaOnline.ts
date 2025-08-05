import { BaseNewsScraper, NewsScraperConfig, ScrapedNewsArticle } from './newsBase'
import * as cheerio from 'cheerio'

export class CentralAlbertaOnlineScraper extends BaseNewsScraper {
  constructor() {
    const config: NewsScraperConfig = {
      url: 'https://centralalbertaonline.com',
      sourceName: 'Central Alberta Online',
      timeout: 30000
    }
    super(config)
  }

  async scrape(): Promise<ScrapedNewsArticle[]> {
    try {
      const articles: ScrapedNewsArticle[] = []
      
      // Scrape from the main page to get recent articles
      await this.scrapeMainPage(articles)
      
      // Also scrape local news section for more articles
      await this.scrapeNewsSection('https://centralalbertaonline.com/local-news', articles)
      
      console.log(`Central Alberta Online scraper found ${articles.length} articles`)
      return articles
    } catch (error) {
      console.error('Central Alberta Online scraper error:', error)
      return []
    }
  }

  private async scrapeMainPage(articles: ScrapedNewsArticle[]): Promise<void> {
    try {
      const $ = await this.fetchPage(this.config.url)
      
      // Get individual article links from the main page
      const articleLinks = new Set<string>()
      
      // Look for links that point to individual articles
      $('a[href*="/articles/"]').each((index, element) => {
        const $link = $(element)
        const href = $link.attr('href')
        if (href) {
          const fullUrl = this.resolveUrl(href, this.config.url)
          
          // Only include individual article URLs
          if (this.isIndividualArticleUrl(fullUrl)) {
            articleLinks.add(fullUrl)
          }
        }
      })
      
      // Limit to most recent articles (10 for latest news)
      const recentLinks = Array.from(articleLinks).slice(0, 10)
      
      for (const articleUrl of recentLinks) {
        try {
          const article = await this.scrapeArticle(articleUrl)
          if (article && this.isValidArticle(article)) {
            articles.push(article)
          }
        } catch (error) {
          console.warn(`Error scraping article ${articleUrl}:`, error)
        }
      }
    } catch (error) {
      console.warn(`Error scraping main page:`, error)
    }
  }

  private async scrapeNewsSection(sectionUrl: string, articles: ScrapedNewsArticle[]): Promise<void> {
    try {
      const $ = await this.fetchPage(sectionUrl)
      
      // Look for individual article links (not section pages)
      const articleLinks = new Set<string>()
      
      $('a[href*="/articles/"]').each((index, element) => {
        const $link = $(element)
        const href = $link.attr('href')
        if (href) {
          const fullUrl = this.resolveUrl(href, this.config.url)
          
          // Only include individual article URLs, not category/section pages
          if (this.isIndividualArticleUrl(fullUrl)) {
            articleLinks.add(fullUrl)
          }
        }
      })
      
      // Limit to recent articles to avoid overloading (10 articles)
      const recentLinks = Array.from(articleLinks).slice(0, 10)
      
      for (const articleUrl of recentLinks) {
        try {
          const article = await this.scrapeArticle(articleUrl)
          if (article && this.isValidArticle(article)) {
            articles.push(article)
          }
        } catch (error) {
          console.warn(`Error scraping article ${articleUrl}:`, error)
        }
      }
    } catch (error) {
      console.warn(`Error scraping news section:`, error)
    }
  }

  private isIndividualArticleUrl(url: string): boolean {
    // Check if it's an individual article URL
    return url.includes('/articles/') && 
           !url.includes('/local-news') && 
           !url.includes('/national-news') && 
           !url.includes('/ag-news') && 
           !url.includes('/community') && 
           !url.includes('/sponsored') &&
           !url.includes('?page=')
  }

  private async scrapeArticle(url: string): Promise<ScrapedNewsArticle | null> {
    try {
      const $ = await this.fetchPage(url)
      
      // Extract article title
      const title = $('h1').first().text().trim() || 
                   $('title').text().trim() || 
                   $('meta[property="og:title"]').attr('content') || 
                   ''
      
      if (!title) {
        console.warn(`No title found for article: ${url}`)
        return null
      }
      
      // Extract article content
      const content = this.extractContent($)
      
      // Extract publish date
      const publishedDate = this.extractPublishDate($)
      
      // Extract author
      const author = this.extractAuthor($)
      
      // Extract summary/excerpt
      const summary = this.extractSummary($, content)
      
      // Extract image
      const imageUrl = this.extractImage($)
      
      // Extract tags/categories
      const tags = this.extractTags($)
      
      // Categorize the article based on title and content
      const category = this.categorizeNews(title, content)
      
      return {
        title,
        content,
        summary,
        category,
        author: author || undefined,
        publishedAt: publishedDate,
        sourceUrl: url,
        imageUrl,
        tags,
        sourceName: this.config.sourceName
      }
    } catch (error) {
      console.error(`Error scraping article ${url}:`, error)
      return null
    }
  }

  private extractContent($: cheerio.CheerioAPI): string {
    // Try various content selectors in order of preference
    const contentSelectors = [
      'article .content',
      'article .post-content', 
      'article .entry-content',
      '.article-content',
      '.post-content',
      '.entry-content',
      'main article',
      '.main-content article'
    ]
    
    for (const selector of contentSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        const content = elements.map((i: number, el) => {
          const $el = $(el)
          // Remove unwanted elements
          $el.find('script, style, nav, .social-share, .ads, .advertisement, .sidebar, .comments').remove()
          return $el.text().trim()
        }).get().join('\n\n')
        
        if (content && content.length > 100) {
          return this.cleanContent(content)
        }
      }
    }
    
    // More specific fallback - only paragraphs within article or main content
    const articleP = $('article p, main p, .main-content p')
    if (articleP.length > 0) {
      const content = articleP.map((i: number, el) => {
        const text = $(el).text().trim()
        // Skip very short paragraphs (likely navigation/ads)
        return text.length > 20 ? text : ''
      }).get().filter(text => text.length > 0).join('\n\n')
      
      if (content && content.length > 100) {
        return this.cleanContent(content)
      }
    }
    
    // Last resort - all paragraphs but heavily filtered
    const allP = $('p')
    const content = allP.map((i: number, el) => {
      const text = $(el).text().trim()
      // Only include substantial paragraphs
      return text.length > 30 ? text : ''
    }).get().filter(text => text.length > 0).slice(0, 10).join('\n\n') // Limit to first 10 paragraphs
    
    return this.cleanContent(content)
  }
  
  private cleanContent(content: string): string {
    if (!content) return ''
    
    // Remove common junk patterns
    content = content
      .replace(/googletag\.cmd\.push\([^)]+\);/g, '') // Remove Google ad scripts
      .replace(/window\.location\.pathname[^;]+;/g, '') // Remove pathname scripts
      .replace(/setTargeting\([^)]+\)/g, '') // Remove ad targeting
      .replace(/\s*\$\s*\(\s*document\s*\)[^}]+}/g, '') // Remove jQuery document ready
      .replace(/function\s*\([^)]*\)\s*{[^}]*}/g, '') // Remove inline functions
      .replace(/var\s+\w+\s*=[^;]+;/g, '') // Remove variable declarations
      .replace(/if\s*\([^)]+\)\s*{[^}]*}/g, '') // Remove if statements
      .replace(/\{[^}]*googletag[^}]*\}/g, '') // Remove googletag blocks
      .replace(/\{[^}]*window\.location[^}]*\}/g, '') // Remove location blocks
      .replace(/\([^)]*\d{3,}[^)]*\)/g, '') // Remove coordinate-like patterns
      .replace(/\s*\d{3,}\s*,\s*\d{3,}/g, '') // Remove coordinate pairs
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
      .trim()
    
    // Split into sentences and clean
    const sentences = content.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && !this.isJunkSentence(s))
    
    // Limit content length
    const cleanedContent = sentences.join('. ').trim()
    return cleanedContent.length > 800 ? cleanedContent.substring(0, 800) + '...' : cleanedContent
  }
  
  private isJunkSentence(sentence: string): boolean {
    const junkPatterns = [
      /googletag/i,
      /window\.location/i,
      /setTargeting/i,
      /\$\(document\)/i,
      /function\s*\(/i,
      /var\s+\w+\s*=/i,
      /\d{10,}/i, // Long numbers (likely IDs)
      /\{[^}]*\}/i, // Code blocks
      /onclick/i,
      /href=/i,
      /class=/i,
      /id=/i
    ]
    
    return junkPatterns.some(pattern => pattern.test(sentence))
  }

  private extractPublishDate($: cheerio.CheerioAPI): Date {
    // Try various date selectors
    const dateSelectors = [
      'time[datetime]',
      '.published-date',
      '.post-date',
      '.entry-date',
      '.date'
    ]
    
    for (const selector of dateSelectors) {
      const dateElement = $(selector)
      if (dateElement.length > 0) {
        const dateStr = dateElement.attr('datetime') || dateElement.text().trim()
        if (dateStr) {
          const date = new Date(dateStr)
          if (!isNaN(date.getTime())) {
            return date
          }
        }
      }
    }
    
    // Try meta tags
    const metaDate = $('meta[property="article:published_time"]').attr('content')
    if (metaDate) {
      const date = new Date(metaDate)
      if (!isNaN(date.getTime())) {
        return date
      }
    }
    
    // Default to current date if no date found
    return new Date()
  }

  private extractAuthor($: cheerio.CheerioAPI): string {
    // Try various author selectors
    const authorSelectors = [
      '.author-name',
      '.post-author',
      '.entry-author',
      '.byline'
    ]
    
    for (const selector of authorSelectors) {
      const author = $(selector).text().trim()
      if (author) {
        return author
      }
    }
    
    // Try meta tags
    const metaAuthor = $('meta[name="author"]').attr('content')
    if (metaAuthor) {
      return metaAuthor
    }
    
    // Don't return the source name as author - let it be empty
    return ''
  }

  private extractSummary($: cheerio.CheerioAPI, content: string): string {
    // Try to find excerpt or summary
    const summarySelectors = [
      '.excerpt',
      '.summary', 
      '.post-excerpt',
      '.entry-summary'
    ]
    
    for (const selector of summarySelectors) {
      const summary = $(selector).text().trim()
      if (summary && summary.length > 20) {
        return summary.length > 250 ? summary.substring(0, 250) + '...' : summary
      }
    }
    
    // Try meta description
    const metaDescription = $('meta[name="description"]').attr('content')
    if (metaDescription && metaDescription.length > 20) {
      return metaDescription.length > 250 ? metaDescription.substring(0, 250) + '...' : metaDescription
    }
    
    // Try Open Graph description  
    const ogDescription = $('meta[property="og:description"]').attr('content')
    if (ogDescription && ogDescription.length > 20) {
      return ogDescription.length > 250 ? ogDescription.substring(0, 250) + '...' : ogDescription
    }
    
    // Fallback to first sentences of cleaned content
    if (content) {
      const sentences = content.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10)
      
      if (sentences.length > 0) {
        let summary = sentences[0]
        // Add second sentence if first is very short
        if (summary.length < 100 && sentences.length > 1) {
          summary += '. ' + sentences[1]
        }
        return summary.length > 250 ? summary.substring(0, 250) + '...' : summary
      }
    }
    
    return ''
  }

  private extractImage($: cheerio.CheerioAPI): string {
    // Try various image selectors
    const imageSelectors = [
      'article img',
      '.featured-image img',
      '.post-image img',
      '.entry-image img'
    ]
    
    for (const selector of imageSelectors) {
      const img = $(selector).first()
      if (img.length > 0) {
        const src = img.attr('src')
        if (src) {
          return this.resolveUrl(src, this.config.url)
        }
      }
    }
    
    // Try meta tags
    const ogImage = $('meta[property="og:image"]').attr('content')
    if (ogImage) {
      return this.resolveUrl(ogImage, this.config.url)
    }
    
    return ''
  }

  private extractTags($: cheerio.CheerioAPI): string[] {
    const tags: string[] = []
    
    // Try various tag selectors
    const tagSelectors = [
      '.tags a',
      '.post-tags a',
      '.entry-tags a',
      '.categories a'
    ]
    
    for (const selector of tagSelectors) {
      $(selector).each((i: number, el) => {
        const tag = $(el).text().trim()
        if (tag && !tags.includes(tag)) {
          tags.push(tag)
        }
      })
    }
    
    return tags
  }

  private isValidArticle(article: ScrapedNewsArticle): boolean {
    return article.title.length > 0 && 
           (article.content?.length || 0) > 50 && 
           article.title.length < 500 &&
           !article.title.toLowerCase().includes('advertisement') &&
           !article.title.toLowerCase().includes('contest') &&
           !(article.content?.toLowerCase().includes('this article is sponsored') || false)
  }
}
