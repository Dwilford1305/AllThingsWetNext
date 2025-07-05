import { BaseNewsScraper, NewsScraperConfig, ScrapedNewsArticle } from './newsBase'

export class WetaskiwinTimesScraper extends BaseNewsScraper {
  constructor() {
    const config: NewsScraperConfig = {
      url: 'https://www.wetaskiwintimes.com',
      sourceName: 'Wetaskiwin Times',
      timeout: 30000
    }
    super(config)
  }

  async scrape(): Promise<ScrapedNewsArticle[]> {
    try {
      const articles: ScrapedNewsArticle[] = []
      
      // Scrape from the homepage to get recent articles
      await this.scrapeHomepage(articles)
      
      // Also scrape the local news section for more articles
      await this.scrapeNewsSection('https://www.wetaskiwintimes.com/category/news/local-news/', articles)
      
      console.log(`Wetaskiwin Times scraper found ${articles.length} articles`)
      return articles
    } catch (error) {
      console.error('Wetaskiwin Times scraper error:', error)
      return []
    }
  }

  private async scrapeHomepage(articles: ScrapedNewsArticle[]): Promise<void> {
    try {
      const $ = await this.fetchPage(this.config.url)
      
      // Get individual article links from the homepage
      const articleLinks = new Set<string>()
      
      // Look for links that point to individual articles (not category pages)
      $('a[href]').each((index, element) => {
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
      
      // Limit to most recent articles (3 for latest news as requested)
      const recentLinks = Array.from(articleLinks).slice(0, 6)
      
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
      console.warn(`Error scraping homepage:`, error)
    }
  }

  private async scrapeNewsSection(sectionUrl: string, articles: ScrapedNewsArticle[]): Promise<void> {
    try {
      const $ = await this.fetchPage(sectionUrl)
      
      // Look for individual article links (not section pages)
      const articleLinks = new Set<string>()
      
      $('a[href]').each((index, element) => {
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
      
      // Limit to recent articles to avoid overloading
      const recentLinks = Array.from(articleLinks).slice(0, 5)
      
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
      console.warn(`Error scraping news section ${sectionUrl}:`, error)
    }
  }

  private isIndividualArticleUrl(url: string): boolean {
    // Individual articles have specific patterns, not category pages
    const patterns = [
      /\/news\/[^/]+\/[^/]+$/,           // /news/local-news/article-title
      /\/sports\/[^/]+\/[^/]+$/,        // /sports/local-sports/article-title
      /\/entertainment\/[^/]+\/[^/]+$/, // /entertainment/music/article-title
      /\/life\/[^/]+\/[^/]+$/,          // /life/food/article-title
      /\/opinion\/[^/]+\/[^/]+$/,       // /opinion/columnists/article-title
    ]
    
    // Exclude category pages and other non-article URLs
    const excludePatterns = [
      /\/category\//,                   // Category pages
      /\/tag\//,                        // Tag pages
      /\/page\//,                       // Pagination
      /\/author\//,                     // Author pages
      /\/search/,                       // Search pages
      /\.(jpg|jpeg|png|gif|pdf)$/i,     // Image/file links
      /\/weather\//,                    // Weather pages
      /\/contests\//,                   // Contest pages
      /\/newsletters\//,                // Newsletter pages
    ]
    
    // Check if URL matches individual article patterns
    const isArticle = patterns.some(pattern => pattern.test(url))
    
    // Check if URL should be excluded
    const shouldExclude = excludePatterns.some(pattern => pattern.test(url))
    
    return isArticle && !shouldExclude
  }

  private isValidArticle(article: ScrapedNewsArticle): boolean {
    // Filter out section pages and navigation elements that got through
    const invalidTitlePatterns = [
      /^(News|Sports|Entertainment|Life|Opinion)\s*\|/i,  // Section titles
      /Latest\s+(Local\s+)?Headlines/i,                   // "Latest Local Headlines"
      /News\s*\|\s*Latest/i,                             // "News | Latest..."
      /More\s+\w+\s+stories/i,                           // "More news stories"
      /^\s*$|^.{1,10}$/,                                 // Empty or very short titles
    ]
    
    // Check if title indicates this is a section page
    const hasInvalidTitle = invalidTitlePatterns.some(pattern => pattern.test(article.title))
    
    // Check if content is suspiciously short (likely a section page)
    const hasValidContent = Boolean(article.content && article.content.length > 50)
    
    return !hasInvalidTitle && hasValidContent
  }

  private async scrapeArticle(articleUrl: string): Promise<ScrapedNewsArticle | null> {
    try {
      const $ = await this.fetchPage(articleUrl)
      
      // Extract article title
      const title = $('h1').first().text().trim() || 
                   $('.article-title').text().trim() ||
                   $('title').text().replace(' | Wetaskiwin Times', '').trim()
      
      if (!title) {
        console.warn(`No title found for article: ${articleUrl}`)
        return null
      }
      
      // Extract article content/summary
      const contentSelectors = [
        '.article-content p',
        '.entry-content p',
        '.post-content p',
        'article p',
        '.content p'
      ]
      
      let content = ''
      let summary = ''
      
      for (const selector of contentSelectors) {
        const paragraphs = $(selector)
        if (paragraphs.length > 0) {
          const allText = paragraphs.map((i, el) => $(el).text().trim()).get().join(' ')
          content = allText
          summary = allText.substring(0, 200) + (allText.length > 200 ? '...' : '')
          break
        }
      }
      
      // If no content found, try to get text from article body
      if (!content) {
        const articleBody = $('article').text().trim()
        if (articleBody) {
          content = articleBody.substring(0, 500)
          summary = articleBody.substring(0, 200) + (articleBody.length > 200 ? '...' : '')
        }
      }
      
      if (!summary) {
        summary = title // Fallback to title if no summary found
      }
      
      // Extract publish date
      let publishedAt = new Date()
      const dateSelectors = [
        '.article-date',
        '.published-date',
        '.post-date',
        'time[datetime]',
        '.date'
      ]
      
      for (const selector of dateSelectors) {
        const dateElement = $(selector).first()
        if (dateElement.length > 0) {
          const dateText = dateElement.attr('datetime') || dateElement.text().trim()
          if (dateText) {
            const parsedDate = this.parseDate(dateText)
            if (!isNaN(parsedDate.getTime())) {
              publishedAt = parsedDate
              break
            }
          }
        }
      }
      
      // Extract author
      const authorSelectors = [
        '.author',
        '.byline',
        '.article-author',
        '.post-author'
      ]
      
      let author = ''
      for (const selector of authorSelectors) {
        const authorElement = $(selector).first()
        if (authorElement.length > 0) {
          author = authorElement.text().replace(/^by\s*/i, '').trim()
          break
        }
      }
      
      // Extract image
      let imageUrl = ''
      const imageSelectors = [
        '.article-image img',
        '.featured-image img',
        '.post-thumbnail img',
        'article img'
      ]
      
      for (const selector of imageSelectors) {
        const imgElement = $(selector).first()
        if (imgElement.length > 0) {
          const src = imgElement.attr('src') || imgElement.attr('data-src')
          if (src) {
            imageUrl = this.resolveUrl(src, this.config.url)
            break
          }
        }
      }
      
      // Determine category
      const category = this.categorizeNews(title, content)
      
      const article: ScrapedNewsArticle = {
        title,
        summary,
        content,
        category,
        author: author || undefined,
        publishedAt,
        imageUrl: imageUrl || undefined,
        sourceUrl: articleUrl,
        sourceName: this.config.sourceName,
        tags: []
      }
      
      return article
    } catch (error) {
      console.error(`Error scraping article ${articleUrl}:`, error)
      return null
    }
  }
}
