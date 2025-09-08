import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';

/**
 * PayPal Webhook Handler
 * Handles PayPal webhook events for payment processing, subscription management, etc.
 * 
 * Webhook events handled:
 * - PAYMENT.CAPTURE.COMPLETED
 * - PAYMENT.CAPTURE.DENIED 
 * - BILLING.SUBSCRIPTION.CREATED
 * - BILLING.SUBSCRIPTION.CANCELLED
 * - BILLING.SUBSCRIPTION.EXPIRED
 */

// PayPal webhook event types
const WEBHOOK_EVENTS = {
  PAYMENT_CAPTURE_COMPLETED: 'PAYMENT.CAPTURE.COMPLETED',
  PAYMENT_CAPTURE_DENIED: 'PAYMENT.CAPTURE.DENIED',
  SUBSCRIPTION_CREATED: 'BILLING.SUBSCRIPTION.CREATED',
  SUBSCRIPTION_CANCELLED: 'BILLING.SUBSCRIPTION.CANCELLED', 
  SUBSCRIPTION_EXPIRED: 'BILLING.SUBSCRIPTION.EXPIRED',
  SUBSCRIPTION_PAYMENT_COMPLETED: 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED',
  SUBSCRIPTION_PAYMENT_FAILED: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED'
} as const;

/**
 * Verify PayPal webhook signature
 */
function verifyWebhookSignature(
  requestBody: string,
  headers: { [key: string]: string | undefined }
): boolean {
  const webhookSecret = process.env.PAYPAL_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('PAYPAL_WEBHOOK_SECRET not configured');
    return false;
  }
  
  const signature = headers['paypal-transmission-sig'];
  const transmissionId = headers['paypal-transmission-id'];
  const timestamp = headers['paypal-transmission-time'];
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  
  if (!signature || !transmissionId || !timestamp || !webhookId) {
    console.error('Missing required PayPal webhook headers');
    return false;
  }
  
  // Create verification string according to PayPal specification
  const verificationString = `${transmissionId}|${timestamp}|${webhookId}|${crypto.createHash('sha256').update(requestBody).digest('base64')}`;
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(verificationString)
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'base64'),
    Buffer.from(expectedSignature, 'base64')
  );
}

/**
 * Handle payment capture completed event
 */
async function handlePaymentCaptured(eventData: any) {
  try {
    const payment = eventData.resource;
    const paymentId = payment.id;
    const amount = payment.amount?.value;
    const currency = payment.amount?.currency_code;
    
    console.log('Payment captured:', { paymentId, amount, currency });
    
    // TODO: Update subscription status in database
    // This would typically update the user's subscription tier
    // based on the payment amount and custom_id
    
    // For now, just log the successful payment
    return {
      success: true,
      message: 'Payment processed successfully',
      paymentId
    };
    
  } catch (error) {
    console.error('Error processing payment capture:', error);
    throw error;
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(eventData: any) {
  try {
    const subscription = eventData.resource;
    const subscriptionId = subscription.id;
    const status = subscription.status;
    
    console.log('Subscription created:', { subscriptionId, status });
    
    // TODO: Create subscription record in database
    
    return {
      success: true,
      message: 'Subscription created successfully',
      subscriptionId
    };
    
  } catch (error) {
    console.error('Error processing subscription creation:', error);
    throw error;
  }
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(eventData: any) {
  try {
    const subscription = eventData.resource;
    const subscriptionId = subscription.id;
    
    console.log('Subscription cancelled:', { subscriptionId });
    
    // TODO: Update subscription status to cancelled in database
    
    return {
      success: true,
      message: 'Subscription cancelled successfully',
      subscriptionId
    };
    
  } catch (error) {
    console.error('Error processing subscription cancellation:', error);
    throw error;
  }
}

/**
 * Handle subscription payment failed event
 */
async function handleSubscriptionPaymentFailed(eventData: any) {
  try {
    const payment = eventData.resource;
    const subscriptionId = payment.billing_agreement_id;
    
    console.log('Subscription payment failed:', { subscriptionId });
    
    // TODO: Handle failed payment (send email, update status, etc.)
    
    return {
      success: true,
      message: 'Subscription payment failure processed',
      subscriptionId
    };
    
  } catch (error) {
    console.error('Error processing subscription payment failure:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestBody = await request.text();
    const eventData = JSON.parse(requestBody);
    
    // Get headers for signature verification
    const headers: { [key: string]: string | undefined } = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!verifyWebhookSignature(requestBody, headers)) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }
    
    console.log('PayPal webhook received:', {
      eventType: eventData.event_type,
      eventId: eventData.id
    });
    
    // Connect to database for data operations
    await connectDB();
    
    let result;
    
    // Handle different event types
    switch (eventData.event_type) {
      case WEBHOOK_EVENTS.PAYMENT_CAPTURE_COMPLETED:
        result = await handlePaymentCaptured(eventData);
        break;
        
      case WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
        result = await handleSubscriptionCreated(eventData);
        break;
        
      case WEBHOOK_EVENTS.SUBSCRIPTION_CANCELLED:
        result = await handleSubscriptionCancelled(eventData);
        break;
        
      case WEBHOOK_EVENTS.SUBSCRIPTION_PAYMENT_FAILED:
        result = await handleSubscriptionPaymentFailed(eventData);
        break;
        
      case WEBHOOK_EVENTS.PAYMENT_CAPTURE_DENIED:
        console.log('Payment capture denied:', eventData.resource?.id);
        result = { success: true, message: 'Payment denial processed' };
        break;
        
      default:
        console.log('Unhandled webhook event type:', eventData.event_type);
        result = { success: true, message: 'Event type not handled' };
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method for webhook verification during setup
export async function GET(request: NextRequest) {
  // PayPal webhook verification challenge
  const challenge = request.nextUrl.searchParams.get('challenge');
  
  if (challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return NextResponse.json({
    message: 'PayPal webhook endpoint is active',
    webhookUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/payments/webhook`,
    environment: process.env.PAYPAL_MODE || 'sandbox'
  });
}