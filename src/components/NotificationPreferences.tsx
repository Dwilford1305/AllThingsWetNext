'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import PushNotificationManager from '../lib/client/PushNotificationManager';
import { 
  Mail, 
  Bell, 
  Settings, 
  Check, 
  X, 
  RefreshCw,
  Clock,
  Volume2,
  VolumeX,
  TestTube
} from 'lucide-react';

interface EmailPreferences {
  transactional: boolean;
  marketing: boolean;
  newsletter: boolean;
  eventNotifications: boolean;
  businessUpdates: boolean;
  newsDigest: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  digestTime: 'morning' | 'afternoon' | 'evening';
}

interface PushNotificationPreferences {
  enabled: boolean;
  types: {
    marketplace: boolean;
    events: boolean;
    business: boolean;
    news: boolean;
    general: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'immediate' | 'bundled' | 'daily';
}

interface UserPreferences {
  email: EmailPreferences;
  pushNotifications: PushNotificationPreferences;
  unsubscribedFromAll: boolean;
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    email: {
      transactional: true,
      marketing: false,
      newsletter: true,
      eventNotifications: true,
      businessUpdates: true,
      newsDigest: true,
      frequency: 'weekly',
      digestTime: 'morning'
    },
    pushNotifications: {
      enabled: false,
      types: {
        marketplace: true,
        events: true,
        business: true,
        news: true,
        general: true
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      },
      frequency: 'immediate'
    },
    unsubscribedFromAll: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState({
    supported: false,
    permission: 'default' as NotificationPermission,
    subscribed: false,
    enabling: false
  });

  const pushManager = PushNotificationManager.getInstance();

  useEffect(() => {
    loadPreferences();
    checkPushStatus();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/email/preferences', {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setPreferences(result.preferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPushStatus = async () => {
    try {
      const status = pushManager.getStatus();
      const subscribed = await pushManager.isSubscribed();
      
      setPushStatus({
        supported: status.supported,
        permission: status.permission,
        subscribed,
        enabling: false
      });
    } catch (error) {
      console.error('Failed to check push status:', error);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/email/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(preferences)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Preferences saved successfully!');
      } else {
        alert(`❌ Failed to save preferences: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('❌ Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePushNotifications = async () => {
    if (!pushStatus.supported) {
      alert('❌ Push notifications are not supported on this device/browser');
      return;
    }

    setPushStatus(prev => ({ ...prev, enabling: true }));

    try {
      if (pushStatus.subscribed) {
        // Disable push notifications
        const result = await pushManager.disable();
        if (result.success) {
          setPushStatus(prev => ({ ...prev, subscribed: false }));
          setPreferences(prev => ({
            ...prev,
            pushNotifications: { ...prev.pushNotifications, enabled: false }
          }));
          alert('✅ Push notifications disabled');
        } else {
          alert(`❌ Failed to disable: ${result.error}`);
        }
      } else {
        // Enable push notifications
        const result = await pushManager.enable();
        if (result.success) {
          setPushStatus(prev => ({ ...prev, subscribed: true, permission: 'granted' }));
          setPreferences(prev => ({
            ...prev,
            pushNotifications: { ...prev.pushNotifications, enabled: true }
          }));
          alert('✅ Push notifications enabled! You should receive a welcome notification.');
        } else {
          alert(`❌ Failed to enable: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Push notification toggle error:', error);
      alert('❌ Error managing push notifications');
    } finally {
      setPushStatus(prev => ({ ...prev, enabling: false }));
    }
  };

  const testPushNotification = async () => {
    const success = await pushManager.showTestNotification();
    if (!success) {
      alert('❌ Failed to show test notification. Please check your browser settings.');
    }
  };

  const updateEmailPreference = (key: keyof EmailPreferences, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value }
    }));
  };

  const updatePushPreference = (key: keyof PushNotificationPreferences['types'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      pushNotifications: {
        ...prev.pushNotifications,
        types: { ...prev.pushNotifications.types, [key]: value }
      }
    }));
  };

  const updatePushSettings = (setting: 'frequency' | 'quietHours', value: any) => {
    setPreferences(prev => ({
      ...prev,
      pushNotifications: {
        ...prev.pushNotifications,
        [setting]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <span>Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="h-6 w-6 mr-2" />
              Notification Preferences
            </h2>
            <p className="text-gray-600 mt-1">
              Manage your email and push notification preferences for AllThingsWetaskiwin
            </p>
          </div>
          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Email Preferences */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Email Notifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Types */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Email Types</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">Transactional</span>
                  <p className="text-xs text-gray-500">Account security, verification (required)</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.email.transactional}
                  disabled
                  className="rounded border-gray-300" 
                />
              </label>
              
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">Newsletter</span>
                  <p className="text-xs text-gray-500">Weekly community newsletter</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.email.newsletter}
                  onChange={(e) => updateEmailPreference('newsletter', e.target.checked)}
                  className="rounded border-gray-300" 
                />
              </label>
              
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">Event Notifications</span>
                  <p className="text-xs text-gray-500">Updates about local events</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.email.eventNotifications}
                  onChange={(e) => updateEmailPreference('eventNotifications', e.target.checked)}
                  className="rounded border-gray-300" 
                />
              </label>
              
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">Business Updates</span>
                  <p className="text-xs text-gray-500">Local business news and updates</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.email.businessUpdates}
                  onChange={(e) => updateEmailPreference('businessUpdates', e.target.checked)}
                  className="rounded border-gray-300" 
                />
              </label>
              
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">News Digest</span>
                  <p className="text-xs text-gray-500">Community news roundup</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.email.newsDigest}
                  onChange={(e) => updateEmailPreference('newsDigest', e.target.checked)}
                  className="rounded border-gray-300" 
                />
              </label>
              
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">Marketing</span>
                  <p className="text-xs text-gray-500">Promotional emails and offers</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.email.marketing}
                  onChange={(e) => updateEmailPreference('marketing', e.target.checked)}
                  className="rounded border-gray-300" 
                />
              </label>
            </div>
          </div>

          {/* Email Settings */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Email Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Frequency
                </label>
                <select
                  value={preferences.email.frequency}
                  onChange={(e) => updateEmailPreference('frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Digest Time
                </label>
                <select
                  value={preferences.email.digestTime}
                  onChange={(e) => updateEmailPreference('digestTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="morning">Morning (8 AM)</option>
                  <option value="afternoon">Afternoon (12 PM)</option>
                  <option value="evening">Evening (6 PM)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Push Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Push Notifications
          </h3>
          
          <div className="flex items-center space-x-2">
            {pushStatus.supported ? (
              <>
                <Badge className={`${pushStatus.subscribed ? 'bg-green-500' : 'bg-gray-400'} text-white`}>
                  {pushStatus.subscribed ? 'Enabled' : 'Disabled'}
                </Badge>
                <Button
                  size="sm"
                  onClick={togglePushNotifications}
                  disabled={pushStatus.enabling}
                  className={`${
                    pushStatus.subscribed 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white`}
                >
                  {pushStatus.enabling ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : pushStatus.subscribed ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </>
            ) : (
              <Badge className="bg-gray-400 text-white">Not Supported</Badge>
            )}
          </div>
        </div>

        {pushStatus.supported ? (
          <div className="space-y-6">
            {/* Push Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Browser Support:</span>
                  <span className="ml-2 text-green-600">✓ Supported</span>
                </div>
                <div>
                  <span className="text-gray-500">Permission:</span>
                  <span className={`ml-2 ${
                    pushStatus.permission === 'granted' ? 'text-green-600' : 
                    pushStatus.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {pushStatus.permission === 'granted' ? '✓ Granted' :
                     pushStatus.permission === 'denied' ? '✗ Denied' : '? Default'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Subscription:</span>
                  <span className={`ml-2 ${pushStatus.subscribed ? 'text-green-600' : 'text-gray-500'}`}>
                    {pushStatus.subscribed ? '✓ Active' : '○ Inactive'}
                  </span>
                </div>
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testPushNotification}
                    disabled={!pushStatus.subscribed}
                    className="text-xs"
                  >
                    <TestTube className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                </div>
              </div>
            </div>

            {/* Push Settings */}
            {pushStatus.subscribed && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Notification Types */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Notification Types</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Marketplace</span>
                        <input 
                          type="checkbox" 
                          checked={preferences.pushNotifications.types.marketplace}
                          onChange={(e) => updatePushPreference('marketplace', e.target.checked)}
                          className="rounded border-gray-300" 
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Events</span>
                        <input 
                          type="checkbox" 
                          checked={preferences.pushNotifications.types.events}
                          onChange={(e) => updatePushPreference('events', e.target.checked)}
                          className="rounded border-gray-300" 
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Business</span>
                        <input 
                          type="checkbox" 
                          checked={preferences.pushNotifications.types.business}
                          onChange={(e) => updatePushPreference('business', e.target.checked)}
                          className="rounded border-gray-300" 
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">News</span>
                        <input 
                          type="checkbox" 
                          checked={preferences.pushNotifications.types.news}
                          onChange={(e) => updatePushPreference('news', e.target.checked)}
                          className="rounded border-gray-300" 
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">General</span>
                        <input 
                          type="checkbox" 
                          checked={preferences.pushNotifications.types.general}
                          onChange={(e) => updatePushPreference('general', e.target.checked)}
                          className="rounded border-gray-300" 
                        />
                      </label>
                    </div>
                  </div>

                  {/* Push Settings */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Settings</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frequency
                        </label>
                        <select
                          value={preferences.pushNotifications.frequency}
                          onChange={(e) => updatePushSettings('frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="bundled">Bundled (every 30 min)</option>
                          <option value="daily">Daily summary</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="flex items-center mb-3">
                          <input 
                            type="checkbox" 
                            checked={preferences.pushNotifications.quietHours.enabled}
                            onChange={(e) => updatePushSettings('quietHours', {
                              ...preferences.pushNotifications.quietHours,
                              enabled: e.target.checked
                            })}
                            className="rounded border-gray-300 mr-2" 
                          />
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium text-gray-900">Quiet Hours</span>
                        </label>
                        
                        {preferences.pushNotifications.quietHours.enabled && (
                          <div className="grid grid-cols-2 gap-2 ml-6">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Start</label>
                              <input
                                type="time"
                                value={preferences.pushNotifications.quietHours.start}
                                onChange={(e) => updatePushSettings('quietHours', {
                                  ...preferences.pushNotifications.quietHours,
                                  start: e.target.value
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">End</label>
                              <input
                                type="time"
                                value={preferences.pushNotifications.quietHours.end}
                                onChange={(e) => updatePushSettings('quietHours', {
                                  ...preferences.pushNotifications.quietHours,
                                  end: e.target.value
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <X className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Push Notifications Not Available</h4>
            <p className="text-gray-600">
              Your browser or device doesn't support push notifications. 
              Try using a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        )}
      </Card>

      {/* Global Unsubscribe */}
      <Card className="p-6 border-red-200">
        <h3 className="text-lg font-semibold text-red-700 mb-3">Unsubscribe from All</h3>
        <p className="text-gray-600 mb-4">
          You can unsubscribe from all non-essential emails. This will not affect 
          account security emails or transactional notifications.
        </p>
        <Button
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50"
          onClick={() => {
            if (confirm('Are you sure you want to unsubscribe from all emails?')) {
              setPreferences(prev => ({ ...prev, unsubscribedFromAll: true }));
            }
          }}
        >
          <X className="h-4 w-4 mr-2" />
          Unsubscribe from All
        </Button>
      </Card>
    </div>
  );
}