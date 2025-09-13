import { Schema, model, models } from 'mongoose'

// User Schema
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, default: '' },
  firstName: { type: String, required: true },
  // Optional public handle for display; unique if provided
  username: {
    type: String,
    unique: true,
    sparse: true, // allow many docs without username
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 32,
    match: [/^[a-z0-9_.]+$/i, 'Username can only contain letters, numbers, underscore and dot']
  },
  lastName: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'business_owner', 'admin', 'super_admin'],
    default: 'user',
    required: true 
  },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationTokenExpires: { type: Date },
  
  profileImage: { type: String },
  phone: { type: String },
  
  // Account status
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  suspensionReason: { type: String },
  
  // Security
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  twoFactorTempSecret: { type: String }, // secret awaiting confirmation
  twoFactorBackupCodes: [{ type: String }], // hashed codes
  twoFactorPendingUntil: { type: Date }, // time window for confirming enrollment
  passwordResetToken: { type: String },
  passwordResetTokenExpires: { type: Date },
  
  // Login tracking
  lastLoginAt: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  
  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      news: { type: Boolean, default: true },
      businessUpdates: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    privacy: {
      profileVisible: { type: Boolean, default: true },
      contactInfoVisible: { type: Boolean, default: false }
    },
    theme: { 
      type: String, 
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  
  // Business owner specific fields
  businessIds: [{ type: String }], // References to Business.id
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'verified' // Default to verified, will be overridden for business_owners during creation
  },
  verificationDocuments: [{ type: String }], // URLs to uploaded documents
  
  // Marketplace subscription fields
  marketplaceSubscription: {
    tier: { 
      type: String, 
      enum: ['free', 'silver', 'gold', 'platinum'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'trial', 'cancelled', 'past_due'],
      default: 'inactive'
    },
    subscriptionStart: { type: Date },
    subscriptionEnd: { type: Date },
    paypalSubscriptionId: { type: String }, // PayPal subscription ID
    
    // Quota management
    adQuota: {
      monthly: { type: Number, default: 1 }, // Free tier gets 1 ad per month
      used: { type: Number, default: 0 },
      resetDate: { type: Date, default: () => new Date() } // Next month's 1st day
    },
    
    // Premium features enabled
    features: {
      featuredAds: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      photoLimit: { type: Number, default: 1 }, // Free tier gets 1 photo
      adDuration: { type: Number, default: 30 } // Free tier: 30 days
    }
  },
  
  // Admin specific fields
  permissions: [{
    type: String,
    enum: [
      'manage_users',
      'manage_businesses',
      'manage_content', 
      'manage_scrapers',
      'view_analytics',
      'manage_payments',
      'system_settings',
      'super_admin'
    ]
  }],
  departmentAccess: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Business Claim Request Schema
const BusinessClaimRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  businessId: { type: String, required: true },
  userId: { type: String, required: true },
  claimerName: { type: String, required: true },
  claimerEmail: { type: String, required: true },
  phone: { type: String },
  message: { type: String },
  verificationDocuments: [{ type: String }],
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  adminNotes: { type: String },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: String }, // Admin user ID
  
  // Automatic approval tracking
  autoApprovalChecks: {
    emailMatch: { type: Boolean, default: false },
    phoneMatch: { type: Boolean, default: false },
    websiteMatch: { type: Boolean, default: false }
  }
})

// User Session Schema (for tracking active sessions)
const UserSessionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  accessToken: { type: String, required: true, unique: true },
  refreshToken: { type: String, required: true, unique: true },
  deviceInfo: {
    userAgent: { type: String },
    ip: { type: String },
    device: { type: String },
    location: { type: String }
  },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now }
})

// User Activity Log Schema
const UserActivityLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  action: { type: String, required: true }, // 'login', 'logout', 'password_change', etc.
  details: { type: Schema.Types.Mixed }, // Additional action-specific data
  ip: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
  errorMessage: { type: String },
  createdAt: { type: Date, default: Date.now }
})

// Add indexes for performance (avoiding duplicates for unique fields)
UserSchema.index({ role: 1 })
UserSchema.index({ isActive: 1 })
UserSchema.index({ businessIds: 1 })

BusinessClaimRequestSchema.index({ businessId: 1 })
BusinessClaimRequestSchema.index({ userId: 1 })
BusinessClaimRequestSchema.index({ status: 1 })

UserSessionSchema.index({ userId: 1 })
// accessToken already has unique: true, no need for explicit index
UserSessionSchema.index({ expiresAt: 1 })

UserActivityLogSchema.index({ userId: 1 })
UserActivityLogSchema.index({ createdAt: -1 })

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`
})

// Pre-save middleware to update timestamps
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Methods for account locking
UserSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now())
}

UserSchema.methods.incLoginAttempts = function() {
  // If we have previous failed attempts and have since become unlocked, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    })
  }
  
  const updates: { $inc: { loginAttempts: number }; $set?: { lockUntil: number } } = { $inc: { loginAttempts: 1 } }
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 } // 2 hours
  }
  
  return this.updateOne(updates)
}

UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  })
}

// Additional schemas expected by tests
const RefreshTokenSchema = new Schema({
  id: { type: String, required: true, unique: true },
  token: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
})

const SessionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  lastAccessed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
})

// Export models
export const User = models.User || model('User', UserSchema)
export const BusinessClaimRequest = models.BusinessClaimRequest || model('BusinessClaimRequest', BusinessClaimRequestSchema)
export const UserSession = models.UserSession || model('UserSession', UserSessionSchema)
export const UserActivityLog = models.UserActivityLog || model('UserActivityLog', UserActivityLogSchema)
export const RefreshToken = models.RefreshToken || model('RefreshToken', RefreshTokenSchema)
export const Session = models.Session || model('Session', SessionSchema)
