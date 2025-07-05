import { BaseNewsScraper, NewsScraperConfig, ScrapedNewsArticle } from './newsBase'

export class PipestoneFlyerScraper extends BaseNewsScraper {
  constructor() {
    const config: NewsScraperConfig = {
      url: 'https://www.pipestoneflyer.ca',
      sourceName: 'Pipestone Flyer',
      timeout: 30000
    }
    super(config)
  }

  async scrape(): Promise<ScrapedNewsArticle[]> {
    try {
      const articles: ScrapedNewsArticle[] = []
      
      // Scrape from the main page to get recent individual articles
      await this.scrapeMainPage(articles)
      
      // Also scrape local news section for more articles
      await this.scrapeNewsSection('https://www.pipestoneflyer.ca/local-news', articles)
      
      console.log(`Pipestone Flyer scraper found ${articles.length} articles`)
      return articles
    } catch (error) {
      console.error('Pipestone Flyer scraper error:', error)
      return []
    }
  }

  private async scrapeMainPage(articles: ScrapedNewsArticle[]): Promise<void> {
    try {
      const $ = await this.fetchPage(this.config.url)
      
      // Get individual article links from the main page
      const articleLinks = new Set<string>()
      
      // Look for links that point to individual articles
      $('a[href]').each((index, element) => {
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
      console.warn(`Error scraping main page:`, error)
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
          
          // Only include individual article URLs
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
    // Individual articles have specific patterns with numeric IDs
    const patterns = [
      /\/news\/[^/]+-\d+$/,             // /news/article-title-8110545
      /\/local-news\/[^/]+-\d+$/,      // /local-news/article-title-7992950
      /\/sports\/[^/]+-\d+$/,          // /sports/article-title-8101715
      /\/home\/[^/]+-\d+$/,            // /home/article-title-8111030
      /\/home2\/[^/]+-\d+$/,           // /home2/article-title-8112499
      /\/entertainment\/[^/]+-\d+$/,   // /entertainment/article-title-8040561
      /\/opinion\/[^/]+-\d+$/,         // /opinion/article-title-8040561
    ]
    
    // Exclude category pages and other non-article URLs
    const excludePatterns = [
      /\/local-news\/?$/,              // Section page itself
      /\/news\/?$/,                    // Section page itself
      /\/sports\/?$/,                  // Section page itself
      /\/community\/?$/,               // Community pages
      /\/obituaries\/?$/,              // Obituaries section
      /\/contests\/?$/,                // Contests section
      /\/polls\//,                     // Polls
      /\/newsletters\//,               // Newsletters
      /\/tags\//,                      // Tag pages
      /\/category\//,                  // Category pages
      /\.(jpg|jpeg|png|gif|pdf)$/i,    // Image/file links
      /\/marketplace\//,               // Marketplace pages
      /\/e-editions\//,                // E-editions
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
      /^(News|Sports|Entertainment|Life|Opinion|Community)\s*$/i,  // Section titles
      /More\s+\w+\s*>/i,                                           // "More News >"
      /^\s*$|^.{1,10}$/,                                          // Empty or very short titles
      /QUIZ:/i,                                                   // Quiz pages
      /PHOTOS:/i,                                                 // Photo galleries (unless news)
    ]
    
    // Check if title indicates this is a section page
    const hasInvalidTitle = invalidTitlePatterns.some(pattern => pattern.test(article.title))
    
    // Check if content is suspiciously short (likely a section page)
    const hasValidContent = Boolean(article.content && article.content.length > 50)
    
    // Allow photo galleries that are actually news stories
    const isNewsPhoto = Boolean(article.title.includes('PHOTOS:') && (
      article.title.toLowerCase().includes('wetaskiwin') ||
      article.title.toLowerCase().includes('news') ||
      (article.content && article.content.toLowerCase().includes('news'))
    ))
    
    return (!hasInvalidTitle || isNewsPhoto) && hasValidContent
  }

  private async scrapeArticle(articleUrl: string): Promise<ScrapedNewsArticle | null> {
    try {
      const $ = await this.fetchPage(articleUrl)
      
      // Extract article title
      const title = $('h1').first().text().trim() || 
                   $('.article-title').text().trim() ||
                   $('.headline').text().trim() ||
                   $('title').text().replace(' - Pipestone Flyer', '').trim()
      
      if (!title || title.length < 5) {
        console.warn(`No valid title found for article: ${articleUrl}`)
        return null
      }
      
      // Extract article content/summary
      const contentSelectors = [
        '.article-content p',
        '.entry-content p', 
        '.post-content p',
        '.story-content p',
        '.content p',
        'article p',
        'main p',           // Main content area
        '.main-content p',  // Main content area
        'p'                 // Fallback to any paragraph
      ]
      
      let content = ''
      let summary = ''
      
      for (const selector of contentSelectors) {
        const paragraphs = $(selector)
        if (paragraphs.length > 0) {
          const allText = paragraphs.map((i, el) => {
            const text = $(el).text().trim()
            // Filter out advertisements and navigation text
            if (text.includes('Advertisement') || 
                text.includes('More from') || 
                text.includes('Subscribe') ||
                text.length < 20) {
              return ''
            }
            return text
          }).get().filter(text => text.length > 0).join(' ')
          
          if (allText.length > 50) {
            content = allText
            summary = allText.substring(0, 250) + (allText.length > 250 ? '...' : '')
            break
          }
        }
      }
      
      // If no content found, try to get text from the full article
      if (!content) {
        // Try to get content from the main article body or any paragraph elements
        const bodySelectors = [
          'article',
          'main',
          '.main-content',
          '.article-body',
          '.entry-content'
        ]
        
        for (const selector of bodySelectors) {
          const bodyElement = $(selector)
          if (bodyElement.length > 0) {
            const bodyText = bodyElement.text().trim()
            if (bodyText && bodyText.length > 100) {
              // Filter out navigation and advertisement text
              const cleanText = bodyText
                .replace(/More News[\s\S]*$/, '') // Remove "More News" section and everything after
                .replace(/YOUR VOTE MATTERS[\s\S]*$/, '') // Remove polling sections
                .replace(/TODAY IN ALBERTA[\s\S]*$/, '') // Remove "Today in Alberta" section
                .replace(/Advertisement.*?\n/g, '') // Remove advertisement lines
                .replace(/Subscribe.*?\n/g, '') // Remove subscription prompts
                .replace(/Facebook Comments.*?\n/g, '') // Remove social media sections
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim()
              
              if (cleanText.length > 50) {
                content = cleanText.substring(0, 800)
                summary = cleanText.substring(0, 250) + (cleanText.length > 250 ? '...' : '')
                break
              }
            }
          }
        }
      }
      
      if (!summary || summary.length < 20) {
        summary = title // Fallback to title if no summary found
      }
      
      // Extract publish date
      let publishedAt = new Date()
      const dateSelectors = [
        '.published-date',
        '.article-date',
        '.post-date',
        'time[datetime]',
        '.date',
        '.timestamp'
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
      
      // Try to extract date from URL or content if not found
      if (publishedAt.getTime() === new Date().getTime()) {
        // Look for date patterns in the URL
        const urlDateMatch = articleUrl.match(/(\d{4})-(\d{2})-(\d{2})/)
        if (urlDateMatch) {
          publishedAt = new Date(parseInt(urlDateMatch[1]), parseInt(urlDateMatch[2]) - 1, parseInt(urlDateMatch[3]))
        }
      }
      
      // Extract author
      let author = ''
      const authorSelectors = [
        '.author',
        '.byline',
        '.article-author',
        '.post-author',
        '.story-byline'
      ]
      
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
        '.story-image img',
        '.hero-image img',
        'article img'
      ]
      
      for (const selector of imageSelectors) {
        const imgElement = $(selector).first()
        if (imgElement.length > 0) {
          const src = imgElement.attr('src') || imgElement.attr('data-src')
          if (src && !src.includes('advertisement') && !src.includes('logo')) {
            imageUrl = this.resolveUrl(src, this.config.url)
            break
          }
        }
      }
      
      // Determine category based on URL and content
      let category = this.categorizeNews(title, content)
      
      // Additional categorization based on URL structure
      if (articleUrl.includes('/local-news/')) category = 'local-news'
      if (articleUrl.includes('/sports/')) category = 'sports'
      if (articleUrl.includes('/business/')) category = 'business'
      
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
