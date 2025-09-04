'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface PayPalButtonProps {
  amount: number;
  currency?: string;
  description: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

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

  const handlePayment = async () => {
    setStatus('processing');
    setErrorMessage('');

    try {
      // TODO: Replace with actual PayPal SDK integration
      // This is a placeholder that simulates payment processing
      console.log('Payment initiated:', {
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
      default:
        return (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ${amount.toFixed(2)} {currency}
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (status) {
      case 'success':
        return 'outline';
      case 'error':
        return 'outline';
      default:
        return 'primary';
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handlePayment}
        disabled={disabled || status === 'processing' || status === 'success'}
        variant={getButtonVariant()}
        className={`w-full ${className} ${
          status === 'success' 
            ? 'border-green-500 text-green-700 bg-green-50' 
            : status === 'error'
            ? 'border-red-500 text-red-700 bg-red-50'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {getButtonContent()}
      </Button>

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

      {status === 'success' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Payment Successful!</strong> Your subscription has been activated.
          </p>
        </div>
      )}

      {status === 'processing' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Processing your payment securely through PayPal...
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        <p>💳 Secure payment powered by PayPal</p>
        <p>🔒 Your payment information is encrypted and secure</p>
      </div>
    </div>
  );
};

export default PayPalButton;