import { NextRequest, NextResponse } from 'next/server';
import { getPayPalConfig, handlePayPalError } from '@/lib/paypal-config';

interface CaptureOrderRequest {
  orderId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CaptureOrderRequest = await request.json();
    const { orderId } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: orderId is required',
          code: 'MISSING_ORDER_ID'
        },
        { status: 400 }
      );
    }

    // Validate order ID format (PayPal order IDs are typically 17+ characters)
    if (orderId.length < 10) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid order ID format.',
          code: 'INVALID_ORDER_ID'
        },
        { status: 400 }
      );
    }

    // Get PayPal configuration
    const config = getPayPalConfig();

    // Get PayPal access token with retry logic
    let accessToken: string | undefined;
    let retries = 3;
    
    while (retries > 0) {
      try {
        const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
        
        const tokenResponse = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          throw new Error(`PayPal auth failed: ${tokenResponse.status} - ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        accessToken = tokenData.access_token;
        break;

      } catch (error) {
        retries--;
        console.warn(`PayPal token request failed, retries left: ${retries}`, error);
        
        if (retries === 0) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'PayPal authentication service unavailable. Please try again later.',
              code: 'PAYPAL_AUTH_ERROR'
            },
            { status: 503 }
          );
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Capture the PayPal order with retry logic
    if (!accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PayPal authentication failed',
          code: 'PAYPAL_AUTH_ERROR'
        },
        { status: 503 }
      );
    }

    let captureData: Record<string, unknown> = {};
    retries = 2; // Fewer retries for capture as it's more sensitive
    
    while (retries > 0) {
      try {
        const captureResponse = await fetch(`${config.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'PayPal-Request-Id': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        });

        if (!captureResponse.ok) {
          const errorData = await captureResponse.json().catch(() => ({}));
          console.error('PayPal order capture error:', {
            status: captureResponse.status,
            orderId,
            error: errorData
          });

          // Handle specific capture errors
          if (captureResponse.status === 404) {
            return NextResponse.json(
              { 
                success: false, 
                error: 'Order not found. The order may have expired or been cancelled.',
                code: 'ORDER_NOT_FOUND'
              },
              { status: 404 }
            );
          }

          if (captureResponse.status === 422) {
            const errorMessage = handlePayPalError(errorData);
            return NextResponse.json(
              { 
                success: false, 
                error: errorMessage || 'Order cannot be captured. It may have already been processed.',
                code: 'ORDER_NOT_CAPTURABLE',
                details: errorData
              },
              { status: 422 }
            );
          }

          // Retry on server errors
          if (captureResponse.status >= 500 && retries > 1) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }

          const errorMessage = handlePayPalError(errorData);
          return NextResponse.json(
            { 
              success: false, 
              error: errorMessage,
              code: 'PAYPAL_CAPTURE_ERROR',
              details: errorData
            },
            { status: captureResponse.status >= 500 ? 503 : 400 }
          );
        }

        captureData = await captureResponse.json();
        break;

      } catch (error) {
        retries--;
        console.warn(`PayPal capture attempt failed, retries left: ${retries}`, error);
        
        if (retries === 0) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Payment capture failed. Please try again.',
              code: 'CAPTURE_FAILED'
            },
            { status: 503 }
          );
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Extract payment information
    const paymentId = captureData.id as string;
    const status = captureData.status as string;
    const purchaseUnits = (captureData.purchase_units as Array<Record<string, unknown>>) || [];
    const captures = (purchaseUnits[0]?.payments as Record<string, unknown>)?.captures as Array<Record<string, unknown>> || [];
    const captureId = captures[0]?.id as string;
    const amount = captures[0]?.amount as Record<string, unknown>;

    // Validate that payment was successful
    if (status !== 'COMPLETED') {
      console.error('Payment not completed:', { status, orderId, paymentId });
      return NextResponse.json(
        { 
          success: false, 
          error: `Payment not completed. Status: ${status}. Please try again or contact support.`,
          code: 'PAYMENT_NOT_COMPLETED',
          details: { status, orderId }
        },
        { status: 422 }
      );
    }

    if (!captureId) {
      console.error('No capture ID in PayPal response:', captureData);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment processing incomplete. Please contact support with your order ID.',
          code: 'NO_CAPTURE_ID',
          details: { orderId }
        },
        { status: 422 }
      );
    }

    console.log('✅ PayPal payment captured successfully:', {
      paymentId,
      captureId,
      orderId,
      amount: amount ? `${amount.value} ${amount.currency_code}` : 'Unknown',
      status,
      environment: config.environment
    });

    return NextResponse.json({
      success: true,
      paymentId,
      captureId,
      orderId,
      status,
      amount,
      details: captureData
    });

  } catch (error) {
    console.error('PayPal capture order error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Network connection failed. Please check your internet connection and try again.',
            code: 'NETWORK_ERROR'
          },
          { status: 503 }
        );
      }

      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Payment service timeout. Please try again.',
            code: 'TIMEOUT_ERROR'
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred during payment processing. Please try again.',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}