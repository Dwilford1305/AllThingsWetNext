import { WetaskiwinBusinessScraper, ScrapedBusiness, BusinessScrapingResult } from './scrapers/wetaskiwinBusiness'
import { connectDB } from './mongodb'
import { Business } from '../models'
import type { Business as BusinessType } from '../types'

export class BusinessScraperService {
  private businessScraper = new WetaskiwinBusinessScraper()

  async scrapeBusinesses(): Promise<BusinessScrapingResult> {
    try {
      console.log('Starting business scraping service...')
      
      // Connect to database
      await connectDB()
      
      // Scrape businesses
      const allBusinessesUrl = 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
      const businesses = await this.businessScraper.scrapeBusinessPage(allBusinessesUrl)
      const categorizedBusinesses = this.businessScraper.categorizeBusinesses(businesses)
      
      // Save to database
      const saveResult = await this.saveBusinessesToDB(categorizedBusinesses)
      
      return {
        total: categorizedBusinesses.length,
        new: saveResult.new,
        updated: saveResult.updated,
        errors: []
      }
      
    } catch (error) {
      console.error('Business scraping service error:', error)
      return {
        total: 0,
        new: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async saveBusinessesToDB(businesses: ScrapedBusiness[]): Promise<{ new: number; updated: number }> {
    let newCount = 0
    let updatedCount = 0
    let errorCount = 0
    
    console.log(`Attempting to save ${businesses.length} businesses to database...`)
    
    for (const scrapedBusiness of businesses) {
      try {
        // Validate business data before saving
        if (!scrapedBusiness.name || scrapedBusiness.name.length < 2) {
          console.log(`Skipping business with invalid name: "${scrapedBusiness.name}"`)
          continue
        }
        
        if (!scrapedBusiness.address) {
          console.log(`Skipping business "${scrapedBusiness.name}" with missing address`)
          continue
        }
        
        // Create a unique ID based on name and address
        const businessId = this.generateBusinessId(scrapedBusiness.name, scrapedBusiness.address)
        
        // Check if business already exists
        const existingBusiness = await Business.findOne({ id: businessId })
        
        const businessData = {
          name: scrapedBusiness.name.trim(),
          address: scrapedBusiness.address.trim(),
          phone: scrapedBusiness.phone || '',
          website: scrapedBusiness.website || '',
          contact: scrapedBusiness.contact || '',
          category: scrapedBusiness.category || 'other',
          sourceUrl: scrapedBusiness.sourceUrl,
          updatedAt: new Date()
        }
        
        if (existingBusiness) {
          // Update existing business (only basic fields from scraping)
          await Business.findOneAndUpdate(
            { id: businessId },
            businessData,
            { runValidators: true }
          )
          updatedCount++
        } else {
          // Create new business with free tier
          const newBusiness = new Business({
            id: businessId,
            ...businessData,
            description: this.generateBasicDescription(scrapedBusiness),
            subscriptionTier: 'free',
            subscriptionStatus: 'inactive',
            isClaimed: false,
            analytics: { views: 0, clicks: 0, callClicks: 0, websiteClicks: 0 },
            photos: [],
            services: [],
            tags: [],
            specialOffers: []
          })
          
          await newBusiness.save()
          newCount++
        }
        
      } catch (error) {
        errorCount++
        console.error(`Error saving business "${scrapedBusiness.name}":`, error)
        if (errorCount <= 5) { // Only show first 5 errors to avoid spam
          console.error('Business data:', JSON.stringify(scrapedBusiness, null, 2))
        }
      }
    }
    
    console.log(`Save results: ${newCount} new, ${updatedCount} updated, ${errorCount} errors`)
    return { new: newCount, updated: updatedCount }
  }

  private generateBusinessId(name: string, address: string): string {
    // Normalize business name - remove common suffixes that don't change the business identity
    const normalizedName = name.toLowerCase()
      .replace(/\b(ltd|inc|corp|co|llc|limited|incorporated|corporation|company)\b\.?/g, '') // Remove business suffixes
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
    
    // Create clean name for ID
    const cleanName = normalizedName
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 50) // Limit name length
    
    // Extract just the street number for address uniqueness
    const streetNumber = address.match(/^#?\d+[a-z]?/i)?.[0] || ''
    const cleanStreetNumber = streetNumber.toLowerCase().replace(/[^0-9a-z]/g, '')
    
    // For businesses with the same name, differentiate by street number only
    if (cleanStreetNumber) {
      return `${cleanName}-${cleanStreetNumber}`
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 80)
    } else {
      return cleanName
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80)
    }
  }

  private generateBasicDescription(business: ScrapedBusiness): string {
    const category = business.category || 'business'
    const categoryMap: Record<string, string> = {
      restaurant: 'restaurant offering dining services',
      retail: 'retail store providing shopping services',
      automotive: 'automotive service provider',
      health: 'healthcare service provider',
      professional: 'professional service provider',
      'home-services': 'home service provider',
      other: 'business providing local services'
    }
    
    const categoryDesc = categoryMap[category] || 'local business'
    return `${business.name} is a ${categoryDesc} located in Wetaskiwin${business.contact ? `, managed by ${business.contact}` : ''}.`
  }

  // Get businesses with subscription tier information
  async getBusinesses(options: {
    category?: string
    featured?: boolean
    limit?: number
    subscriptionTier?: string
  } = {}): Promise<BusinessType[]> {
    try {
      await connectDB()
      
      const filter: Record<string, unknown> = {}
      
      if (options.category) {
        filter.category = options.category
      }
      
      if (options.featured) {
        filter.featured = true
      }
      
      if (options.subscriptionTier) {
        filter.subscriptionTier = options.subscriptionTier
      }
      
      const businesses = await Business.find(filter)
        .sort({ 
          featured: -1, // Featured first
          subscriptionTier: -1, // Premium tiers first
          name: 1 // Then alphabetical
        })
        .limit(options.limit || 100)
        .lean()
      
      return businesses.map(business => this.formatBusinessForAPI(business))
      
    } catch (error) {
      console.error('Error fetching businesses:', error)
      return []
    }
  }

  // Define a type for the business object to ensure analytics and views exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatBusinessForAPI(business: any): BusinessType {
    const isPremium = ['silver', 'gold', 'platinum'].includes(String(business.subscriptionTier))
    
    return {
      id: business.id || '',
      name: business.name || '',
      description: business.description || '',
      category: business.category || 'other',
      address: business.address || '',
      phone: business.phone,
      email: isPremium ? business.email : undefined,
      website: business.website,
      
      // Basic info (always shown)
      contact: business.contact,
      featured: business.featured || false,
      verified: business.verified || false,
      
      // Premium features (only for paid tiers)
      logo: isPremium ? business.logo : undefined,
      photos: isPremium ? business.photos : [],
      hours: isPremium ? business.hours : undefined,
      socialMedia: isPremium ? business.socialMedia : undefined,
      specialOffers: isPremium ? business.specialOffers : [],
      
      // Subscription info (for business owners)
      subscriptionTier: business.subscriptionTier || 'free',
      subscriptionStatus: business.subscriptionStatus || 'inactive',
      isClaimed: business.isClaimed || false,
      
      // Required fields for Business interface
      reviewCount: business.reviewCount || 0,
      services: business.services || [],
      tags: business.tags || [],
      
      // Analytics
      analytics: {
        views: business.analytics?.views || 0,
        clicks: business.analytics?.clicks || 0,
        callClicks: business.analytics?.callClicks || 0,
        websiteClicks: business.analytics?.websiteClicks || 0
      },
      
      createdAt: business.createdAt || new Date(),
      updatedAt: business.updatedAt || new Date()
    } as BusinessType
  }
}
