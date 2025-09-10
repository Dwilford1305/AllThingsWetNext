'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import PayPalButton from '@/components/PayPalButton';
import { Check, Star, X, CreditCard } from 'lucide-react';

interface SubscriptionTier {
  id: string;
  name: string;
  price: { monthly: number; annual: number };
  description: string;
  features: string[];
  popular?: boolean;
  color: string;
}

interface SubscriptionUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiers: SubscriptionTier[];
  currentTier?: string;
  onUpgradeSuccess: (tier: string, paymentId: string) => void;
  type: 'marketplace' | 'business';
  preSelectedTier?: string; // Pre-select a specific tier to skip tier selection
}

export const SubscriptionUpgradeModal: React.FC<SubscriptionUpgradeModalProps> = ({
  isOpen,
  onClose,
  tiers,
  currentTier = 'free',
  onUpgradeSuccess,
  type,
  preSelectedTier
}) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showPayment, setShowPayment] = useState(false);

  // When modal opens and preSelectedTier is provided, auto-select tier and go to payment
  useEffect(() => {
    if (isOpen && preSelectedTier) {
      const preSelected = tiers.find(tier => tier.id === preSelectedTier);
      if (preSelected) {
        setSelectedTier(preSelected);
        setShowPayment(true);
      }
    } else if (isOpen && !preSelectedTier) {
      // Reset state when modal opens without preselection
      setSelectedTier(null);
      setShowPayment(false);
    }
  }, [isOpen, preSelectedTier, tiers]);

  const handleTierSelect = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    if (selectedTier) {
      onUpgradeSuccess(selectedTier.id, paymentId);
      onClose();
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Error is handled within PayPalButton component
  };

  const calculateSavings = (tier: SubscriptionTier) => {
    const monthlyTotal = tier.price.monthly * 12;
    const annualPrice = tier.price.annual;
    const savings = monthlyTotal - annualPrice;
    const savingsPercent = Math.round((savings / monthlyTotal) * 100);
    return { savings, savingsPercent };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Upgrade Your {type === 'marketplace' ? 'Marketplace' : 'Business'} Subscription
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Choose the perfect plan to unlock premium features and grow your presence
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="mt-6 flex items-center justify-center">
                <div className="bg-gray-100 rounded-lg p-1 flex">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      billingCycle === 'annual'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Annual
                    <Badge className="ml-2 bg-green-100 text-green-700 text-xs">
                      Save up to 20%
                    </Badge>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {!showPayment ? (
                /* Tier Selection */
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tiers.filter(tier => tier.id !== 'free').map((tier) => {
                    const isCurrentTier = tier.id === currentTier;
                    const price = billingCycle === 'monthly' ? tier.price.monthly : tier.price.annual;
                    const { savings, savingsPercent } = calculateSavings(tier);

                    return (
                      <Card
                        key={tier.id}
                        className={`relative p-6 cursor-pointer transition-all duration-200 ${
                          tier.popular 
                            ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                            : 'hover:shadow-lg hover:scale-102'
                        } ${
                          isCurrentTier 
                            ? 'bg-gray-50 cursor-not-allowed' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => !isCurrentTier && handleTierSelect(tier)}
                      >
                        {tier.popular && (
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <Badge className="bg-blue-600 text-white px-3 py-1 flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Most Popular
                            </Badge>
                          </div>
                        )}

                        <div className="text-center mb-6">
                          <h3 className={`text-xl font-bold mb-2 ${tier.color}`}>
                            {tier.name}
                          </h3>
                          <div className="mb-2">
                            <span className="text-3xl font-bold text-gray-900">
                              ${price.toFixed(2)}
                            </span>
                            <span className="text-gray-600">
                              /{billingCycle === 'monthly' ? 'month' : 'year'}
                            </span>
                          </div>
                          {billingCycle === 'annual' && savings > 0 && (
                            <Badge className="bg-green-100 text-green-700">
                              Save ${savings.toFixed(2)} ({savingsPercent}%)
                            </Badge>
                          )}
                          <p className="text-gray-600 text-sm mt-2">
                            {tier.description}
                          </p>
                        </div>

                        <ul className="space-y-3 mb-6">
                          {tier.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          className={`w-full ${
                            isCurrentTier
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : tier.popular
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-gray-900 hover:bg-gray-800'
                          }`}
                          disabled={isCurrentTier}
                        >
                          {isCurrentTier ? 'Current Plan' : `Upgrade to ${tier.name}`}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* Payment Processing */
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${selectedTier?.color.replace('text-', 'bg-').replace('-600', '-100')} mb-4`}>
                      <CreditCard className={`h-8 w-8 ${selectedTier?.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Complete Your Upgrade
                    </h3>
                    <p className="text-gray-600">
                      Upgrading to <strong>{selectedTier?.name}</strong> plan
                    </p>
                  </div>

                  {selectedTier && (
                    <Card className="p-6 mb-6 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium">Subscription Plan:</span>
                        <span className="font-bold">{selectedTier.name}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium">Billing Cycle:</span>
                        <span className="capitalize">{billingCycle}</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span>
                            ${(billingCycle === 'monthly' 
                              ? selectedTier.price.monthly 
                              : selectedTier.price.annual
                            ).toFixed(2)} CAD
                          </span>
                        </div>
                      </div>
                    </Card>
                  )}

                  <PayPalButton
                    amount={selectedTier ? (billingCycle === 'monthly' 
                      ? selectedTier.price.monthly 
                      : selectedTier.price.annual
                    ) : 0}
                    description={`${type === 'marketplace' ? 'Marketplace' : 'Business'} Subscription - ${selectedTier?.name} Plan`}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onCancel={() => setShowPayment(false)}
                  />

                  <div className="mt-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => preSelectedTier ? onClose() : setShowPayment(false)}
                      className="text-gray-600"
                    >
                      {preSelectedTier ? '← Cancel' : '← Back to Plans'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionUpgradeModal;