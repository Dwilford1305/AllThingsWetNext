import webpush from 'web-push';
import { connectToDatabase } from './mongodb';

// VAPID Keys Configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'admin@allthingswetaskiwin.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${VAPID_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface UserPushSubscription {
  userId: string;
  email: string;
  subscription: PushSubscription;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  
  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Generate VAPID keys (for setup)
  public static generateVAPIDKeys() {
    return webpush.generateVAPIDKeys();
  }

  // Get public VAPID key for client-side subscription
  public getPublicKey(): string | null {
    return VAPID_PUBLIC_KEY || null;
  }

  // Subscribe a user to push notifications
  public async subscribeUser(
    userId: string, 
    email: string, 
    subscription: PushSubscription,
    userAgent?: string
  ): Promise<boolean> {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection('pushSubscriptions');

      const subscriptionDoc: UserPushSubscription = {
        userId,
        email,
        subscription,
        userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      // Upsert subscription (replace if exists for this user)
      await collection.replaceOne(
        { userId },
        subscriptionDoc,
        { upsert: true }
      );

      console.log(`✅ User ${userId} subscribed to push notifications`);
      return true;
    } catch (error) {
      console.error('❌ Failed to subscribe user to push notifications:', error);
      return false;
    }
  }

  // Unsubscribe a user from push notifications
  public async unsubscribeUser(userId: string): Promise<boolean> {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection('pushSubscriptions');

      await collection.updateOne(
        { userId },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ User ${userId} unsubscribed from push notifications`);
      return true;
    } catch (error) {
      console.error('❌ Failed to unsubscribe user from push notifications:', error);
      return false;
    }
  }

  // Get user's push subscription
  public async getUserSubscription(userId: string): Promise<UserPushSubscription | null> {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection('pushSubscriptions');

      const subscription = await collection.findOne({ userId, isActive: true });
      return subscription as UserPushSubscription | null;
    } catch (error) {
      console.error('❌ Failed to get user push subscription:', error);
      return null;
    }
  }

  // Send push notification to a specific user
  public async sendToUser(
    userId: string, 
    notification: PushNotificationData
  ): Promise<boolean> {
    try {
      const userSubscription = await this.getUserSubscription(userId);
      if (!userSubscription) {
        console.log(`ℹ️ User ${userId} has no active push subscription`);
        return false;
      }

      return await this.sendNotification(userSubscription.subscription, notification);
    } catch (error) {
      console.error(`❌ Failed to send push notification to user ${userId}:`, error);
      return false;
    }
  }

  // Send push notification to multiple users
  public async sendToUsers(
    userIds: string[], 
    notification: PushNotificationData
  ): Promise<{ successful: number; failed: number }> {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendToUser(userId, notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;

    console.log(`📊 Push notification batch sent: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  }

  // Send push notification to all subscribed users
  public async sendToAll(notification: PushNotificationData): Promise<{ successful: number; failed: number }> {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection('pushSubscriptions');

      const subscriptions = await collection.find({ isActive: true }).toArray();
      
      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendNotification(sub.subscription, notification))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.length - successful;

      console.log(`📊 Broadcast push notification sent: ${successful} successful, ${failed} failed`);
      return { successful, failed };
    } catch (error) {
      console.error('❌ Failed to send broadcast push notification:', error);
      return { successful: 0, failed: 0 };
    }
  }

  // Send push notification based on user preferences
  public async sendNotificationWithPreferences(
    userId: string,
    notification: PushNotificationData,
    notificationType: 'marketplace' | 'events' | 'business' | 'news' | 'general'
  ): Promise<boolean> {
    try {
      // Check user's notification preferences
      const preferences = await this.getUserNotificationPreferences(userId);
      
      if (!preferences.pushNotifications.enabled) {
        console.log(`ℹ️ User ${userId} has push notifications disabled`);
        return false;
      }

      // Check specific notification type preferences
      if (!preferences.pushNotifications.types[notificationType]) {
        console.log(`ℹ️ User ${userId} has ${notificationType} push notifications disabled`);
        return false;
      }

      return await this.sendToUser(userId, notification);
    } catch (error) {
      console.error(`❌ Failed to send notification with preferences check for user ${userId}:`, error);
      return false;
    }
  }

  // Private method to send notification to a subscription
  private async sendNotification(
    subscription: PushSubscription, 
    notification: PushNotificationData
  ): Promise<boolean> {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn('⚠️ VAPID keys not configured - push notifications disabled');
      return false;
    }

    try {
      const payload = JSON.stringify(notification);
      
      await webpush.sendNotification(subscription, payload);
      console.log('✅ Push notification sent successfully');
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const webPushError = error as { statusCode: number; body?: string };
        
        // Handle specific error codes
        if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
          // Subscription is no longer valid, remove it
          console.log('🗑️ Push subscription is no longer valid, removing...');
          await this.removeInvalidSubscription(subscription);
        }
      }
      
      console.error('❌ Failed to send push notification:', error);
      return false;
    }
  }

  // Remove invalid subscription from database
  private async removeInvalidSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection('pushSubscriptions');

      await collection.updateOne(
        { 'subscription.endpoint': subscription.endpoint },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date()
          }
        }
      );
    } catch (error) {
      console.error('❌ Failed to remove invalid push subscription:', error);
    }
  }

  // Get user notification preferences (stub for now)
  private async getUserNotificationPreferences(userId: string): Promise<{
    pushNotifications: {
      enabled: boolean;
      types: {
        marketplace: boolean;
        events: boolean;
        business: boolean;
        news: boolean;
        general: boolean;
      };
    };
  }> {
    // TODO: Integrate with actual user preferences system
    // For now, return default preferences
    return {
      pushNotifications: {
        enabled: true,
        types: {
          marketplace: true,
          events: true,
          business: true,
          news: true,
          general: true
        }
      }
    };
  }

  // Get push notification statistics
  public async getStatistics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalSent: number;
    recentActivity: Array<{
      date: string;
      sent: number;
      delivered: number;
      failed: number;
    }>;
  }> {
    try {
      const { db } = await connectToDatabase();
      const subscriptionsCollection = db.collection('pushSubscriptions');
      
      const totalSubscriptions = await subscriptionsCollection.countDocuments({});
      const activeSubscriptions = await subscriptionsCollection.countDocuments({ isActive: true });

      // TODO: Implement actual statistics tracking
      return {
        totalSubscriptions,
        activeSubscriptions,
        totalSent: 0,
        recentActivity: []
      };
    } catch (error) {
      console.error('❌ Failed to get push notification statistics:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalSent: 0,
        recentActivity: []
      };
    }
  }

  // Predefined notification templates for common use cases
  public static templates = {
    marketplaceComment: (commenterName: string, listingTitle: string): PushNotificationData => ({
      title: 'New Comment on Your Listing',
      body: `${commenterName} commented on "${listingTitle}"`,
      icon: '/icons/icon-192x192.png',
      tag: 'marketplace-comment',
      url: '/marketplace',
      actions: [
        {
          action: 'view',
          title: 'View Comment'
        },
        {
          action: 'reply',
          title: 'Reply'
        }
      ]
    }),

    businessInquiry: (businessName: string): PushNotificationData => ({
      title: 'New Business Inquiry',
      body: `Someone is interested in ${businessName}`,
      icon: '/icons/icon-192x192.png',
      tag: 'business-inquiry',
      url: '/businesses/manage',
      actions: [
        {
          action: 'view',
          title: 'View Inquiry'
        }
      ]
    }),

    eventReminder: (eventTitle: string, eventDate: string): PushNotificationData => ({
      title: 'Event Reminder',
      body: `${eventTitle} is happening ${eventDate}`,
      icon: '/icons/icon-192x192.png',
      tag: 'event-reminder',
      url: '/events',
      actions: [
        {
          action: 'view',
          title: 'View Event'
        }
      ]
    }),

    newsUpdate: (headline: string): PushNotificationData => ({
      title: 'Breaking News',
      body: headline,
      icon: '/icons/icon-192x192.png',
      tag: 'news-update',
      url: '/news',
      actions: [
        {
          action: 'view',
          title: 'Read Article'
        }
      ]
    }),

    welcomeNotification: (): PushNotificationData => ({
      title: 'Welcome to AllThingsWetaskiwin!',
      body: 'Thanks for enabling notifications. Stay updated with your community!',
      icon: '/icons/icon-192x192.png',
      tag: 'welcome',
      url: '/',
      requireInteraction: true
    })
  };
}

export default PushNotificationService;