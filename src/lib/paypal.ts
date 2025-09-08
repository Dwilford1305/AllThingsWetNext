/**
 * PayPal SDK Configuration and Utilities
 * Handles PayPal sandbox/production environment setup
 */

// PayPal environment configuration
export const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID || 'demo_client_id',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'demo_secret',
  mode: (process.env.PAYPAL_MODE || 'sandbox') as 'sandbox' | 'live',
  currency: 'CAD',
  locale: 'en_CA'
} as const;

// PayPal SDK options for client-side integration
export const PAYPAL_SDK_OPTIONS = {
  clientId: PAYPAL_CONFIG.clientId,
  currency: PAYPAL_CONFIG.currency,
  intent: 'subscription',
  vault: true,
  components: 'buttons,funding-eligibility',
  'enable-funding': 'venmo,paylater',
  'disable-funding': 'card,credit',
  'buyer-country': 'CA'
} as const;

// Subscription tier pricing (matches existing system)
export const SUBSCRIPTION_TIERS = {
  marketplace: {
    silver: { monthly: 9.99, annual: 99.99 },
    gold: { monthly: 19.99, annual: 199.99 },
    platinum: { monthly: 39.99, annual: 399.99 }
  },
  business: {
    silver: { monthly: 19.99, annual: 199.99 },
    gold: { monthly: 39.99, annual: 399.99 },
    platinum: { monthly: 79.99, annual: 799.99 }
  }
} as const;

export type SubscriptionType = keyof typeof SUBSCRIPTION_TIERS;
export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS.marketplace;
export type BillingCycle = 'monthly' | 'annual';

/**
 * Calculate pricing for a subscription tier
 */
export function calculateSubscriptionPrice(
  type: SubscriptionType,
  tier: SubscriptionTier,
  billingCycle: BillingCycle
): number {
  return SUBSCRIPTION_TIERS[type][tier][billingCycle];
}

/**
 * Calculate annual savings percentage
 */
export function calculateAnnualSavings(
  type: SubscriptionType,
  tier: SubscriptionTier
): { savings: number; percentage: number } {
  const monthlyPrice = SUBSCRIPTION_TIERS[type][tier].monthly;
  const annualPrice = SUBSCRIPTION_TIERS[type][tier].annual;
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - annualPrice;
  const percentage = Math.round((savings / monthlyTotal) * 100);
  
  return { savings, percentage };
}

/**
 * Validate PayPal environment configuration
 */
export function validatePayPalConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!PAYPAL_CONFIG.clientId || PAYPAL_CONFIG.clientId === 'demo_client_id') {
    errors.push('PAYPAL_CLIENT_ID environment variable is required');
  }
  
  if (!PAYPAL_CONFIG.clientSecret || PAYPAL_CONFIG.clientSecret === 'demo_secret') {
    errors.push('PAYPAL_CLIENT_SECRET environment variable is required');
  }
  
  if (!['sandbox', 'live'].includes(PAYPAL_CONFIG.mode)) {
    errors.push('PAYPAL_MODE must be either "sandbox" or "live"');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate subscription description for PayPal
 */
export function generateSubscriptionDescription(
  type: SubscriptionType,
  tier: SubscriptionTier,
  billingCycle: BillingCycle
): string {
  const typeLabel = type === 'marketplace' ? 'Marketplace' : 'Business';
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const cycleLabel = billingCycle === 'monthly' ? 'Monthly' : 'Annual';
  
  return `${typeLabel} ${tierLabel} Subscription - ${cycleLabel}`;
}

/**
 * Sandbox-specific utilities for development and testing
 */
export const SANDBOX_UTILITIES = {
  /**
   * Check if running in sandbox mode
   */
  isSandbox: () => PAYPAL_CONFIG.mode === 'sandbox',
  
  /**
   * Get sandbox webhook URL for testing
   */
  getWebhookUrl: () => {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${baseUrl}/api/payments/webhook`;
  },
  
  /**
   * Generate test payment data for sandbox
   */
  generateTestPayment: (amount: number) => ({
    paymentId: `SANDBOX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount,
    currency: PAYPAL_CONFIG.currency,
    status: 'COMPLETED',
    timestamp: new Date().toISOString()
  })
};