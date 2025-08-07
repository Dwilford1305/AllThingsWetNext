import { connectDB } from '@/lib/mongodb'
import { NewsArticle } from '@/models'
import { WetaskiwinTimesScraper } from './scrapers/wetaskiwinTimes'
import { PipestoneFlyerScraper } from './scrapers/pipestoneFlyer'
import { CentralAlbertaOnlineScraper } from './scrapers/centralAlbertaOnline'
import { generateArticleId } from './utils/idGenerator'
import type { ScrapedNewsArticle } from './scrapers/newsBase'

export interface NewsScrapingResult {
  total: number
  new: number
  updated: number
  errors: string[]
}

export class NewsScraperService {
  private scrapers = {
    'wetaskiwin-times': new WetaskiwinTimesScraper(),
    'pipestone-flyer': new PipestoneFlyerScraper(),
    'central-alberta-online': new CentralAlbertaOnlineScraper()
  }

  async scrapeNews(sources: string[] = ['all']): Promise<NewsScrapingResult> {
    const result: NewsScrapingResult = {
      total: 0,
      new: 0,
      updated: 0,
      errors: []
    }

    try {
      await connectDB()

      // Clean up old news articles first (older than 14 days = 2 weeks)
      console.log('🗑️ Cleaning up old news articles (older than 14 days)...')
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      
      const oldNewsResult = await NewsArticle.deleteMany({
        $or: [
          { publishedAt: { $lt: fourteenDaysAgo } },
          { createdAt: { $lt: fourteenDaysAgo } }
        ]
      })
      console.log(`Deleted ${oldNewsResult.deletedCount || 0} old news articles`)

      const sourcesToScrape = sources.includes('all') ? 
        Object.keys(this.scrapers) : 
        sources.filter(source => source in this.scrapers)

      for (const source of sourcesToScrape) {
        try {
          console.log(`Starting ${source} news scraping...`)
          const scraper = this.scrapers[source as keyof typeof this.scrapers]
          const articles = await scraper.scrape()
          
          for (const articleData of articles) {
            try {
              // Skip articles that are older than our retention period (14 days)
              const fourteenDaysAgo = new Date()
              fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
              
              if (articleData.publishedAt < fourteenDaysAgo) {
                console.log(`Skipping old article: "${articleData.title}" (published ${articleData.publishedAt.toISOString()})`)
                continue
              }
              
              const articleResult = await this.saveArticle(articleData)
              result.total++
              
              if (articleResult.isNew) {
                result.new++
              } else if (articleResult.wasUpdated) {
                result.updated++
              }
            } catch (error) {
              const errorMessage = `Error saving article "${articleData.title}": ${error instanceof Error ? error.message : String(error)}`
              console.error(errorMessage)
              result.errors.push(errorMessage)
            }
          }
          
          console.log(`Completed ${source} news scraping: ${articles.length} articles processed`)
        } catch (error) {
          const errorMessage = `Error scraping ${source}: ${error instanceof Error ? error.message : String(error)}`
          console.error(errorMessage)
          result.errors.push(errorMessage)
        }
      }

      return result
    } catch (error) {
      const errorMessage = `News scraping service error: ${error instanceof Error ? error.message : String(error)}`
      console.error(errorMessage)
      result.errors.push(errorMessage)
      return result
    }
  }

  private async saveArticle(articleData: ScrapedNewsArticle): Promise<{ isNew: boolean, wasUpdated: boolean }> {
    const articleId = generateArticleId(articleData.title, articleData.publishedAt)
    
    // Check if article already exists
    const existingArticle = await NewsArticle.findOne({ id: articleId })
    
    const articleDocument = {
      id: articleId,
      title: articleData.title,
      summary: articleData.summary,
      content: articleData.content,
      category: articleData.category,
      author: articleData.author,
      publishedAt: articleData.publishedAt,
      imageUrl: articleData.imageUrl,
      sourceUrl: articleData.sourceUrl,
      sourceName: articleData.sourceName,
      tags: articleData.tags || [],
      featured: false,
      updatedAt: new Date()
    }

    if (existingArticle) {
      // Update existing article if content has changed
      const hasChanges = 
        existingArticle.title !== articleData.title ||
        existingArticle.summary !== articleData.summary ||
        existingArticle.content !== articleData.content ||
        existingArticle.imageUrl !== articleData.imageUrl

      if (hasChanges) {
        await NewsArticle.findOneAndUpdate(
          { id: articleId },
          articleDocument,
          { new: true }
        )
        console.log(`Updated article: ${articleData.title}`)
        return { isNew: false, wasUpdated: true }
      }
      
      return { isNew: false, wasUpdated: false }
    } else {
      // Create new article
      const newArticle = new NewsArticle({
        ...articleDocument,
        createdAt: new Date()
      })
      
      await newArticle.save()
      console.log(`Created new article: ${articleData.title}`)
      return { isNew: true, wasUpdated: false }
    }
  }

  async getScrapingStatus() {
    const stats = await NewsArticle.aggregate([
      {
        $group: {
          _id: '$sourceName',
          count: { $sum: 1 },
          lastUpdated: { $max: '$updatedAt' }
        }
      }
    ])

    return {
      totalArticles: await NewsArticle.countDocuments(),
      sourceStats: stats,
      lastScrape: stats.length > 0 ? Math.max(...stats.map(s => s.lastUpdated.getTime())) : null
    }
  }
}
