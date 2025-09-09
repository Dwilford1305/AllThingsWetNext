/**
 * PayPal Payment Service
 * Handles payment processing, error recovery, and edge case scenarios
 */

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  captureId?: string;
  orderId?: string;
  error?: string;
  retryable?: boolean;
}

export interface PaymentRetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: PaymentRetryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2
};

/**
 * Payment service with retry logic and error handling
 */
export class PaymentService {
  private retryConfig: PaymentRetryConfig;

  constructor(retryConfig: PaymentRetryConfig = DEFAULT_RETRY_CONFIG) {
    this.retryConfig = retryConfig;
  }

  /**
   * Process payment with automatic retry on transient failures
   */
  async processPayment(
    amount: number,
    currency: string,
    description: string
  ): Promise<PaymentResult> {
    let lastError: PaymentError | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`Payment attempt ${attempt}/${this.retryConfig.maxRetries}`);
        
        // Create order
        const orderId = await this.createOrderWithRetry(amount, currency, description, attempt);
        
        // Note: Order capture happens in the PayPal button component
        // This method returns the order ID for the frontend to handle
        return {
          success: true,
          orderId
        };

      } catch (error) {
        lastError = error instanceof PaymentError ? error : new PaymentError(
          error instanceof Error ? error.message : 'Unknown payment error',
          'UNKNOWN_ERROR'
        );

        console.warn(`Payment attempt ${attempt} failed:`, lastError.message);

        // Don't retry if error is not retryable or this is the last attempt
        if (!lastError.retryable || attempt === this.retryConfig.maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Payment failed after all retry attempts',
      retryable: lastError?.retryable || false
    };
  }

  /**
   * Create PayPal order with error handling
   */
  private async createOrderWithRetry(
    amount: number,
    currency: string,
    description: string,
    attempt: number
  ): Promise<string> {
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
        const errorData = await response.json().catch(() => ({}));
        throw this.createPaymentError(response.status, errorData.error || 'HTTP error', attempt);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw this.createPaymentError(500, data.error || 'API error', attempt);
      }

      return data.orderId;

    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new PaymentError(
          'Network connection failed. Please check your internet connection.',
          'NETWORK_ERROR',
          true // Network errors are retryable
        );
      }

      throw new PaymentError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN_ERROR',
        false
      );
    }
  }

  /**
   * Capture PayPal payment with error handling
   */
  async capturePayment(orderId: string): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createPaymentError(response.status, errorData.error || 'HTTP error', 1);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw this.createPaymentError(500, data.error || 'Capture failed', 1);
      }

      return {
        success: true,
        paymentId: data.paymentId,
        captureId: data.captureId,
        orderId: data.orderId
      };

    } catch (error) {
      if (error instanceof PaymentError) {
        return {
          success: false,
          error: error.message,
          retryable: error.retryable
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment capture failed',
        retryable: false
      };
    }
  }

  /**
   * Create appropriate PaymentError based on HTTP status and context
   */
  private createPaymentError(status: number, message: string, attempt: number): PaymentError {
    switch (status) {
      case 400:
        return new PaymentError(
          `Invalid payment data: ${message}`,
          'INVALID_DATA',
          false // Client errors are not retryable
        );
      
      case 401:
        return new PaymentError(
          'Payment authentication failed. Please try again.',
          'AUTH_ERROR',
          false
        );
      
      case 403:
        return new PaymentError(
          'Payment not authorized. Please check your payment method.',
          'FORBIDDEN',
          false
        );
      
      case 404:
        return new PaymentError(
          'Payment service not found.',
          'NOT_FOUND',
          false
        );
      
      case 422:
        return new PaymentError(
          `Payment validation failed: ${message}`,
          'VALIDATION_ERROR',
          false
        );
      
      case 429:
        return new PaymentError(
          'Too many payment requests. Please wait a moment and try again.',
          'RATE_LIMIT',
          true // Rate limit errors are retryable
        );
      
      case 500:
      case 502:
      case 503:
      case 504:
        return new PaymentError(
          `Payment service temporarily unavailable${attempt > 1 ? ` (attempt ${attempt})` : ''}. Please try again.`,
          'SERVER_ERROR',
          true // Server errors are retryable
        );
      
      default:
        return new PaymentError(
          message || `Payment failed with status ${status}`,
          'HTTP_ERROR',
          status >= 500 // 5xx errors are retryable
        );
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate payment amount and currency
   */
  static validatePaymentData(amount: number, currency: string): void {
    if (!amount || amount <= 0) {
      throw new PaymentError('Invalid amount. Must be greater than 0.', 'INVALID_AMOUNT', false);
    }

    if (amount < 0.01) {
      throw new PaymentError('Amount too small. Minimum amount is $0.01.', 'AMOUNT_TOO_SMALL', false);
    }

    if (amount > 10000) {
      throw new PaymentError('Amount too large. Maximum amount is $10,000.', 'AMOUNT_TOO_LARGE', false);
    }

    if (!currency || !['CAD', 'USD'].includes(currency)) {
      throw new PaymentError('Invalid currency. Only CAD and USD are supported.', 'INVALID_CURRENCY', false);
    }
  }

  /**
   * Check if payment error is retryable
   */
  static isRetryableError(error: any): boolean {
    if (error instanceof PaymentError) {
      return error.retryable;
    }

    // Network errors are generally retryable
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    return false;
  }
}