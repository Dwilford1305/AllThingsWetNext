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

  // Always get PayPal options - they now provide safe defaults if configuration fails
  const paypalOptions = getPayPalOptions();

  return (
    <PayPalScriptProvider options={paypalOptions}>
      {children}
    </PayPalScriptProvider>
  );
};

export default PayPalProvider;