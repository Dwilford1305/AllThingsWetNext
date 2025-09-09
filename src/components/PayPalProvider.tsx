'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

interface PayPalProviderProps {
  children: ReactNode;
}

interface PayPalConfig {
  clientId: string | null;
  environment: 'sandbox' | 'production';
  currency: string;
  configured: boolean;
}

export const PayPalProvider: React.FC<PayPalProviderProps> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  const [paypalConfig, setPaypalConfig] = useState<PayPalConfig | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Fetch PayPal configuration from API
    const fetchPayPalConfig = async () => {
      try {
        const response = await fetch('/api/paypal/config');
        const data = await response.json();
        
        if (data.success && data.config) {
          setPaypalConfig(data.config);
        } else {
          // Fallback configuration
          setPaypalConfig({
            clientId: null,
            environment: 'sandbox',
            currency: 'CAD',
            configured: false
          });
        }
      } catch (error) {
        console.warn('Failed to fetch PayPal configuration:', error);
        // Fallback configuration
        setPaypalConfig({
          clientId: null,
          environment: 'sandbox',
          currency: 'CAD',
          configured: false
        });
      }
    };

    fetchPayPalConfig();
  }, []);

  // During SSR or while loading config, just render children
  if (!isClient || !paypalConfig) {
    return <>{children}</>;
  }

  // Create PayPal options based on fetched configuration
  const paypalOptions = {
    clientId: paypalConfig.clientId || 'build-time-placeholder',
    currency: paypalConfig.currency,
    intent: 'capture' as const,
    environment: paypalConfig.environment,
    components: 'buttons,messages',
    disableFunding: ['credit', 'paylater'],
    debug: process.env.NODE_ENV === 'development'
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      {children}
    </PayPalScriptProvider>
  );
};

export default PayPalProvider;