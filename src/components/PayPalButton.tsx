'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { PAYPAL_SDK_OPTIONS, SANDBOX_UTILITIES } from '@/lib/paypal';

interface PayPalButtonProps {
  amount: number;
  currency?: string;
  description: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
  // Payment mode: 'sandbox' uses real PayPal SDK, 'simulation' uses mock payments
  mode?: 'sandbox' | 'simulation';
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error' | 'cancelled';

export const PayPalButton: React.FC<PayPalButtonProps> = ({
  amount,
  currency = 'CAD',
  description,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  className = '',
  mode = 'simulation' // Default to simulation for backward compatibility
}) => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPayPalReady, setIsPayPalReady] = useState(false);

  // Check if PayPal SDK should be used
  const usePayPalSDK = mode === 'sandbox' && process.env.NODE_ENV !== 'test';

  useEffect(() => {
    if (usePayPalSDK) {
      // PayPal SDK will handle the ready state
      setIsPayPalReady(true);
    } else {
      // For simulation mode, we're always ready
      setIsPayPalReady(true);
    }
  }, [usePayPalSDK]);

  // Simulation mode payment handler (existing logic)
  const handleSimulatedPayment = async () => {
    setStatus('processing');
    setErrorMessage('');

    try {
      console.log('Simulated payment initiated:', {
        amount,
        currency,
        description
      });

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful payment (90% success rate for demo)
      const isSuccessful = Math.random() > 0.1;
      
      if (isSuccessful) {
        const mockPaymentId = `PAYID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setStatus('success');
        onSuccess(mockPaymentId);
      } else {
        throw new Error('Payment was declined by your financial institution.');
      }
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : 'Payment processing failed';
      setErrorMessage(message);
      onError(message);
    }
  };

  // PayPal SDK payment handlers
  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [{
        amount: {
          value: amount.toFixed(2),
          currency_code: currency
        },
        description: description
      }],
      application_context: {
        shipping_preference: 'NO_SHIPPING'
      }
    });
  };

  const onApprove = async (data: any, actions: any) => {
    setStatus('processing');
    try {
      const order = await actions.order.capture();
      const paymentId = order.id;
      setStatus('success');
      onSuccess(paymentId);
    } catch (error) {
      console.error('PayPal payment capture error:', error);
      setStatus('error');
      const message = 'Payment capture failed. Please try again.';
      setErrorMessage(message);
      onError(message);
    }
  };

  const onPayPalError = (err: any) => {
    console.error('PayPal payment error:', err);
    setStatus('error');
    const message = 'Payment processing failed. Please try again.';
    setErrorMessage(message);
    onError(message);
  };

  const onPayPalCancel = () => {
    setStatus('cancelled');
    if (onCancel) {
      onCancel();
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            Payment Successful!
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="h-4 w-4 mr-2 text-red-500" />
            Payment Failed
          </>
        );
      case 'cancelled':
        return (
          <>
            <XCircle className="h-4 w-4 mr-2 text-gray-500" />
            Payment Cancelled
          </>
        );
      default:
        return (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            {usePayPalSDK ? `Pay with PayPal` : `Pay $${amount.toFixed(2)} ${currency}`}
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (status) {
      case 'success':
        return 'outline';
      case 'error':
      case 'cancelled':
        return 'outline';
      default:
        return 'primary';
    }
  };

  // Don't render until PayPal is ready (prevents hydration issues)
  if (!isPayPalReady) {
    return (
      <div className="space-y-3">
        <Button disabled className="w-full">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading Payment Options...
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {usePayPalSDK ? (
        // Real PayPal SDK Integration
        <PayPalScriptProvider options={PAYPAL_SDK_OPTIONS}>
          <div className="paypal-button-container">
            <PayPalButtons
              style={{
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'pay'
              }}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onPayPalError}
              onCancel={onPayPalCancel}
              disabled={disabled || status === 'processing' || status === 'success'}
            />
          </div>
          
          {/* Status indicators */}
          {status === 'processing' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing your PayPal payment...
              </p>
            </div>
          )}
        </PayPalScriptProvider>
      ) : (
        // Simulation Mode (existing button)
        <Button
          onClick={handleSimulatedPayment}
          disabled={disabled || status === 'processing' || status === 'success'}
          variant={getButtonVariant()}
          className={`w-full ${className} ${
            status === 'success' 
              ? 'border-green-500 text-green-700 bg-green-50' 
              : status === 'error'
              ? 'border-red-500 text-red-700 bg-red-50'
              : status === 'cancelled'
              ? 'border-gray-500 text-gray-700 bg-gray-50'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {getButtonContent()}
        </Button>
      )}

      {/* Error handling */}
      {status === 'error' && errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Payment Error:</strong> {errorMessage}
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setStatus('idle');
                setErrorMessage('');
              }}
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              Try Again
            </Button>
            {onCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                className="text-gray-600"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Success state */}
      {status === 'success' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Payment Successful!</strong> Your subscription has been activated.
          </p>
        </div>
      )}

      {/* Cancelled state */}
      {status === 'cancelled' && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            Payment was cancelled. You can try again or choose a different payment method.
          </p>
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setStatus('idle');
                setErrorMessage('');
              }}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Processing state for simulation mode */}
      {status === 'processing' && !usePayPalSDK && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Processing your payment securely through PayPal...
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        <p>💳 Secure payment powered by PayPal</p>
        <p>🔒 Your payment information is encrypted and secure</p>
        {SANDBOX_UTILITIES.isSandbox() && (
          <p className="text-orange-600">⚠️ Sandbox Mode - Test payments only</p>
        )}
      </div>
    </div>
  );
};

export default PayPalButton;