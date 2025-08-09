import { Schema, model, models } from 'mongoose'

// Stores used or revoked refresh token JTIs for reuse detection & anomaly analysis
const RefreshTokenJtiSchema = new Schema({
  jti: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
  reason: { type: String, enum: ['rotated','revoked','reuse_detected'], default: 'rotated' },
  ip: { type: String },
  userAgent: { type: String }
})

RefreshTokenJtiSchema.index({ userId: 1, createdAt: -1 })
// Optional TTL (30 days) for historical entries; adjust as needed
RefreshTokenJtiSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

export const RefreshTokenJti = models.RefreshTokenJti || model('RefreshTokenJti', RefreshTokenJtiSchema)
