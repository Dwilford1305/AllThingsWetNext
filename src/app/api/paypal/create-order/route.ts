import { NextRequest, NextResponse } from 'next/server';
import { getPayPalConfig } from '@/lib/paypal-config';

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
          error: 'Missing required fields: amount, currency, and description are required' 
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
          error: 'Invalid amount. Must be a positive number.' 
        },
        { status: 400 }
      );
    }

    // Get PayPal configuration
    const config = getPayPalConfig();

    // Get PayPal access token
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
      throw new Error(`Failed to get PayPal access token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Create PayPal order
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: numericAmount.toFixed(2),
          },
          description: description,
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
      const errorData = await orderResponse.text();
      console.error('PayPal order creation error:', errorData);
      throw new Error(`Failed to create PayPal order: ${orderResponse.status}`);
    }

    const order = await orderResponse.json();

    console.log('✅ PayPal order created:', {
      orderId: order.id,
      amount: `${amount} ${currency}`,
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
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create PayPal order' 
      },
      { status: 500 }
    );
  }
}