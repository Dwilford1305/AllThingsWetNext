/**
 * PayPal Configuration Service
 * Handles PayPal SDK initialization and configuration for both sandbox and production environments
 */

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  webhookId?: string;
  currency: string;
  baseUrl: string;
}

export interface PayPalSubscriptionTier {
  id: string;
  name: string;
  monthly: number;
  annual: number;
}

// PayPal configuration
export const getPayPalConfig = (): PayPalConfig => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const environment = (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  // During build time, environment variables may not be available
  // Only throw errors at runtime when actually using PayPal functionality
  if (typeof window !== 'undefined' && !clientId) {
    throw new Error('PAYPAL_CLIENT_ID environment variable is required');
  }

  if (typeof window !== 'undefined' && !clientSecret) {
    throw new Error('PAYPAL_CLIENT_SECRET environment variable is required');
  }

  return {
    clientId: clientId || 'build-time-placeholder',
    clientSecret: clientSecret || 'build-time-placeholder',
    environment,
    webhookId,
    currency: 'CAD',
    baseUrl: environment === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com' 
      : 'https://api-m.paypal.com'
  };
};

// Client-side PayPal options for React PayPal component
export const getPayPalOptions = () => {
  // For client-side usage, we need to use NEXT_PUBLIC_ variables or provide fallbacks
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
  const environment = (process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT || process.env.PAYPAL_ENVIRONMENT) as 'sandbox' | 'production' || 'sandbox';
  
  // During build time or when PayPal is not configured, provide safe defaults
  if (!clientId && typeof window === 'undefined') {
    return {
      clientId: 'build-time-placeholder',
      currency: 'CAD',
      intent: 'capture' as const,
      environment: 'sandbox' as const,
      components: 'buttons,messages',
      disableFunding: ['credit', 'paylater'],
      debug: false
    };
  }

  if (!clientId && typeof window !== 'undefined') {
    throw new Error('NEXT_PUBLIC_PAYPAL_CLIENT_ID environment variable is required for client-side PayPal integration');
  }

  return {
    clientId: clientId!,
    currency: 'CAD',
    intent: 'capture' as const,
    environment,
    // Enable additional PayPal features
    components: 'buttons,messages',
    // Disable funding options we don't want to show
    disableFunding: ['credit', 'paylater'],
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development'
  };
};

// Subscription tier configurations
export const MARKETPLACE_SUBSCRIPTION_TIERS: PayPalSubscriptionTier[] = [
  {
    id: 'silver',
    name: 'Silver',
    monthly: 9.99,
    annual: 99.99
  },
  {
    id: 'gold', 
    name: 'Gold',
    monthly: 19.99,
    annual: 199.99
  },
  {
    id: 'platinum',
    name: 'Platinum', 
    monthly: 39.99,
    annual: 399.99
  }
];

export const BUSINESS_SUBSCRIPTION_TIERS: PayPalSubscriptionTier[] = [
  {
    id: 'silver',
    name: 'Silver',
    monthly: 19.99,
    annual: 199.99
  },
  {
    id: 'gold',
    name: 'Gold', 
    monthly: 39.99,
    annual: 399.99
  },
  {
    id: 'platinum',
    name: 'Platinum',
    monthly: 79.99,
    annual: 799.99
  }
];

// PayPal error handling
export interface PayPalError {
  name: string;
  message: string;
  details?: Array<{
    field?: string;
    value?: string;
    location?: string;
    issue: string;
    description: string;
  }>;
  debug_id?: string;
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export const handlePayPalError = (error: any): string => {
  console.error('PayPal Error:', error);

  // Handle PayPal API errors
  if (error.details && Array.isArray(error.details)) {
    return error.details.map((detail: any) => detail.description).join('. ');
  }

  // Handle standard PayPal errors
  if (error.message) {
    return error.message;
  }

  // Handle network errors
  if (error.name === 'NetworkError') {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  // Handle timeout errors
  if (error.name === 'TimeoutError') {
    return 'Payment processing timed out. Please try again.';
  }

  // Default error message
  return 'Payment processing failed. Please try again or contact support.';
};

// Validate PayPal configuration on startup
export const validatePayPalConfig = (): boolean => {
  try {
    const config = getPayPalConfig();
    console.log(`✅ PayPal configured for ${config.environment} environment`);
    return true;
  } catch (error) {
    console.warn('⚠️ PayPal configuration incomplete:', error);
    return false;
  }
};

// Get pricing for a specific tier and billing cycle
export const getTierPricing = (
  tierList: PayPalSubscriptionTier[],
  tierId: string,
  billingCycle: 'monthly' | 'annual'
): number => {
  const tier = tierList.find(t => t.id === tierId);
  if (!tier) {
    throw new Error(`Subscription tier '${tierId}' not found`);
  }
  
  return billingCycle === 'monthly' ? tier.monthly : tier.annual;
};

// Calculate savings for annual billing
export const calculateAnnualSavings = (tier: PayPalSubscriptionTier) => {
  const monthlyTotal = tier.monthly * 12;
  const annualPrice = tier.annual;
  const savings = monthlyTotal - annualPrice;
  const savingsPercent = Math.round((savings / monthlyTotal) * 100);
  
  return {
    savings: Math.max(0, savings),
    savingsPercent: Math.max(0, savingsPercent),
    monthlyTotal,
    annualPrice
  };
};