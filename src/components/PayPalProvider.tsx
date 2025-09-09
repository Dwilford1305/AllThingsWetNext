'use client';

import React, { ReactNode } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { getPayPalOptions } from '@/lib/paypal-config';

interface PayPalProviderProps {
  children: ReactNode;
}

export const PayPalProvider: React.FC<PayPalProviderProps> = ({ children }) => {
  // Get PayPal options from configuration
  const paypalOptions = getPayPalOptions();

  return (
    <PayPalScriptProvider options={paypalOptions}>
      {children}
    </PayPalScriptProvider>
  );
};

export default PayPalProvider;