import { NextRequest, NextResponse } from 'next/server';
import { getPayPalConfig, handlePayPalError } from '@/lib/paypal-config';

interface CreateOrderRequest {
  amount: string;
  currency: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { amount, currency, description } = body;

    // Validate required fields
    if (!amount || !currency || !description) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: amount, currency, and description are required',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid amount. Must be a positive number.',
          code: 'INVALID_AMOUNT'
        },
        { status: 400 }
      );
    }

    // Validate amount limits
    if (numericAmount < 0.01) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Amount too small. Minimum amount is $0.01.',
          code: 'AMOUNT_TOO_SMALL'
        },
        { status: 400 }
      );
    }

    if (numericAmount > 10000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Amount too large. Maximum amount is $10,000.',
          code: 'AMOUNT_TOO_LARGE'
        },
        { status: 400 }
      );
    }

    // Validate currency
    if (!['CAD', 'USD'].includes(currency.toUpperCase())) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid currency. Only CAD and USD are supported.',
          code: 'INVALID_CURRENCY'
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

    // Create PayPal order
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

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency.toUpperCase(),
            value: numericAmount.toFixed(2),
          },
          description: description.substring(0, 127), // PayPal limit
        },
      ],
      application_context: {
        brand_name: 'AllThingsWetaskiwin',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXTAUTH_URL}/payment/success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`,
      },
    };

    const orderResponse = await fetch(`${config.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json().catch(() => ({}));
      console.error('PayPal order creation error:', {
        status: orderResponse.status,
        error: errorData
      });

      const errorMessage = handlePayPalError(errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          code: 'PAYPAL_ORDER_ERROR',
          details: errorData
        },
        { status: orderResponse.status >= 500 ? 503 : 400 }
      );
    }

    const order = await orderResponse.json();

    console.log('✅ PayPal order created successfully:', {
      orderId: order.id,
      amount: `${numericAmount.toFixed(2)} ${currency}`,
      description,
      environment: config.environment
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      order: order
    });

  } catch (error) {
    console.error('PayPal create order error:', error);
    
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
        error: 'An unexpected error occurred. Please try again.',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}