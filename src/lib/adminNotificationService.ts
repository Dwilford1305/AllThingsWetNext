import { randomUUID } from 'crypto';
import { connectDB } from './mongodb';
import { AdminNotification, IAdminNotification } from '@/models/adminNotification';
import { ComprehensiveEmailService } from './email/services/ComprehensiveEmailService';
import PushNotificationService from './pushNotificationService';
import { User } from '@/models/auth';

export interface CreateAdminNotificationOptions {
  type: 'user_signup' | 'business_request' | 'content_moderation' | 'system_alert' | 'error' | 'info';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  relatedEntity?: {
    type: 'user' | 'business' | 'event' | 'news' | 'job' | 'marketplace';
    id: string;
  };
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
  sendPush?: boolean;
}

export class AdminNotificationService {
  private static instance: AdminNotificationService;

  public static getInstance(): AdminNotificationService {
    if (!AdminNotificationService.instance) {
      AdminNotificationService.instance = new AdminNotificationService();
    }
    return AdminNotificationService.instance;
  }

  /**
   * Create a new admin notification and optionally send email/push
   */
  async createNotification(options: CreateAdminNotificationOptions): Promise<IAdminNotification | null> {
    try {
      await connectDB();

      const notification = await AdminNotification.create({
        id: `notif_${randomUUID()}`,
        type: options.type,
        title: options.title,
        message: options.message,
        priority: options.priority || 'medium',
        isRead: false,
        relatedEntity: options.relatedEntity,
        metadata: options.metadata,
      });

      // Send email notification to admin(s) if enabled
      if (options.sendEmail !== false) {
        await this.sendEmailNotification(notification);
      }

      // Send push notification to admin(s) if enabled
      if (options.sendPush !== false) {
        await this.sendPushNotification(notification);
      }

      console.log(`📢 Admin notification created: ${notification.type} - ${notification.title}`);

      return notification;
    } catch (error) {
      console.error('❌ Failed to create admin notification:', error);
      return null;
    }
  }

  /**
   * Send email notification to all admin users
   */
  private async sendEmailNotification(notification: IAdminNotification): Promise<void> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@allthingswet.ca';
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      // Get priority color
      const priorityColor = {
        low: '#4CAF50',
        medium: '#2196F3',
        high: '#FF9800',
        critical: '#F44336'
      }[notification.priority];

      // Queue email to admin
      await ComprehensiveEmailService.queueEmail({
        to: adminEmail,
        subject: `[${notification.priority.toUpperCase()}] ${notification.title}`,
        templateType: 'marketing',
        templateData: {
          subject: `[${notification.priority.toUpperCase()}] ${notification.title}`,
          preheader: notification.message,
          heading: notification.title,
          body: notification.message,
          ctaText: 'View in Dashboard',
          ctaUrl: notification.relatedEntity 
            ? `${siteUrl}/admin?view=${notification.relatedEntity.type}&id=${notification.relatedEntity.id}`
            : `${siteUrl}/admin`,
          priority: notification.priority,
          type: notification.type,
          metadata: notification.metadata,
        },
        priority: notification.priority === 'critical' ? 'high' : 'normal'
      });

      console.log(`📧 Admin email notification queued: ${notification.title}`);
    } catch (error) {
      console.error('❌ Failed to send admin email notification:', error);
    }
  }

  /**
   * Send push notification to all admin users
   */
  private async sendPushNotification(notification: IAdminNotification): Promise<void> {
    try {
      await connectDB();

      // Find all admin users
      const adminUsers = await User.find({ 
        role: { $in: ['admin', 'super_admin'] },
        isActive: true 
      }).select('id email');

      const pushService = PushNotificationService.getInstance();

      // Send push to each admin
      for (const admin of adminUsers) {
        await pushService.sendToUser(admin.id, {
          title: `[${notification.priority.toUpperCase()}] ${notification.title}`,
          body: notification.message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: `admin-notification-${notification.id}`,
          requireInteraction: notification.priority === 'critical',
          data: {
            notificationId: notification.id,
            type: notification.type,
            priority: notification.priority,
            relatedEntity: notification.relatedEntity,
            url: '/admin'
          },
          actions: [
            {
              action: 'view',
              title: 'View in Dashboard',
            },
            {
              action: 'dismiss',
              title: 'Dismiss',
            }
          ]
        });
      }

      console.log(`🔔 Push notifications sent to ${adminUsers.length} admin(s): ${notification.title}`);
    } catch (error) {
      console.error('❌ Failed to send admin push notification:', error);
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    try {
      await connectDB();
      return await AdminNotification.countDocuments({ isRead: false });
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Get recent notifications
   */
  async getRecentNotifications(limit: number = 50, includeRead: boolean = false): Promise<any[]> {
    try {
      await connectDB();
      
      const query = includeRead ? {} : { isRead: false };
      
      return await AdminNotification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('❌ Failed to get recent notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await connectDB();
      
      const result = await AdminNotification.findOneAndUpdate(
        { id: notificationId, isRead: false },
        { 
          isRead: true,
          readAt: new Date()
        }
      );

      return result !== null;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    try {
      await connectDB();
      
      const result = await AdminNotification.updateMany(
        { isRead: false },
        { 
          isRead: true,
          readAt: new Date()
        }
      );

      return result.modifiedCount || 0;
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Delete old notifications (older than specified days)
   */
  async cleanupOldNotifications(daysOld: number = 90): Promise<number> {
    try {
      await connectDB();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await AdminNotification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('❌ Failed to cleanup old notifications:', error);
      return 0;
    }
  }

  /**
   * Get notification statistics
   */
  async getStatistics(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    try {
      await connectDB();

      const [total, unread, byType, byPriority] = await Promise.all([
        AdminNotification.countDocuments(),
        AdminNotification.countDocuments({ isRead: false }),
        AdminNotification.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        AdminNotification.aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ])
      ]);

      return {
        total,
        unread,
        byType: byType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      };
    } catch (error) {
      console.error('❌ Failed to get notification statistics:', error);
      return {
        total: 0,
        unread: 0,
        byType: {},
        byPriority: {}
      };
    }
  }
}

export default AdminNotificationService;
