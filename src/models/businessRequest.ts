import { Schema, model, models } from 'mongoose'

// Business Request Schema
const BusinessRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  
  // Business Information
  businessName: { type: String, required: true },
  businessType: { type: String, required: true },
  description: { type: String, default: '' },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String, default: '' },
  
  // Request details
  requestMessage: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true 
  },
  
  // Admin response
  adminNotes: { type: String, default: '' },
  reviewedBy: { type: String }, // Admin user ID
  reviewedAt: { type: Date },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Create indexes
BusinessRequestSchema.index({ userId: 1 })
BusinessRequestSchema.index({ status: 1 })
BusinessRequestSchema.index({ createdAt: -1 })
BusinessRequestSchema.index({ businessName: 'text', description: 'text' })

export const BusinessRequest = models.BusinessRequest || model('BusinessRequest', BusinessRequestSchema)
