'use client';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private publicKey: string | null = null;
  private isSupported: boolean;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.isSupported = this.checkSupport();
  }

  public static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  // Check if push notifications are supported
  private checkSupport(): boolean {
    if (typeof window === 'undefined') return false;
    
    return !!(
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  // Initialize push notification manager
  public async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service worker registered');

      // Get push configuration
      const config = await this.fetchPushConfig();
      if (!config.success) {
        console.warn('Push notifications not configured on server');
        return false;
      }

      this.publicKey = config.publicKey;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Request notification permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('📲 Notification permission:', permission);
      return permission;
    }

    return 'denied';
  }

  // Check current permission status
  public getPermissionStatus(): NotificationPermission {
    if (!this.isSupported || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Check if user is currently subscribed to push notifications
  public async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('❌ Failed to check subscription status:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  public async subscribe(): Promise<boolean> {
    if (!this.isSupported || !this.registration || !this.publicKey) {
      console.warn('Cannot subscribe: missing requirements');
      return false;
    }

    try {
      // Check permission
      const permission = this.getPermissionStatus();
      if (permission !== 'granted') {
        const newPermission = await this.requestPermission();
        if (newPermission !== 'granted') {
          console.warn('Push notification permission denied');
          return false;
        }
      }

      // Subscribe to push manager
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicKey)
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Successfully subscribed to push notifications');
        return true;
      } else {
        console.error('❌ Failed to save subscription on server:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  // Unsubscribe from push notifications
  public async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe from push manager
        const unsubscribed = await subscription.unsubscribe();
        
        if (unsubscribed) {
          // Notify server
          const response = await fetch('/api/push/subscription', {
            method: 'DELETE',
            credentials: 'include'
          });

          const result = await response.json();
          
          if (result.success) {
            console.log('✅ Successfully unsubscribed from push notifications');
            return true;
          } else {
            console.warn('⚠️ Unsubscribed locally but failed to notify server:', result.error);
            return true; // Still consider it successful since local unsubscribe worked
          }
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Show a test notification
  public async showTestNotification(): Promise<boolean> {
    if (!this.isSupported || this.getPermissionStatus() !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification('AllThingsWetaskiwin Test', {
        body: 'Push notifications are working correctly!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test-notification'
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('❌ Failed to show test notification:', error);
      return false;
    }
  }

  // Get subscription details for debugging
  public async getSubscriptionDetails(): Promise<PushSubscriptionData | null> {
    if (!this.registration) {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      return subscription ? subscription.toJSON() as PushSubscriptionData : null;
    } catch (error) {
      console.error('❌ Failed to get subscription details:', error);
      return null;
    }
  }

  // Fetch push configuration from server
  private async fetchPushConfig(): Promise<{
    success: boolean;
    publicKey?: string;
    supportsPush?: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/push/config');
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch push config:', error);
      return { success: false, error: 'Failed to fetch configuration' };
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Check if notifications are supported and enabled
  public getStatus(): {
    supported: boolean;
    permission: NotificationPermission;
    serviceWorkerReady: boolean;
    configurationReady: boolean;
  } {
    return {
      supported: this.isSupported,
      permission: this.getPermissionStatus(),
      serviceWorkerReady: !!this.registration,
      configurationReady: !!this.publicKey
    };
  }

  // Enable push notifications with user-friendly flow
  public async enable(): Promise<{
    success: boolean;
    error?: string;
    step?: string;
  }> {
    try {
      // Step 1: Initialize
      const initialized = await this.initialize();
      if (!initialized) {
        return { 
          success: false, 
          error: 'Failed to initialize push notification system',
          step: 'initialization'
        };
      }

      // Step 2: Request permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return { 
          success: false, 
          error: 'Notification permission denied',
          step: 'permission'
        };
      }

      // Step 3: Subscribe
      const subscribed = await this.subscribe();
      if (!subscribed) {
        return { 
          success: false, 
          error: 'Failed to subscribe to push notifications',
          step: 'subscription'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to enable push notifications:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        step: 'unknown'
      };
    }
  }

  // Disable push notifications
  public async disable(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const unsubscribed = await this.unsubscribe();
      if (!unsubscribed) {
        return { 
          success: false, 
          error: 'Failed to unsubscribe from push notifications'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to disable push notifications:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default PushNotificationManager;