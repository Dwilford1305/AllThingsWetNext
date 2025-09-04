'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import SubscriptionUpgradeModal from '@/components/SubscriptionUpgradeModal';
import { 
  Crown, 
  Star, 
  Zap, 
  Check, 
  X, 
  TrendingUp, 
  Camera, 
  Clock,
  HeadphonesIcon,
  BarChart3
} from 'lucide-react';

interface SubscriptionTier {
  id: 'free' | 'silver' | 'gold' | 'platinum';
  name: string;
  price: { monthly: number; annual: number };
  adQuota: number;
  features: string[];
  icon: React.ElementType;
  color: string;
  popular?: boolean;
}

interface UserSubscription {
  tier: string;
  status: string;
  quota: {
    monthly: number;
    used: number;
    remaining: number;
    resetDate: string;
  };
  features: {
    featuredAds: boolean;
    analytics: boolean;
    prioritySupport: boolean;
    photoLimit: number;
    adDuration: number;
  };
}

// API response structure from /api/marketplace/subscription
interface ApiSubscriptionResponse {
  tier: string;
  status: string;
  subscriptionStart?: Date | string;
  subscriptionEnd?: Date | string;
  adQuota: {
    monthly: number;
    used: number;
    resetDate: Date | string;
  };
  features: {
    featuredAds: boolean;
    analytics: boolean;
    prioritySupport: boolean;
    photoLimit: number;
    adDuration: number;
  };
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    adQuota: 1,
    features: ['1 ad per month', '1 photo per ad', '30-day ad duration', 'Basic support'],
    icon: Star,
    color: 'bg-gray-500'
  },
  {
    id: 'silver',
    name: 'Silver',
    price: { monthly: 9.99, annual: 99.99 },
    adQuota: 5,
    features: ['5 ads per month', '5 photos per ad', '45-day ad duration', 'Basic analytics', 'Email support'],
    icon: TrendingUp,
    color: 'bg-gray-400'
  },
  {
    id: 'gold',
    name: 'Gold',
    price: { monthly: 19.99, annual: 199.99 },
    adQuota: 15,
    features: ['15 ads per month', '10 photos per ad', '60-day ad duration', 'Featured ads', 'Analytics dashboard', 'Priority support'],
    icon: Crown,
    color: 'bg-yellow-500',
    popular: true
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: { monthly: 39.99, annual: 399.99 },
    adQuota: -1, // Unlimited
    features: ['Unlimited ads', '20 photos per ad', '90-day ad duration', 'Featured ads', 'Advanced analytics', 'Priority support', 'Phone support'],
    icon: Zap,
    color: 'bg-purple-500'
  }
];

const MarketplaceSubscription = () => {
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Transform API response to component format
  const transformApiResponse = (apiData: ApiSubscriptionResponse): UserSubscription => {
    const remaining = apiData.adQuota.monthly === -1 || apiData.adQuota.monthly === 9999 
      ? -1 // Unlimited
      : Math.max(0, apiData.adQuota.monthly - apiData.adQuota.used);

    return {
      tier: apiData.tier,
      status: apiData.status,
      quota: {
        monthly: apiData.adQuota.monthly,
        used: apiData.adQuota.used,
        remaining,
        resetDate: typeof apiData.adQuota.resetDate === 'string' 
          ? apiData.adQuota.resetDate 
          : apiData.adQuota.resetDate.toString()
      },
      features: apiData.features
    };
  };

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/marketplace/subscription');
      const data = await response.json();
      
      // Handle successful response
      if (data.success && data.currentSubscription) {
        // Transform API response to component format
        const transformedSubscription = transformApiResponse(data.currentSubscription);
        setCurrentSubscription(transformedSubscription);
      } else if (response.status === 401) {
        // User not authenticated - show default free tier
        setCurrentSubscription(null);
      } else {
        console.error('Failed to fetch subscription info:', data.error || 'Unknown error');
        // Still show auth notice even on error
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      // On error, don't show current subscription
      setCurrentSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tierId: string, paymentId?: string) => {
    setUpgrading(tierId);
    try {
      const duration = billingPeriod === 'annual' ? 12 : 1;
      const response = await fetch('/api/marketplace/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionTier: tierId,
          duration,
          paymentId // Include payment ID from PayPal
        })
      });
      
      const data = await response.json();
      
      if (response.status === 401) {
        alert('Please log in to upgrade your subscription.');
        return;
      }
      
      if (data.success) {
        console.log('Subscription upgrade completed:', data.message);
        await fetchSubscriptionInfo(); // Refresh data
        // Show success notification
        alert('🎉 Subscription upgraded successfully! Your new features are now active.');
      } else {
        alert('Error upgrading subscription: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade subscription. Please try again later.');
    } finally {
      setUpgrading(null);
    }
  };

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  const handleUpgradeSuccess = async (tier: string, paymentId: string) => {
    await handleUpgrade(tier, paymentId);
    setShowUpgradeModal(false);
  };

  const formatQuotaText = (quota: number) => {
    if (quota === -1 || quota === 9999) return 'Unlimited';
    return quota.toString();
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('photo')) return Camera;
    if (feature.includes('analytics')) return BarChart3;
    if (feature.includes('support')) return HeadphonesIcon;
    if (feature.includes('duration') || feature.includes('day')) return Clock;
    return Check;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading subscription information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Authentication Notice */}
      {!currentSubscription && !loading && (
        <Card className="mb-8 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Sign in to manage your subscription
              </h3>
              <p className="text-sm text-blue-700">
                Log in to view your current subscription status and upgrade your marketplace features.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Current Subscription</h3>
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`${SUBSCRIPTION_TIERS.find(t => t.id === currentSubscription.tier)?.color || 'bg-gray-500'} text-white`}>
                  {currentSubscription.tier.charAt(0).toUpperCase() + currentSubscription.tier.slice(1)}
                </Badge>
                <Badge variant="outline" className={currentSubscription.status === 'active' ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}>
                  {currentSubscription.status}
                </Badge>
              </div>
              <p className="text-gray-600">
                {currentSubscription.quota.remaining === -1 
                  ? 'Unlimited ads remaining this month' 
                  : `${currentSubscription.quota.remaining} ads remaining this month`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {formatQuotaText(currentSubscription.quota.used)} / {formatQuotaText(currentSubscription.quota.monthly)}
              </p>
              <p className="text-sm text-gray-500">ads used</p>
              <p className="text-xs text-gray-400 mt-1">
                Resets: {new Date(currentSubscription.quota.resetDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Billing Period Toggle */}
      <div className="text-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === 'monthly' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === 'annual' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Annual
            <Badge className="ml-2 bg-green-100 text-green-800">Save 17%</Badge>
          </button>
        </div>
      </div>

      {/* Subscription Tiers */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SUBSCRIPTION_TIERS.map((tier) => {
          const IconComponent = tier.icon;
          const isCurrentTier = currentSubscription?.tier === tier.id;
          const price = billingPeriod === 'annual' ? tier.price.annual : tier.price.monthly;
          const priceDisplay = tier.id === 'free' 
            ? 'Free' 
            : billingPeriod === 'annual' 
              ? `$${price}/year` 
              : `$${price}/month`;

          return (
            <Card 
              key={tier.id} 
              className={`relative p-6 ${
                tier.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''
              } ${isCurrentTier ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${tier.color} rounded-full mb-4`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">{priceDisplay}</span>
                  {tier.id !== 'free' && billingPeriod === 'annual' && (
                    <span className="text-sm text-gray-500 block">
                      ${(price / 12).toFixed(2)}/month
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="text-center">
                  <span className="text-lg font-semibold text-blue-600">
                    {formatQuotaText(tier.adQuota)} ads/month
                  </span>
                </div>
                {tier.features.map((feature, index) => {
                  const FeatureIcon = getFeatureIcon(feature);
                  return (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <FeatureIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={() => tier.id === 'free' ? undefined : handleUpgradeClick()}
                disabled={isCurrentTier || upgrading === tier.id || tier.id === 'free'}
                className={`w-full ${
                  isCurrentTier 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : tier.popular 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {upgrading === tier.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : isCurrentTier ? (
                  'Current Plan'
                ) : tier.id === 'free' ? (
                  'Default Plan'
                ) : (
                  'Upgrade with PayPal'
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="mt-12 bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Feature Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Feature</th>
                {SUBSCRIPTION_TIERS.map(tier => (
                  <th key={tier.id} className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Monthly Ads</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">1</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">5</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">15</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">Unlimited</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">Photos per Ad</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">1</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">5</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">10</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">20</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Featured Ads</td>
                <td className="px-6 py-4 text-center"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">Analytics</td>
                <td className="px-6 py-4 text-center"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Priority Support</td>
                <td className="px-6 py-4 text-center"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Upgrade Modal */}
      <SubscriptionUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        tiers={SUBSCRIPTION_TIERS.map(tier => ({
          id: tier.id,
          name: tier.name,
          price: tier.price,
          description: tier.id === 'silver' 
            ? 'Perfect for casual sellers with occasional listings'
            : tier.id === 'gold'
            ? 'Ideal for active sellers with regular inventory'
            : 'Best for power sellers with high-volume sales',
          features: tier.features,
          popular: tier.popular,
          color: tier.color.includes('yellow') ? 'text-yellow-600' : 
                 tier.color.includes('purple') ? 'text-purple-600' : 'text-gray-600'
        }))}
        currentTier={currentSubscription?.tier}
        onUpgradeSuccess={handleUpgradeSuccess}
        type="marketplace"
      />
    </div>
  );
};

export default MarketplaceSubscription;