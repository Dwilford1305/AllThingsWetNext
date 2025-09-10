'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import SubscriptionUpgradeModal from '@/components/SubscriptionUpgradeModal';
import { Star, Shield, Award } from 'lucide-react';

const demoTiers = [
  {
    id: 'silver',
    name: 'Silver',
    price: { monthly: 19.99, annual: 199.99 },
    description: 'Perfect for small businesses',
    features: ['Enhanced listing', 'Basic analytics', 'Email support'],
    color: 'text-gray-600'
  },
  {
    id: 'gold',
    name: 'Gold',
    price: { monthly: 39.99, annual: 399.99 },
    description: 'Ideal for growing businesses',
    features: ['Everything in Silver', 'Photo gallery', 'Featured placement'],
    popular: true,
    color: 'text-yellow-600'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: { monthly: 79.99, annual: 799.99 },
    description: 'Complete business solution',
    features: ['Everything in Gold', 'Custom logo', 'Priority support'],
    color: 'text-purple-600'
  }
];

export default function UpgradeFlowDemo() {
  const [showOldFlow, setShowOldFlow] = useState(false);
  const [showNewFlowSilver, setShowNewFlowSilver] = useState(false);
  const [showNewFlowGold, setShowNewFlowGold] = useState(false);
  const [showNewFlowPlatinum, setShowNewFlowPlatinum] = useState(false);

  const handleUpgradeSuccess = (tier: string, paymentId: string) => {
    alert(`🎉 Successfully upgraded to ${tier} tier! Payment ID: ${paymentId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PayPal Upgrade Flow Demonstration
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            See the before and after of our streamlined tier upgrade experience
          </p>
          <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
            Issue #104 - Fixed!
          </Badge>
        </div>

        {/* Before Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-red-600 mb-4">❌ Before (Old Flow)</h2>
            <p className="text-gray-600 mb-6">
              User clicks &quot;Upgrade&quot; → Modal opens → User selects tier AGAIN → PayPal payment
            </p>
            <Button 
              onClick={() => setShowOldFlow(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Open Old Flow (No Preselection)
            </Button>
          </div>
        </div>

        {/* After Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-green-600 mb-4">✅ After (New Flow)</h2>
            <p className="text-gray-600 mb-6">
              User clicks &quot;Upgrade to [Tier]&quot; → Modal opens directly to PayPal payment for that tier
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Silver Tier Demo */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                  <Shield className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-600">Silver</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">$19.99</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Enhanced listing
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Basic analytics
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Email support
                </li>
              </ul>
              <Button 
                onClick={() => setShowNewFlowSilver(true)}
                className="w-full bg-gray-600 hover:bg-gray-700"
              >
                Upgrade to Silver
              </Button>
            </Card>

            {/* Gold Tier Demo */}
            <Card className="p-6 ring-2 ring-yellow-500 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black">
                Most Popular
              </Badge>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-yellow-600">Gold</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">$39.99</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Everything in Silver
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Photo gallery
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Featured placement
                </li>
              </ul>
              <Button 
                onClick={() => setShowNewFlowGold(true)}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Upgrade to Gold
              </Button>
            </Card>

            {/* Platinum Tier Demo */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-purple-600">Platinum</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">$79.99</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Everything in Gold
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Custom logo
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Priority support
                </li>
              </ul>
              <Button 
                onClick={() => setShowNewFlowPlatinum(true)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Upgrade to Platinum
              </Button>
            </Card>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Improvement Summary
          </h3>
          <Card className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-red-600 mb-4">❌ Before</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>User selects tier twice</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>Confusing redundant experience</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>More clicks required</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>Potential for user errors</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-green-600 mb-4">✅ After</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>One-click tier selection</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Streamlined, intuitive flow</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Fewer clicks needed</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Clear, direct path to payment</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Modals */}
        <SubscriptionUpgradeModal
          isOpen={showOldFlow}
          onClose={() => setShowOldFlow(false)}
          tiers={demoTiers}
          currentTier="free"
          onUpgradeSuccess={handleUpgradeSuccess}
          type="business"
          // No preSelectedTier - shows old behavior
        />

        <SubscriptionUpgradeModal
          isOpen={showNewFlowSilver}
          onClose={() => setShowNewFlowSilver(false)}
          tiers={demoTiers}
          currentTier="free"
          onUpgradeSuccess={handleUpgradeSuccess}
          type="business"
          preSelectedTier="silver"
        />

        <SubscriptionUpgradeModal
          isOpen={showNewFlowGold}
          onClose={() => setShowNewFlowGold(false)}
          tiers={demoTiers}
          currentTier="free"
          onUpgradeSuccess={handleUpgradeSuccess}
          type="business"
          preSelectedTier="gold"
        />

        <SubscriptionUpgradeModal
          isOpen={showNewFlowPlatinum}
          onClose={() => setShowNewFlowPlatinum(false)}
          tiers={demoTiers}
          currentTier="free"
          onUpgradeSuccess={handleUpgradeSuccess}
          type="business"
          preSelectedTier="platinum"
        />
      </div>
    </div>
  );
}