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
    enum: ['restaurant', 'retail', 'automotive', 'health', 'professional-services', 'home-services', 'beauty', 'recreation', 'education', 'non-profit', 'other'],
    required: true 
  },
  address: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  hours: {
    monday: { type: String },
    tuesday: { type: String },
    wednesday: { type: String },
    thursday: { type: String },
    friday: { type: String },
    saturday: { type: String },
    sunday: { type: String }
  },
  imageUrl: { type: String },
  featured: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  rating: { type: Number, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  services: [{ type: String }],
  tags: [{ type: String }],
  socialMedia: {
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String }
  },
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

// Export models
export const Event = models.Event || model('Event', EventSchema)
export const NewsArticle = models.NewsArticle || model('NewsArticle', NewsSchema)
export const Business = models.Business || model('Business', BusinessSchema)
export const JobPosting = models.JobPosting || model('JobPosting', JobSchema)
export const Classified = models.Classified || model('Classified', ClassifiedSchema)
