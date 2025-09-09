import { Schema, model, models } from 'mongoose'

// Event Schema
const EventSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: { type: Date },
  time: { type: String, required: true },
  location: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['community', 'sports', 'arts', 'music', 'food', 'education', 'business', 'family', 'health', 'other'],
    required: true 
  },
  organizer: { type: String, required: true },
  contactEmail: { type: String },
  contactPhone: { type: String },
  website: { type: String },
  imageUrl: { type: String },
  featured: { type: Boolean, default: false },
  price: { type: Number },
  ticketUrl: { type: String },
  sourceUrl: { type: String },
  sourceName: { type: String },
  addedAt: { type: Date, default: Date.now }, // Track when event was first added to our system
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// News Schema
const NewsSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  content: { type: String },
  category: { 
    type: String, 
    enum: ['local-news', 'city-council', 'business', 'sports', 'community', 'education', 'health', 'weather', 'other'],
    required: true 
  },
  author: { type: String },
  publishedAt: { type: Date, required: true },
  imageUrl: { type: String },
  sourceUrl: { type: String, required: true },
  sourceName: { type: String, required: true },
  tags: [{ type: String }],
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Business Schema
const BusinessSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['restaurant', 'retail', 'automotive', 'health', 'professional', 'home-services', 'beauty', 'recreation', 'education', 'non-profit', 'other'],
    required: true 
  },
  address: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  
  // Contact information from scraping
  contact: { type: String }, // Contact person name
  sourceUrl: { type: String }, // Where we scraped it from
  
  // Premium subscription features
  subscriptionTier: { 
    type: String, 
    enum: ['free', 'silver', 'gold', 'platinum'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'trial', 'cancelled'],
    default: 'inactive'
  },
  subscriptionStart: { type: Date },
  subscriptionEnd: { type: Date },
  isClaimed: { type: Boolean, default: false }, // Has business owner claimed this listing
  claimedBy: { type: String }, // Email of person who claimed it
  claimedByUserId: { type: String }, // ID of user who claimed it
  claimedAt: { type: Date },
  
  // Premium features (only available with subscription)
  logo: { type: String }, // Logo image URL
  photos: [{ type: String }], // Gallery photos
  hours: {
    monday: { type: String },
    tuesday: { type: String },
    wednesday: { type: String },
    thursday: { type: String },
    friday: { type: String },
    saturday: { type: String },
    sunday: { type: String }
  },
  socialMedia: {
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
    linkedin: { type: String }
  },
  specialOffers: [{ 
    title: { type: String },
    description: { type: String },
    validUntil: { type: Date }
  }],
  
  // Analytics (for premium users)
  analytics: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    callClicks: { type: Number, default: 0 },
    websiteClicks: { type: Number, default: 0 }
  },
  
  // Job posting quota (marketplace feature)
  jobPostingQuota: {
    monthly: { type: Number, default: 0 }, // Free tier gets 0 job postings
    used: { type: Number, default: 0 },
    resetDate: { type: Date, default: () => new Date() }
  },
  
  // Basic fields (always available)
  imageUrl: { type: String }, // Basic business image
  featured: { type: Boolean, default: false }, // Premium placement
  verified: { type: Boolean, default: false },
  rating: { type: Number, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  services: [{ type: String }],
  tags: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Job Schema
const JobSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['healthcare', 'education', 'retail', 'hospitality', 'construction', 'manufacturing', 'office', 'transportation', 'agriculture', 'government', 'non-profit', 'other'],
    required: true 
  },
  type: { 
    type: String, 
    enum: ['full-time', 'part-time', 'contract', 'temporary', 'volunteer', 'internship'],
    required: true 
  },
  salaryRange: { type: String },
  requirements: [{ type: String }],
  benefits: [{ type: String }],
  contactEmail: { type: String },
  contactPhone: { type: String },
  applicationUrl: { type: String },
  featured: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  sourceUrl: { type: String },
  sourceName: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Marketplace Listing Schema
const MarketplaceListingSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['vehicles', 'real-estate', 'electronics', 'furniture', 'clothing', 'sports', 'tools', 'books', 'pets', 'services', 'other'],
    required: true 
  },
  price: { type: Number },
  condition: { 
    type: String, 
    enum: ['new', 'like-new', 'good', 'fair', 'poor']
  },
  location: { type: String, required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String },
  contactPhone: { type: String },
  images: [{ type: String }],
  featured: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['active', 'sold', 'expired', 'removed'],
    default: 'active'
  },
  
  // User reference and ownership
  userId: { type: String, required: true }, // Owner of the listing
  
  // Moderation
  isReported: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 },
  moderation: {
    state: { type: String, enum: ['hidden', 'awaiting_review', 'none'], default: 'none' },
    reason: { type: String },
    adminUserId: { type: String },
    updatedAt: { type: Date }
  },
  // Reactions (Facebook-like): users (by id) who reacted
  reactions: {
    like: [{ type: String }],
    love: [{ type: String }],
    haha: [{ type: String }],
    wow: [{ type: String }],
    sad: [{ type: String }],
    angry: [{ type: String }]
  },
  
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Marketplace Comment Schema
const MarketplaceCommentSchema = new Schema({
  id: { type: String, required: true, unique: true },
  listingId: { type: String, required: true }, // Reference to marketplace listing
  userId: { type: String, required: true }, // User who posted the comment
  userName: { type: String, required: true }, // Cache user name for display
  content: { type: String, required: true },
  
  // Moderation
  isReported: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 },
  isHidden: { type: Boolean, default: false },
  moderation: {
    state: { type: String, enum: ['hidden', 'awaiting_review', 'none'], default: 'none' },
    reason: { type: String },
    adminUserId: { type: String },
    updatedAt: { type: Date }
  },
  // Reactions (Facebook-like): users (by id) who reacted
  reactions: {
    like: [{ type: String }],
    love: [{ type: String }],
    haha: [{ type: String }],
    wow: [{ type: String }],
    sad: [{ type: String }],
    angry: [{ type: String }]
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Report Schema (for both listings and comments)
const ReportSchema = new Schema({
  id: { type: String, required: true, unique: true },
  reporterUserId: { type: String, required: true }, // User who submitted the report
  reporterName: { type: String, required: true }, // Cache reporter name
  
  // Content being reported
  reportType: { 
    type: String, 
    enum: ['listing', 'comment'],
    required: true 
  },
  contentId: { type: String, required: true }, // ID of listing or comment
  contentType: { type: String }, // Additional context
  
  // Report details
  reason: { 
    type: String, 
    enum: ['spam', 'inappropriate', 'scam', 'harassment', 'copyright', 'other'],
    required: true 
  },
  description: { type: String, required: true },
  
  // Admin handling
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminUserId: { type: String }, // Admin who handled the report
  adminNotes: { type: String },
  resolvedAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Scraper Log Schema
// NOTE: Added 'comprehensive' to enum to align with ComprehensiveScraperService.saveScrapingSession
// which was previously writing a log with type 'comprehensive' causing a validation error & lost logs.
const ScraperLogSchema = new Schema({
  type: { 
    type: String, 
    enum: ['news', 'events', 'businesses', 'comprehensive'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['started', 'completed', 'error'], 
    required: true 
  },
  message: { type: String, required: true },
  duration: { type: Number }, // in milliseconds
  itemsProcessed: { type: Number, default: 0 },
  errorMessages: [{ type: String }], // Renamed from 'errors' to avoid Mongoose warning
  createdAt: { type: Date, default: Date.now }
})

// Scraper Configuration Schema
const ScraperConfigSchema = new Schema({
  type: { 
    type: String, 
    enum: ['news', 'events', 'businesses'], 
    required: true,
    unique: true
  },
  isEnabled: { type: Boolean, default: true },
  intervalHours: { type: Number, required: true }, // interval in hours
  lastRun: { type: Date },
  nextRun: { type: Date },
  isActive: { type: Boolean, default: false }, // currently running
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Offer Code Schema
const OfferCodeSchema = new Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true }, // Display name for the offer
  description: { type: String, required: true },
  
  // Offer type and benefits
  offerType: {
    type: String,
    enum: ['discount_percentage', 'discount_fixed', 'free_upgrade', 'free_months'],
    required: true
  },
  
  // Discount values (used based on offerType)
  discountPercentage: { type: Number, min: 0, max: 100 }, // for discount_percentage
  discountAmount: { type: Number, min: 0 }, // for discount_fixed
  freeMonths: { type: Number, min: 0 }, // for free_months
  upgradeToTier: { 
    type: String,
    enum: ['silver', 'gold', 'platinum']
  }, // for free_upgrade
  
  // Usage restrictions
  maxUses: { type: Number, default: null }, // null = unlimited
  usedCount: { type: Number, default: 0 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  
  // Tier restrictions
  applicableTiers: [{
    type: String,
    enum: ['free', 'silver', 'gold', 'platinum']
  }], // Which tiers can use this code
  
  // Status and metadata
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true }, // Admin user ID
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Usage tracking
  usageHistory: [{
    businessId: { type: String, required: true },
    userId: { type: String, required: true },
    usedAt: { type: Date, default: Date.now },
    oldTier: { type: String },
    newTier: { type: String },
    discountApplied: { type: Number }
  }]
})

// Business Ad Schemas for each tier
const BusinessAdSchema = new Schema({
  id: { type: String, required: true, unique: true },
  businessId: { type: String, required: true, index: true },
  tier: { 
    type: String, 
    enum: ['silver', 'gold', 'platinum'],
    required: true 
  },
  // Ad content
  photo: { type: String, required: true }, // Required photo for all tiers
  logo: { type: String }, // Optional logo (only for platinum tier)
  businessName: { type: String, required: true }, // Cached business name
  isActive: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true }, // Admin can hide/show ads
  
  // Ad specifications based on tier
  adSize: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  
  // Performance tracking
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Compound index for efficient queries
BusinessAdSchema.index({ tier: 1, isActive: 1, isVisible: 1 })
BusinessAdSchema.index({ businessId: 1, tier: 1 })

// Export models
export const Event = models.Event || model('Event', EventSchema)
export const NewsArticle = models.NewsArticle || model('NewsArticle', NewsSchema)
export const Business = models.Business || model('Business', BusinessSchema)
export const JobPosting = models.JobPosting || model('JobPosting', JobSchema)
export const MarketplaceListing = models.MarketplaceListing || model('MarketplaceListing', MarketplaceListingSchema)
export const MarketplaceComment = models.MarketplaceComment || model('MarketplaceComment', MarketplaceCommentSchema)
export const Report = models.Report || model('Report', ReportSchema)
export const ScraperLog = models.ScraperLog || model('ScraperLog', ScraperLogSchema)
export const ScraperConfig = models.ScraperConfig || model('ScraperConfig', ScraperConfigSchema)
export const OfferCode = models.OfferCode || model('OfferCode', OfferCodeSchema)
export const BusinessAd = models.BusinessAd || model('BusinessAd', BusinessAdSchema)

// Re-export auth models for convenience
export * from './auth'

// Re-export email models
export * from './email'
