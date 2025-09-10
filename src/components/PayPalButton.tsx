'use client';

import { useState, useCallback, useEffect } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { handlePayPalError } from '@/lib/paypal-config';

interface PayPalButtonProps {
  amount: number;
  currency?: string;
  description: string;
  onSuccess: (paymentId: string, details?: unknown) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
}

type PaymentStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error' | 'cancelled' | 'config-error';

export const PayPalButton: React.FC<PayPalButtonProps> = ({
  amount,
  currency = 'CAD',
  description,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  className = ''
}) => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paypalConfigValid, setPaypalConfigValid] = useState<boolean | null>(null);
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  // Check PayPal configuration on component mount
  useEffect(() => {
    const checkPayPalConfig = async () => {
      try {
        const response = await fetch('/api/paypal/config');
        const data = await response.json();
        
        if (data.success && data.config && data.config.configured && data.config.clientId) {
          setPaypalConfigValid(true);
        } else {
          setPaypalConfigValid(false);
          setStatus('config-error');
          setErrorMessage('PayPal integration is not configured. Please contact support for assistance.');
        }
      } catch (error) {
        setPaypalConfigValid(false);
        setStatus('config-error');
        setErrorMessage(`PayPal configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    checkPayPalConfig();
  }, []);

  // Handle PayPal payment creation
  const createOrder = useCallback(async () => {
    if (!paypalConfigValid) {
      const message = 'PayPal is not properly configured';
      setStatus('config-error');
      setErrorMessage(message);
      onError(message);
      return;
    }

    setStatus('processing');
    
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount.toFixed(2),
          currency,
          description
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      return data.orderId;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      const message = handlePayPalError(error);
      setStatus('error');
      setErrorMessage(message);
      onError(message);
      throw error;
    }
  }, [amount, currency, description, onError, paypalConfigValid]);

  // Handle PayPal payment approval/capture
  const onApprove = useCallback(async (data: { orderID: string }) => {
    setStatus('processing');
    
    try {
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderID
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Payment capture failed');
      }

      setStatus('success');
      onSuccess(result.paymentId, result.details);
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      const message = handlePayPalError(error);
      setStatus('error');
      setErrorMessage(message);
      onError(message);
    }
  }, [onSuccess, onError]);

  // Handle PayPal payment cancellation
  const onCancelHandler = useCallback(() => {
    setStatus('cancelled');
    console.log('PayPal payment cancelled');
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Handle PayPal payment errors
  const onErrorHandler = useCallback((error: unknown) => {
    console.error('PayPal payment error:', error);
    const message = handlePayPalError(error);
    setStatus('error');
    setErrorMessage(message);
    onError(message);
  }, [onError]);

  // Reset payment state
  const resetPayment = useCallback(() => {
    setStatus(paypalConfigValid ? 'idle' : 'config-error');
    setErrorMessage(paypalConfigValid ? '' : 'PayPal configuration is required');
  }, [paypalConfigValid]);

  // Show loading state while PayPal script is loading
  if (isPending) {
    return (
      <div className="space-y-3">
        <div className="w-full h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading PayPal...</span>
        </div>
      </div>
    );
  }

  // Show error state if PayPal script failed to load
  if (isRejected) {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-700">
            <XCircle className="h-5 w-5 mr-2" />
            <strong>PayPal Loading Error</strong>
          </div>
          <p className="text-sm text-red-600 mt-1">
            Failed to load PayPal. Please refresh the page and try again.
          </p>
        </div>
      </div>
    );
  }

  // Show configuration error if PayPal is not properly configured
  if (status === 'config-error' || paypalConfigValid === false) {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center text-yellow-700">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <strong>PayPal Configuration Required</strong>
          </div>
          <p className="text-sm text-yellow-600 mt-1">
            PayPal payment processing is not currently available. Please contact support for assistance with subscription upgrades.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* PayPal Buttons */}
      <div className={`w-full ${className}`}>
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'pay',
            height: 40,
            disableMaxWidth: true
          }}
          disabled={disabled || status === 'processing' || status === 'success' || !paypalConfigValid}
          createOrder={createOrder}
          onApprove={onApprove}
          onCancel={onCancelHandler}
          onError={onErrorHandler}
        />
      </div>

      {/* Status Messages */}
      {status === 'error' && errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-700 break-words">
                <strong>Payment Error:</strong> {errorMessage}
              </p>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetPayment}
                  className="text-red-700 border-red-300 hover:bg-red-50 w-full sm:w-auto"
                >
                  Try Again
                </Button>
                {onCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onCancel}
                    className="text-gray-600 w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-sm text-green-700">
              <strong>Payment Successful!</strong> Your subscription has been activated.
            </p>
          </div>
        </div>
      )}

      {status === 'processing' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
            <p className="text-sm text-blue-700">
              Processing your payment securely through PayPal...
            </p>
          </div>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
            <p className="text-sm text-yellow-700">
              Payment was cancelled. You can try again when ready.
            </p>
          </div>
        </div>
      )}

      {/* PayPal Security Notice */}
      {paypalConfigValid && (
        <div className="text-xs text-gray-500 text-center space-y-1 px-2">
          <p>💳 Secure payment powered by PayPal</p>
          <p>🔒 Your payment information is encrypted and secure</p>
          <p className="text-gray-400 break-words">
            Amount: ${amount.toFixed(2)} {currency} • {description}
          </p>
        </div>
      )}
    </div>
  );
};

export default PayPalButton;