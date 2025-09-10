import { Schema, model, models } from 'mongoose'

// Email Analytics Schema
const EmailAnalyticsSchema = new Schema({
  id: { type: String, required: true, unique: true },
  
  // Email identification
  emailId: { type: String, required: true, unique: true }, // Unique tracking ID for each email
  templateType: { 
    type: String, 
    enum: [
      'email_verification',
      'password_reset', 
      'business_approval',
      'business_rejection',
      'business_request_confirmation',
      'event_notification',
      'newsletter',
      'subscription_confirmation',
      'welcome',
      'marketing'
    ],
    required: true 
  },
  
  // Recipient information
  recipientEmail: { type: String, required: true },
  recipientId: { type: String }, // User ID if available
  
  // Email content metadata
  subject: { type: String, required: true },
  campaignId: { type: String }, // For newsletter/marketing campaigns
  
  // Delivery tracking
  sentAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date },
  deliveryStatus: {
    type: String,
    enum: ['sent', 'delivered', 'bounced', 'failed'],
    default: 'sent'
  },
  
  // Engagement tracking
  opened: { type: Boolean, default: false },
  openedAt: { type: Date },
  openCount: { type: Number, default: 0 },
  
  clicked: { type: Boolean, default: false },
  clickedAt: { type: Date },
  clickCount: { type: Number, default: 0 },
  
  // Click tracking details
  clickedUrls: [{
    url: { type: String },
    clickedAt: { type: Date },
    count: { type: Number, default: 1 }
  }],
  
  // Unsubscribe tracking
  unsubscribed: { type: Boolean, default: false },
  unsubscribedAt: { type: Date },
  
  // Device and location data (from open/click events)
  deviceInfo: {
    userAgent: { type: String },
    ip: { type: String },
    browser: { type: String },
    os: { type: String },
    device: { type: String }
  },
  
  // Email provider data
  providerMessageId: { type: String }, // Message ID from email provider
  providerData: { type: Schema.Types.Mixed }, // Additional provider-specific data
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Email Queue Schema
const EmailQueueSchema = new Schema({
  id: { type: String, required: true, unique: true },
  
  // Email details
  to: { type: String, required: true },
  from: { type: String, required: true },
  subject: { type: String, required: true },
  html: { type: String, required: true },
  text: { type: String },
  
  // Template information
  templateType: { 
    type: String, 
    enum: [
      'email_verification',
      'password_reset', 
      'business_approval',
      'business_rejection',
      'business_request_confirmation',
      'event_notification',
      'newsletter',
      'subscription_confirmation',
      'welcome',
      'marketing'
    ],
    required: true 
  },
  templateData: { type: Schema.Types.Mixed }, // Data used to render template
  
  // Queue management
  status: {
    type: String,
    enum: ['pending', 'processing', 'sent', 'failed', 'retrying'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Scheduling
  scheduledFor: { type: Date, default: Date.now },
  sentAt: { type: Date },
  
  // Retry logic
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  nextRetryAt: { type: Date },
  lastError: { type: String },
  errorHistory: [{ 
    error: { type: String },
    occurredAt: { type: Date, default: Date.now }
  }],
  
  // Analytics tracking
  trackingId: { type: String }, // Links to EmailAnalytics
  
  // Metadata
  userId: { type: String }, // User ID if email is user-specific
  businessId: { type: String }, // Business ID if email is business-specific
  campaignId: { type: String }, // Campaign ID for marketing emails
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Email Preferences Schema (embedded in User model but also standalone for analytics)
const EmailPreferencesSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  
  // Email preferences
  preferences: {
    // Transactional emails (cannot be disabled)
    transactional: { type: Boolean, default: true }, // Account-related emails
    
    // Marketing and community emails
    marketing: { type: Boolean, default: false },
    newsletter: { type: Boolean, default: true },
    eventNotifications: { type: Boolean, default: true },
    businessUpdates: { type: Boolean, default: true },
    newsDigest: { type: Boolean, default: true },
    
    // Frequency preferences
    frequency: {
      type: String,
      enum: ['immediate', 'daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    
    // Digest preferences
    digestTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      default: 'morning'
    }
  },

  // Push notification preferences
  pushNotifications: {
    enabled: { type: Boolean, default: false },
    types: {
      marketplace: { type: Boolean, default: true }, // Marketplace comments, messages
      events: { type: Boolean, default: true }, // Event reminders, updates
      business: { type: Boolean, default: true }, // Business inquiries, updates
      news: { type: Boolean, default: true }, // Breaking news, important updates
      general: { type: Boolean, default: true } // General community notifications
    },
    quietHours: {
      enabled: { type: Boolean, default: true },
      start: { type: String, default: '22:00' }, // 10 PM
      end: { type: String, default: '08:00' } // 8 AM
    },
    frequency: {
      type: String,
      enum: ['immediate', 'bundled', 'daily'],
      default: 'immediate'
    }
  },
  
  // Global unsubscribe
  unsubscribedFromAll: { type: Boolean, default: false },
  unsubscribedAt: { type: Date },
  
  // Bounce management
  bounceCount: { type: Number, default: 0 },
  lastBounceAt: { type: Date },
  isSuppressed: { type: Boolean, default: false }, // Suppressed due to bounces
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Add indexes for performance
// emailId already has unique: true, so no need for explicit index
EmailAnalyticsSchema.index({ recipientEmail: 1 })
EmailAnalyticsSchema.index({ templateType: 1 })
EmailAnalyticsSchema.index({ sentAt: -1 })
EmailAnalyticsSchema.index({ campaignId: 1 })

EmailQueueSchema.index({ status: 1, scheduledFor: 1 })
EmailQueueSchema.index({ priority: 1, scheduledFor: 1 })
EmailQueueSchema.index({ userId: 1 })
EmailQueueSchema.index({ businessId: 1 })

// userId already has unique: true, so no need for explicit index
EmailPreferencesSchema.index({ email: 1 })

// Pre-save middleware to update timestamps
EmailAnalyticsSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

EmailQueueSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

EmailPreferencesSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Export models
export const EmailAnalytics = models.EmailAnalytics || model('EmailAnalytics', EmailAnalyticsSchema)
export const EmailQueue = models.EmailQueue || model('EmailQueue', EmailQueueSchema)
export const EmailPreferences = models.EmailPreferences || model('EmailPreferences', EmailPreferencesSchema)