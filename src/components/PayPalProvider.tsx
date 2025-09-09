'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { getPayPalOptions } from '@/lib/paypal-config';

interface PayPalProviderProps {
  children: ReactNode;
}

export const PayPalProvider: React.FC<PayPalProviderProps> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR, just render children
  if (!isClient) {
    return <>{children}</>;
  }

  try {
    // Get PayPal options from configuration
    const paypalOptions = getPayPalOptions();

    return (
      <PayPalScriptProvider options={paypalOptions}>
        {children}
      </PayPalScriptProvider>
    );
  } catch (error) {
    // If PayPal configuration fails, render children without PayPal
    console.warn('PayPal configuration not available:', error);
    return <>{children}</>;
  }
};

export default PayPalProvider;