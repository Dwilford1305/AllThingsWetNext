import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { PaymentService, PaymentError } from '@/lib/payment-service';

// Mock fetch globally
global.fetch = jest.fn();

describe('PayPal Integration Edge Cases', () => {
  let paymentService: PaymentService;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    paymentService = new PaymentService({
      maxRetries: 3,
      retryDelay: 100, // Shorter delay for tests
      backoffMultiplier: 2
    });
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Payment Processing Edge Cases', () => {
    it('should handle network connection failures with retry', async () => {
      // Simulate network error
      mockFetch.mockRejectedValue(new TypeError('fetch failed'));

      const result = await paymentService.processPayment(29.99, 'CAD', 'Test payment');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network connection failed');
      expect(result.retryable).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Should retry 3 times
    });

    it('should handle server errors with retry', async () => {
      // Simulate server error
      mockFetch.mockResolvedValue(new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), { status: 500 }));

      const result = await paymentService.processPayment(19.99, 'CAD', 'Test payment');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment service temporarily unavailable');
      expect(result.retryable).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Should retry
    });

    it('should not retry client errors (400-499)', async () => {
      // Simulate client error
      mockFetch.mockResolvedValue(new Response(JSON.stringify({
        success: false,
        error: 'Invalid payment data'
      }), { status: 400 }));

      const result = await paymentService.processPayment(19.99, 'CAD', 'Test payment');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid payment data');
      expect(result.retryable).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should not retry
    });

    it('should handle successful payment after retry', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockResolvedValueOnce(new Response('Server error', { status: 500 }))
        .mockResolvedValueOnce(new Response('Server error', { status: 500 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          success: true,
          orderId: 'ORDER_123456789'
        }), { status: 200 }));

      const result = await paymentService.processPayment(39.99, 'CAD', 'Test payment');

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('ORDER_123456789');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Payment Validation Edge Cases', () => {
    it('should validate amount is positive', () => {
      expect(() => {
        PaymentService.validatePaymentData(-10, 'CAD');
      }).toThrow(PaymentError);

      expect(() => {
        PaymentService.validatePaymentData(0, 'CAD');
      }).toThrow(PaymentError);
    });

    it('should validate minimum amount', () => {
      expect(() => {
        PaymentService.validatePaymentData(0.005, 'CAD');
      }).toThrow('Amount too small');
    });

    it('should validate maximum amount', () => {
      expect(() => {
        PaymentService.validatePaymentData(15000, 'CAD');
      }).toThrow('Amount too large');
    });

    it('should validate supported currencies', () => {
      expect(() => {
        PaymentService.validatePaymentData(10, 'EUR');
      }).toThrow('Invalid currency');

      expect(() => {
        PaymentService.validatePaymentData(10, 'GBP');
      }).toThrow('Invalid currency');

      // Should accept valid currencies
      expect(() => {
        PaymentService.validatePaymentData(10, 'CAD');
      }).not.toThrow();

      expect(() => {
        PaymentService.validatePaymentData(10, 'USD');
      }).not.toThrow();
    });
  });

  describe('Payment Capture Edge Cases', () => {
    it('should handle order not found error', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({
        success: false,
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      }), { status: 404 }));

      const result = await paymentService.capturePayment('INVALID_ORDER_ID');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment service not found'); // Matches actual error mapping
      expect(result.retryable).toBe(false);
    });

    it('should handle order already captured error', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({
        success: false,
        error: 'Order already captured',
        code: 'ORDER_NOT_CAPTURABLE'
      }), { status: 422 }));

      const result = await paymentService.capturePayment('ORDER_123456789');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already captured');
      expect(result.retryable).toBe(false);
    });

    it('should handle successful capture', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({
        success: true,
        paymentId: 'PAYMENT_123456789',
        captureId: 'CAPTURE_123456789',
        orderId: 'ORDER_123456789'
      }), { status: 200 }));

      const result = await paymentService.capturePayment('ORDER_123456789');

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('PAYMENT_123456789');
      expect(result.captureId).toBe('CAPTURE_123456789');
    });
  });

  describe('Error Classification', () => {
    it('should correctly identify retryable errors', () => {
      const retryableError = new PaymentError('Server error', 'SERVER_ERROR', true);
      expect(PaymentService.isRetryableError(retryableError)).toBe(true);

      const nonRetryableError = new PaymentError('Invalid data', 'INVALID_DATA', false);
      expect(PaymentService.isRetryableError(nonRetryableError)).toBe(false);

      const networkError = new TypeError('fetch failed');
      expect(PaymentService.isRetryableError(networkError)).toBe(true);

      const genericError = new Error('Unknown error');
      expect(PaymentService.isRetryableError(genericError)).toBe(false);
    });
  });

  describe('Subscription Flow Edge Cases', () => {
    it('should handle subscription upgrade payment flow', async () => {
      // Mock successful order creation
      mockFetch.mockResolvedValue(new Response(JSON.stringify({
        success: true,
        orderId: 'SUB_ORDER_123456789'
      }), { status: 200 }));

      const result = await paymentService.processPayment(
        199.99, 
        'CAD', 
        'Business Subscription - Gold Annual'
      );

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('SUB_ORDER_123456789');
      
      // Verify the API was called with correct subscription data
      expect(mockFetch).toHaveBeenCalledWith('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: '199.99',
          currency: 'CAD',
          description: 'Business Subscription - Gold Annual'
        }),
      });
    });

    it('should handle payment failure during subscription upgrade', async () => {
      // Mock payment failure
      mockFetch.mockResolvedValue(new Response(JSON.stringify({
        success: false,
        error: 'Payment method declined',
        code: 'PAYMENT_DECLINED'
      }), { status: 422 }));

      const result = await paymentService.processPayment(
        799.99, 
        'CAD', 
        'Business Subscription - Platinum Annual'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment method declined');
      expect(result.retryable).toBe(false);
    });
  });

  describe('PayPal API Error Scenarios', () => {
    it('should handle PayPal authentication errors', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({
        success: false,
        error: 'PayPal authentication service unavailable',
        code: 'PAYPAL_AUTH_ERROR'
      }), { status: 503 }));

      const result = await paymentService.processPayment(29.99, 'CAD', 'Test payment');

      expect(result.success).toBe(false);
      expect(result.error).toContain('temporarily unavailable'); // Matches actual 503 error mapping
      expect(result.retryable).toBe(true);
    });

    it('should handle PayPal rate limiting', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({
        success: false,
        error: 'Too many payment requests',
        code: 'RATE_LIMIT'
      }), { status: 429 }));

      const result = await paymentService.processPayment(29.99, 'CAD', 'Test payment');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many payment requests');
      expect(result.retryable).toBe(true);
    });

    it('should handle PayPal service downtime', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({
        success: false,
        error: 'PayPal service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE'
      }), { status: 503 }));

      const result = await paymentService.processPayment(29.99, 'CAD', 'Test payment');

      expect(result.success).toBe(false);
      expect(result.error).toContain('temporarily unavailable');
      expect(result.retryable).toBe(true);
    });
  });

  describe('Edge Case Amounts and Currencies', () => {
    it('should handle edge case valid amounts', async () => {
      // Set up mock to succeed for all three calls
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify({
          success: true,
          orderId: 'ORDER_MIN'
        }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          success: true,
          orderId: 'ORDER_MAX'
        }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          success: true,
          orderId: 'ORDER_DECIMAL'
        }), { status: 200 }));

      // Test minimum valid amount
      const minResult = await paymentService.processPayment(0.01, 'CAD', 'Minimum payment');
      expect(minResult.success).toBe(true);

      // Test maximum valid amount
      const maxResult = await paymentService.processPayment(10000, 'USD', 'Maximum payment');
      expect(maxResult.success).toBe(true);

      // Test decimal precision
      const decimalResult = await paymentService.processPayment(123.456, 'CAD', 'Decimal payment');
      expect(decimalResult.success).toBe(true);
    });

    it('should properly format amounts for PayPal', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({
        success: true,
        orderId: 'ORDER_FORMATTED'
      }), { status: 200 }));

      await paymentService.processPayment(123.456, 'CAD', 'Test formatting');

      // Verify amount is formatted to 2 decimal places
      const callArgs = mockFetch.mock.calls[0];
      const bodyStr = callArgs?.[1]?.body as string;
      const body = JSON.parse(bodyStr);
      expect(body.amount).toBe('123.46'); // Should be rounded to 2 decimal places
    });
  });
});