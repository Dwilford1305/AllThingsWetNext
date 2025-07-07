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

// Classified Schema
const ClassifiedSchema = new Schema({
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
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Scraper Log Schema
const ScraperLogSchema = new Schema({
  type: { 
    type: String, 
    enum: ['news', 'events', 'businesses'], 
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
  errors: [{ type: String }],
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

// Export models
export const Event = models.Event || model('Event', EventSchema)
export const NewsArticle = models.NewsArticle || model('NewsArticle', NewsSchema)
export const Business = models.Business || model('Business', BusinessSchema)
export const JobPosting = models.JobPosting || model('JobPosting', JobSchema)
export const Classified = models.Classified || model('Classified', ClassifiedSchema)
export const ScraperLog = models.ScraperLog || model('ScraperLog', ScraperLogSchema)
export const ScraperConfig = models.ScraperConfig || model('ScraperConfig', ScraperConfigSchema)
