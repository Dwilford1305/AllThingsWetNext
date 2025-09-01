export interface Event {
  id: string
  title: string
  description: string
  date: Date
  endDate?: Date
  time: string
  location: string
  category: EventCategory
  organizer: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  imageUrl?: string
  featured: boolean
  price?: number
  ticketUrl?: string
  sourceUrl?: string
  sourceName?: string
  addedAt: Date
  createdAt: Date
  updatedAt: Date
}

export type EventCategory = 
  | 'community'
  | 'sports'
  | 'arts'
  | 'music'
  | 'food'
  | 'education'
  | 'business'
  | 'family'
  | 'health'
  | 'other'

export interface NewsArticle {
  id: string
  title: string
  summary: string
  content?: string
  category: NewsCategory
  author?: string
  publishedAt: Date
  imageUrl?: string
  sourceUrl: string
  sourceName: string
  tags: string[]
  featured: boolean
  createdAt: Date
  updatedAt: Date
}

export type NewsCategory = 
  | 'local-news'
  | 'city-council'
  | 'business'
  | 'sports'
  | 'community'
  | 'education'
  | 'health'
  | 'weather'
  | 'other'

export interface Business {
  id: string
  name: string
  description: string
  category: BusinessCategory
  address: string
  phone?: string
  email?: string
  website?: string
  contact?: string // Contact person name from scraping
  sourceUrl?: string // Where we scraped it from
  
  // Premium subscription features
  subscriptionTier?: 'free' | 'silver' | 'gold' | 'platinum'
  subscriptionStatus?: 'active' | 'inactive' | 'trial' | 'cancelled'
  subscriptionStart?: Date
  subscriptionEnd?: Date
  isClaimed?: boolean // Has business owner claimed this listing
  claimedBy?: string // Email of person who claimed it
  claimedAt?: Date
  
  // Premium features (only available with subscription)
  logo?: string // Logo image URL
  photos?: string[] // Gallery photos
  hours?: BusinessHours
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
  }
  specialOffers?: Array<{
    title: string
    description: string
    validUntil: Date
  }>
  
  // Analytics (for premium users)
  analytics?: {
    views: number
    clicks: number
    callClicks: number
    websiteClicks: number
  }
  
  // Basic fields (always available)
  imageUrl?: string
  featured: boolean
  verified: boolean
  rating?: number
  reviewCount: number
  services: string[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export type BusinessCategory = 
  | 'restaurant'
  | 'retail'
  | 'automotive'
  | 'health'
  | 'professional'
  | 'home-services'
  | 'beauty'
  | 'recreation'
  | 'education'
  | 'non-profit'
  | 'other'

export type SubscriptionTier = 'free' | 'silver' | 'gold' | 'platinum'

export type OfferType = 'discount_percentage' | 'discount_fixed' | 'free_upgrade' | 'free_months'

export interface BusinessHours {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

export interface JobPosting {
  id: string
  title: string
  company: string
  description: string
  location: string
  category: JobCategory
  type: JobType
  salaryRange?: string
  requirements: string[]
  benefits?: string[]
  contactEmail?: string
  contactPhone?: string
  applicationUrl?: string
  featured: boolean
  expiresAt: Date
  sourceUrl?: string
  sourceName?: string
  createdAt: Date
  updatedAt: Date
}

export type JobCategory = 
  | 'healthcare'
  | 'education'
  | 'retail'
  | 'hospitality'
  | 'construction'
  | 'manufacturing'
  | 'office'
  | 'transportation'
  | 'agriculture'
  | 'government'
  | 'non-profit'
  | 'other'

export type JobType = 
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'temporary'
  | 'volunteer'
  | 'internship'

export interface MarketplaceListing {
  id: string
  title: string
  description: string
  category: MarketplaceCategory
  price?: number
  condition?: MarketplaceCondition
  location: string
  contactName: string
  contactEmail?: string
  contactPhone?: string
  images: string[]
  featured: boolean
  status: MarketplaceStatus
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export type MarketplaceCategory = 
  | 'vehicles'
  | 'real-estate'
  | 'electronics'
  | 'furniture'
  | 'clothing'
  | 'sports'
  | 'tools'
  | 'books'
  | 'pets'
  | 'services'
  | 'other'

export type MarketplaceCondition = 
  | 'new'
  | 'like-new'
  | 'good'
  | 'fair'
  | 'poor'

export type MarketplaceStatus = 
  | 'active'
  | 'sold'
  | 'expired'
  | 'removed'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Offer Code Types
export interface OfferCode {
  id: string
  code: string
  name: string
  description: string
  
  // Offer type and benefits
  offerType: 'discount_percentage' | 'discount_fixed' | 'free_upgrade' | 'free_months'
  
  // Discount values (used based on offerType)
  discountPercentage?: number // for discount_percentage (0-100)
  discountAmount?: number // for discount_fixed
  freeMonths?: number // for free_months
  upgradeToTier?: SubscriptionTier // for free_upgrade
  
  // Usage restrictions
  maxUses?: number // null = unlimited
  usedCount: number
  validFrom: Date
  validUntil: Date
  
  // Tier restrictions
  applicableTiers: ('free' | 'silver' | 'gold' | 'platinum')[]
  
  // Status and metadata
  isActive: boolean
  createdBy: string // Admin user ID
  createdAt: Date
  updatedAt: Date
  
  // Usage tracking
  usageHistory: OfferCodeUsage[]
}

export interface OfferCodeUsage {
  businessId: string
  userId: string
  usedAt: Date
  oldTier?: string
  newTier?: string
  discountApplied?: number
}

export interface OfferCodeValidationResult {
  isValid: boolean
  error?: string
  discountAmount?: number
  discountPercentage?: number
  freeMonths?: number
  upgradeToTier?: string
  finalPrice?: number
  description?: string
}

// Re-export auth types for convenience
export * from './auth'
