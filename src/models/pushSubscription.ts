import { Schema, model, models } from 'mongoose'

// Push Subscription Schema
const PushSubscriptionSchema = new Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
})

// Index for efficient queries
PushSubscriptionSchema.index({ userId: 1 })
PushSubscriptionSchema.index({ email: 1 })
PushSubscriptionSchema.index({ 'subscription.endpoint': 1 }, { unique: true })

export const PushSubscriptionModel = models.PushSubscription || model('PushSubscription', PushSubscriptionSchema)