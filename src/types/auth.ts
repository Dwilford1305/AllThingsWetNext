// Authentication and User Management Types

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isEmailVerified: boolean
  profileImage?: string
  phone?: string
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  
  // Account status
  isActive: boolean
  isSuspended: boolean
  
  // Security
  twoFactorEnabled: boolean
  
  // Preferences
  preferences: UserPreferences
}

export type UserRole = 'user' | 'business_owner' | 'admin' | 'super_admin'

export interface UserPreferences {
  notifications: {
    email: boolean
    events: boolean
    news: boolean
    businessUpdates: boolean
    marketing: boolean
  }
  privacy: {
    profileVisible: boolean
    contactInfoVisible: boolean
  }
  theme: 'light' | 'dark' | 'system'
}

export interface BusinessOwner extends User {
  role: 'business_owner'
  businessIds: string[] // Can own multiple businesses
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verificationDocuments?: string[] // URLs to uploaded documents
}

export interface Admin extends User {
  role: 'admin' | 'super_admin'
  permissions: AdminPermission[]
  departmentAccess: string[] // Which departments/sections they can manage
}

export type AdminPermission = 
  | 'manage_users'
  | 'manage_businesses' 
  | 'manage_content'
  | 'manage_scrapers'
  | 'view_analytics'
  | 'manage_payments'
  | 'system_settings'
  | 'super_admin'

// Authentication related types
export interface AuthSession {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  accountType: 'user' | 'business_owner'
  agreeToTerms: boolean
  businessName?: string // If registering as business owner
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirm {
  token: string
  newPassword: string
}

export interface EmailVerificationRequest {
  token: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// Business ownership and claiming
export interface BusinessClaimRequest {
  businessId: string
  userId: string
  claimerName: string
  claimerEmail: string
  phone?: string
  message?: string
  verificationDocuments?: string[] // Business license, etc.
}

export interface BusinessClaimResponse {
  id: string
  businessId: string
  userId: string
  status: 'pending' | 'approved' | 'rejected'
  adminNotes?: string
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

// Enhanced Business type with proper user relationship
export interface BusinessWithOwner {
  id: string
  name: string
  description: string
  category: string
  address: string
  phone?: string
  email?: string
  website?: string
  
  // Ownership
  ownerId?: string // User ID of the owner
  owner?: User // Populated user data
  claimRequests?: BusinessClaimRequest[]
  
  // Subscription
  subscriptionTier: 'free' | 'silver' | 'gold' | 'platinum'
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled'
  subscriptionStart?: Date
  subscriptionEnd?: Date
  
  // Premium features
  logo?: string
  photos?: string[]
  hours?: Record<string, string>
  socialMedia?: Record<string, string>
  specialOffers?: Array<{
    title: string
    description: string
    validUntil: Date
  }>
  
  // Analytics
  analytics?: {
    views: number
    clicks: number
    callClicks: number
    websiteClicks: number
  }
  
  // Status
  isActive: boolean
  isVerified: boolean
  featured: boolean
  
  createdAt: Date
  updatedAt: Date
}
