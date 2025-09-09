import { NextRequest, NextResponse } from 'next/server';
import { getPayPalConfig } from '@/lib/paypal-config';

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
          error: 'Missing required field: orderId is required' 
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

    // Capture the PayPal order
    const captureResponse = await fetch(`${config.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.text();
      console.error('PayPal order capture error:', errorData);
      throw new Error(`Failed to capture PayPal order: ${captureResponse.status}`);
    }

    const captureData = await captureResponse.json();

    // Extract payment information
    const paymentId = captureData.id;
    const status = captureData.status;
    const purchaseUnits = captureData.purchase_units || [];
    const captures = purchaseUnits[0]?.payments?.captures || [];
    const captureId = captures[0]?.id;
    const amount = captures[0]?.amount;

    // Validate that payment was successful
    if (status !== 'COMPLETED') {
      throw new Error(`Payment not completed. Status: ${status}`);
    }

    if (!captureId) {
      throw new Error('No capture ID found in PayPal response');
    }

    console.log('✅ PayPal payment captured:', {
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
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to capture PayPal payment' 
      },
      { status: 500 }
    );
  }
}