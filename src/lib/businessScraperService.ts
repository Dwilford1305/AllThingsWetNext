import { WetaskiwinBusinessScraper, ScrapedBusiness, BusinessScrapingResult } from './scrapers/wetaskiwinBusiness'
import { connectDB } from './mongodb'
import { Business } from '../models'

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
    // Create a unique, URL-friendly ID based on name and key address parts
    const cleanName = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 50) // Limit name length
    
    // Extract key address parts (street number and name)
    const addressParts = address.toLowerCase()
      .match(/(\d+)\s+([a-z0-9\s]+)/) // Get street number and street name
    
    let addressKey = ''
    if (addressParts) {
      addressKey = `${addressParts[1]}-${addressParts[2]}`
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30)
    } else {
      addressKey = address.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30)
    }
    
    return `${cleanName}-${addressKey}`
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 100)
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
  } = {}): Promise<unknown[]> {
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
      
      return businesses.map(business => this.formatBusinessForAPI(business as any))
      
    } catch (error) {
      console.error('Error fetching businesses:', error)
      return []
    }
  }

  // Define a type for the business object to ensure analytics and views exist
  private formatBusinessForAPI(business: {
    id?: string;
    name?: string;
    description?: string;
    category?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    contact?: string;
    featured?: boolean;
    verified?: boolean;
    logo?: string;
    photos?: unknown[];
    hours?: unknown;
    socialMedia?: unknown;
    specialOffers?: unknown[];
    subscriptionTier?: string;
    isClaimed?: boolean;
    analytics?: { views?: number };
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    const isPremium = ['silver', 'gold', 'platinum'].includes(String(business.subscriptionTier))
    
    return {
      id: business.id,
      name: business.name,
      description: business.description,
      category: business.category,
      address: business.address,
      phone: business.phone,
      email: isPremium ? business.email : undefined,
      website: business.website,
      
      // Basic info (always shown)
      contact: business.contact,
      featured: business.featured,
      verified: business.verified,
      
      // Premium features (only for paid tiers)
      logo: isPremium ? business.logo : undefined,
      photos: isPremium ? business.photos : undefined,
      hours: isPremium ? business.hours : undefined,
      socialMedia: isPremium ? business.socialMedia : undefined,
      specialOffers: isPremium ? business.specialOffers : undefined,
      
      // Subscription info (for business owners)
      subscriptionTier: business.subscriptionTier,
      isClaimed: business.isClaimed,
      
      // Public analytics
      views: business.analytics?.views || 0,
      
      createdAt: business.createdAt,
      updatedAt: business.updatedAt
    }
  }
}
