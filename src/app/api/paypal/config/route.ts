import { NextResponse } from 'next/server';

/**
 * Public PayPal Configuration API
 * Returns client-safe PayPal configuration for frontend use
 */
export async function GET() {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const environment = (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    // Return configuration for client-side use
    // Note: We never expose the client secret to the client
    return NextResponse.json({
      success: true,
      config: {
        clientId: clientId || null,
        environment,
        currency: 'CAD',
        configured: !!clientId
      }
    });

  } catch (error) {
    console.error('Error getting PayPal config:', error);
    
    return NextResponse.json({
      success: false,
      config: {
        clientId: null,
        environment: 'sandbox',
        currency: 'CAD',
        configured: false
      }
    });
  }
}