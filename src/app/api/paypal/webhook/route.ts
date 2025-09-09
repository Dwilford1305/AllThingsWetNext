import { NextRequest, NextResponse } from 'next/server';
import { getPayPalConfig } from '@/lib/paypal-config';
import { InvoiceService } from '@/lib/invoice-service';
import { connectDB } from '@/lib/mongodb';
import { Business } from '@/models';

// PayPal webhook event types we handle
const SUPPORTED_EVENTS = [
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.DENIED',
  'PAYMENT.CAPTURE.DECLINED',
  'PAYMENT.CAPTURE.REFUNDED',
  'CHECKOUT.ORDER.APPROVED',
  'CHECKOUT.ORDER.COMPLETED',
  'BILLING.SUBSCRIPTION.CREATED',
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.EXPIRED',
  'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
] as const;

type PayPalEventType = typeof SUPPORTED_EVENTS[number];

interface PayPalWebhookEvent {
  id: string;
  create_time: string;
  resource_type: string;
  event_type: PayPalEventType;
  summary: string;
  resource: any;
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

interface PayPalWebhookHeaders {
  'paypal-transmission-id': string;
  'paypal-cert-id': string;
  'paypal-auth-algo': string;
  'paypal-transmission-time': string;
  'paypal-auth-version': string;
  'paypal-transmission-sig': string;
}

export async function POST(request: NextRequest) {
  try {
    // Get PayPal configuration
    const config = getPayPalConfig();

    // Get webhook headers for verification
    const headers: Partial<PayPalWebhookHeaders> = {
      'paypal-transmission-id': request.headers.get('paypal-transmission-id') || '',
      'paypal-cert-id': request.headers.get('paypal-cert-id') || '',
      'paypal-auth-algo': request.headers.get('paypal-auth-algo') || '',
      'paypal-transmission-time': request.headers.get('paypal-transmission-time') || '',
      'paypal-auth-version': request.headers.get('paypal-auth-version') || '',
      'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') || '',
    };

    // Get webhook body
    const body = await request.text();
    const event: PayPalWebhookEvent = JSON.parse(body);

    console.log('📨 PayPal webhook received:', {
      eventType: event.event_type,
      eventId: event.id,
      resourceType: event.resource_type,
      timestamp: event.create_time
    });

    // Verify webhook signature (simplified for demo - in production use PayPal's verification)
    const isVerified = await verifyWebhookSignature(body, headers, config);
    
    if (!isVerified) {
      console.warn('⚠️ PayPal webhook signature verification failed');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Webhook signature verification failed',
          code: 'INVALID_SIGNATURE'
        },
        { status: 401 }
      );
    }

    // Check if we support this event type
    if (!SUPPORTED_EVENTS.includes(event.event_type)) {
      console.log(`ℹ️ Unsupported webhook event: ${event.event_type}`);
      return NextResponse.json({
        success: true,
        message: 'Event type not handled',
        eventType: event.event_type
      });
    }

    // Process the webhook event
    await processWebhookEvent(event);

    console.log('✅ PayPal webhook processed successfully');
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      eventId: event.id,
      eventType: event.event_type
    });

  } catch (error) {
    console.error('❌ PayPal webhook processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
        code: 'WEBHOOK_PROCESSING_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Verify PayPal webhook signature
 * In production, use PayPal's official webhook verification
 */
async function verifyWebhookSignature(
  body: string,
  headers: Partial<PayPalWebhookHeaders>,
  config: ReturnType<typeof getPayPalConfig>
): Promise<boolean> {
  // For development/testing, we'll do basic validation
  // In production, implement proper PayPal webhook signature verification
  
  const requiredHeaders = [
    'paypal-transmission-id',
    'paypal-cert-id',
    'paypal-auth-algo',
    'paypal-transmission-time',
    'paypal-auth-version',
    'paypal-transmission-sig'
  ];

  // Check all required headers are present
  for (const header of requiredHeaders) {
    if (!headers[header as keyof PayPalWebhookHeaders]) {
      console.warn(`Missing required webhook header: ${header}`);
      return false;
    }
  }

  // In sandbox mode, be more lenient with verification
  if (config.environment === 'sandbox') {
    console.log('🧪 Sandbox mode: simplified webhook verification');
    return true;
  }

  // In production, implement proper verification using PayPal's verification API
  // This would involve:
  // 1. Creating verification request to PayPal
  // 2. Sending webhook data and headers to PayPal's verify endpoint
  // 3. Checking PayPal's verification response
  
  console.warn('⚠️ Production webhook verification not implemented - accepting webhook');
  return true;
}

/**
 * Process different types of PayPal webhook events
 */
async function processWebhookEvent(event: PayPalWebhookEvent): Promise<void> {
  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      await handlePaymentCaptureCompleted(event);
      break;
      
    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.DECLINED':
      await handlePaymentFailed(event);
      break;
      
    case 'PAYMENT.CAPTURE.REFUNDED':
      await handlePaymentRefunded(event);
      break;
      
    case 'CHECKOUT.ORDER.APPROVED':
      await handleOrderApproved(event);
      break;
      
    case 'CHECKOUT.ORDER.COMPLETED':
      await handleOrderCompleted(event);
      break;
      
    case 'BILLING.SUBSCRIPTION.CREATED':
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      await handleSubscriptionActivated(event);
      break;
      
    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      await handleSubscriptionDeactivated(event);
      break;
      
    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      await handleSubscriptionPaymentFailed(event);
      break;
      
    default:
      console.log(`ℹ️ Unhandled event type: ${event.event_type}`);
  }
}

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptureCompleted(event: PayPalWebhookEvent): Promise<void> {
  const capture = event.resource;
  const orderId = capture.supplementary_data?.related_ids?.order_id;
  const amount = parseFloat(capture.amount?.value || '0');
  const currency = capture.amount?.currency_code || 'CAD';

  console.log('💰 Payment captured successfully:', {
    captureId: capture.id,
    orderId,
    amount: `${amount} ${currency}`,
    status: capture.status
  });

  // Find related subscription or business from order metadata
  // In a real implementation, you'd store order metadata to link back to subscriptions
  
  // For now, log the successful capture
  // In production, you would:
  // 1. Update subscription status
  // 2. Generate invoice
  // 3. Send confirmation email
  // 4. Update business/user records
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event: PayPalWebhookEvent): Promise<void> {
  const capture = event.resource;
  
  console.warn('⚠️ Payment failed:', {
    captureId: capture.id,
    status: capture.status,
    reason: capture.status_details?.reason || 'Unknown'
  });

  // In production, you would:
  // 1. Mark subscription as payment failed
  // 2. Send payment failure notification
  // 3. Initiate retry logic or grace period
  // 4. Update business status if needed
}

/**
 * Handle payment refund
 */
async function handlePaymentRefunded(event: PayPalWebhookEvent): Promise<void> {
  const refund = event.resource;
  
  console.log('🔄 Payment refunded:', {
    refundId: refund.id,
    amount: `${refund.amount?.value} ${refund.amount?.currency_code}`,
    status: refund.status
  });

  // In production, you would:
  // 1. Update subscription status
  // 2. Revert business tier changes
  // 3. Send refund confirmation
  // 4. Update billing records
}

/**
 * Handle order approval (before capture)
 */
async function handleOrderApproved(event: PayPalWebhookEvent): Promise<void> {
  const order = event.resource;
  
  console.log('👍 Order approved:', {
    orderId: order.id,
    status: order.status,
    intent: order.intent
  });

  // Order is approved but not yet captured
  // This is informational for tracking purposes
}

/**
 * Handle order completion
 */
async function handleOrderCompleted(event: PayPalWebhookEvent): Promise<void> {
  const order = event.resource;
  
  console.log('✅ Order completed:', {
    orderId: order.id,
    status: order.status
  });

  // Order is fully completed - payment has been captured
  // This confirms the entire payment flow is done
}

/**
 * Handle subscription activation
 */
async function handleSubscriptionActivated(event: PayPalWebhookEvent): Promise<void> {
  const subscription = event.resource;
  
  console.log('🎯 Subscription activated:', {
    subscriptionId: subscription.id,
    status: subscription.status,
    planId: subscription.plan_id
  });

  // In production, activate the subscription benefits:
  // 1. Update user/business subscription status
  // 2. Grant access to premium features
  // 3. Send welcome email
  // 4. Schedule next billing reminder
}

/**
 * Handle subscription deactivation
 */
async function handleSubscriptionDeactivated(event: PayPalWebhookEvent): Promise<void> {
  const subscription = event.resource;
  
  console.log('⏹️ Subscription deactivated:', {
    subscriptionId: subscription.id,
    status: subscription.status,
    reason: event.event_type
  });

  // In production, handle subscription end:
  // 1. Downgrade user/business to free tier
  // 2. Remove premium features
  // 3. Send cancellation confirmation
  // 4. Offer reactivation options
}

/**
 * Handle subscription payment failure
 */
async function handleSubscriptionPaymentFailed(event: PayPalWebhookEvent): Promise<void> {
  const subscription = event.resource;
  
  console.warn('💳 Subscription payment failed:', {
    subscriptionId: subscription.id,
    status: subscription.status,
    lastPaymentStatus: subscription.billing_info?.last_payment?.status
  });

  // In production, handle payment failure:
  // 1. Notify customer of payment failure
  // 2. Provide payment update options
  // 3. Start grace period before downgrade
  // 4. Schedule retry attempts
}

// Also handle GET requests for webhook URL verification
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'PayPal webhook endpoint is active',
    environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
    supportedEvents: SUPPORTED_EVENTS
  });
}