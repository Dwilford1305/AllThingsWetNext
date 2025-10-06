import { Schema, model, models, Document } from 'mongoose';

export interface IAdminNotification extends Document {
  id: string;
  type: 'user_signup' | 'business_request' | 'content_moderation' | 'system_alert' | 'error' | 'info';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  readAt?: Date;
  relatedEntity?: {
    type: 'user' | 'business' | 'event' | 'news' | 'job' | 'marketplace';
    id: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AdminNotificationSchema = new Schema<IAdminNotification>({
  id: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['user_signup', 'business_request', 'content_moderation', 'system_alert', 'error', 'info'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium' 
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  relatedEntity: {
    type: {
      type: String,
      enum: ['user', 'business', 'event', 'news', 'job', 'marketplace']
    },
    id: String
  },
  metadata: { type: Schema.Types.Mixed },
}, {
  timestamps: true
});

// Indexes for efficient queries
AdminNotificationSchema.index({ isRead: 1, createdAt: -1 });
AdminNotificationSchema.index({ type: 1, createdAt: -1 });
AdminNotificationSchema.index({ priority: 1, isRead: 1 });

export const AdminNotification = models.AdminNotification || model<IAdminNotification>('AdminNotification', AdminNotificationSchema);
