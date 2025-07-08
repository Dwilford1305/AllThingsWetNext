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
      
      return {
        title,
        content,
        summary,
        category: 'Local News',
        author,
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
    // Try various content selectors
    const contentSelectors = [
      'article .content',
      'article .post-content',
      'article .entry-content',
      '.article-content',
      '.post-content',
      '.entry-content',
      'article p',
      '.content p'
    ]
    
    for (const selector of contentSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        return elements.map((i: number, el) => $(el).text().trim()).get().join('\n\n')
      }
    }
    
    // Fallback to all paragraph tags
    return $('p').map((i: number, el) => $(el).text().trim()).get().join('\n\n')
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
    
    return 'Central Alberta Online'
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
      if (summary) {
        return summary
      }
    }
    
    // Try meta description
    const metaDescription = $('meta[name="description"]').attr('content')
    if (metaDescription) {
      return metaDescription
    }
    
    // Try Open Graph description
    const ogDescription = $('meta[property="og:description"]').attr('content')
    if (ogDescription) {
      return ogDescription
    }
    
    // Fallback to first paragraph of content
    if (content) {
      const firstParagraph = content.split('\n\n')[0]
      if (firstParagraph && firstParagraph.length > 10) {
        return firstParagraph.length > 200 ? firstParagraph.substring(0, 200) + '...' : firstParagraph
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
