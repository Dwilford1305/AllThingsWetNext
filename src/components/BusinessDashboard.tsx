'use client';

import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  Building, 
  Star, 
  Award, 
  Shield, 
  Eye, 
  MousePointer, 
  Phone as PhoneIcon, 
  Globe,
  TrendingUp,
  CreditCard,
  Edit
} from 'lucide-react';
import type { Business } from '@/types';

interface BusinessDashboardProps {
  business: Business;
  onUpdate?: (updatedBusiness: Business) => void;
}

export const BusinessDashboard = ({ business, onUpdate }: BusinessDashboardProps) => {
  const [loading, setLoading] = useState(false);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'silver': return <Shield className="h-4 w-4" />;
      case 'gold': return <Star className="h-4 w-4" />;
      case 'platinum': return <Award className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'silver': return 'bg-gray-400 text-white';
      case 'gold': return 'bg-yellow-500 text-black';
      case 'platinum': return 'bg-purple-600 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const handleUpgrade = async (newTier: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/businesses/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: business.id,
          subscriptionTier: newTier,
          duration: 12
        })
      });

      const result = await response.json();
      if (result.success && onUpdate) {
        onUpdate(result.data.business);
        alert(`Successfully upgraded to ${newTier} tier!`);
      } else {
        alert(result.error || 'Failed to upgrade subscription');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to upgrade subscription');
    } finally {
      setLoading(false);
    }
  };

  const currentTier = business.subscriptionTier || 'free';
  const analytics = business.analytics || { views: 0, clicks: 0, callClicks: 0, websiteClicks: 0 };

  return (
    <div className="space-y-6">
      {/* Business Info Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{business.name}</h2>
            <p className="text-gray-600">{business.address}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getTierColor(currentTier)}>
              {getTierIcon(currentTier)}
              <span className="ml-1">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span>
            </Badge>
            {business.featured && (
              <Badge className="bg-yellow-500 text-black">Featured</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <Building className="h-4 w-4 mr-2" />
            <span>{business.category}</span>
          </div>
          {business.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <PhoneIcon className="h-4 w-4 mr-2" />
              <span>{business.phone}</span>
            </div>
          )}
          {business.website && (
            <div className="flex items-center text-sm text-gray-600">
              <Globe className="h-4 w-4 mr-2" />
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                Website
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Analytics (Premium Feature) */}
      {currentTier !== 'free' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Analytics
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.views}</div>
              <div className="text-sm text-gray-600">Views</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MousePointer className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.clicks}</div>
              <div className="text-sm text-gray-600">Total Clicks</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <PhoneIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.callClicks}</div>
              <div className="text-sm text-gray-600">Phone Clicks</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Globe className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.websiteClicks}</div>
              <div className="text-sm text-gray-600">Website Clicks</div>
            </div>
          </div>
        </Card>
      )}

      {/* Subscription Management */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Subscription Management
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Current Plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</h4>
            {business.subscriptionEnd && (
              <p className="text-sm text-gray-600">
                Valid until: {new Date(business.subscriptionEnd).toLocaleDateString()}
              </p>
            )}
          </div>

          {currentTier === 'free' && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Silver
                </h4>
                <p className="text-2xl font-bold text-gray-900 mb-2">$19.99<span className="text-sm font-normal">/month</span></p>
                <ul className="text-sm text-gray-600 mb-4 space-y-1">
                  <li>• Enhanced listing</li>
                  <li>• Contact form</li>
                  <li>• Basic analytics</li>
                  <li>• Business hours</li>
                </ul>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleUpgrade('silver')}
                  disabled={loading}
                >
                  Upgrade to Silver
                </Button>
              </div>

              <div className="p-4 border-2 border-yellow-500 rounded-lg relative">
                <Badge className="absolute -top-2 left-4 bg-yellow-500 text-black">Popular</Badge>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Gold
                </h4>
                <p className="text-2xl font-bold text-gray-900 mb-2">$39.99<span className="text-sm font-normal">/month</span></p>
                <ul className="text-sm text-gray-600 mb-4 space-y-1">
                  <li>• Everything in Silver</li>
                  <li>• Photo gallery</li>
                  <li>• Social media links</li>
                  <li>• Featured placement</li>
                </ul>
                <Button 
                  size="sm" 
                  variant="primary" 
                  className="w-full"
                  onClick={() => handleUpgrade('gold')}
                  disabled={loading}
                >
                  Upgrade to Gold
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Platinum
                </h4>
                <p className="text-2xl font-bold text-gray-900 mb-2">$79.99<span className="text-sm font-normal">/month</span></p>
                <ul className="text-sm text-gray-600 mb-4 space-y-1">
                  <li>• Everything in Gold</li>
                  <li>• Logo upload</li>
                  <li>• Advanced analytics</li>
                  <li>• Priority support</li>
                </ul>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleUpgrade('platinum')}
                  disabled={loading}
                >
                  Upgrade to Platinum
                </Button>
              </div>
            </div>
          )}

          {currentTier !== 'free' && currentTier !== 'platinum' && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Want more features? Upgrade your plan!</p>
              <div className="space-x-2">
                {currentTier === 'silver' && (
                  <>
                    <Button 
                      variant="primary" 
                      onClick={() => handleUpgrade('gold')}
                      disabled={loading}
                    >
                      Upgrade to Gold
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleUpgrade('platinum')}
                      disabled={loading}
                    >
                      Upgrade to Platinum
                    </Button>
                  </>
                )}
                {currentTier === 'gold' && (
                  <Button 
                    variant="primary" 
                    onClick={() => handleUpgrade('platinum')}
                    disabled={loading}
                  >
                    Upgrade to Platinum
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Business Management */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Edit className="h-5 w-5 mr-2" />
          Manage Listing
        </h3>
        <div className="space-y-4">
          <p className="text-gray-600">
            Update your business information, add photos, and manage your listing details.
          </p>
          <div className="space-x-2">
            <Button variant="primary" size="sm">
              Edit Business Info
            </Button>
            {(currentTier === 'gold' || currentTier === 'platinum') && (
              <Button variant="outline" size="sm">
                Manage Photos
              </Button>
            )}
            {currentTier === 'platinum' && (
              <Button variant="outline" size="sm">
                Upload Logo
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
