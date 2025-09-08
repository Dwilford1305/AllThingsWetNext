# PayPal Payment Integration Setup Guide

This guide walks you through setting up the complete PayPal payment integration for All Things Wetaskiwin platform.

## Overview

The PayPal integration supports:
- ✅ **Sandbox Testing** - Complete PayPal sandbox environment for development
- ✅ **Subscription Management** - Full subscription lifecycle (create, upgrade, downgrade, cancel)
- ✅ **Invoice Generation** - Professional invoices with Alberta tax compliance
- ✅ **Webhook Processing** - Real-time payment event handling
- ✅ **Payment Analytics** - Comprehensive payment and subscription metrics
- ✅ **Edge Case Handling** - Timeout, failure, and retry scenarios

## Quick Start

### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_WEBHOOK_SECRET=your_webhook_secret

# Existing variables (keep these)
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
```

### 2. PayPal Developer Account Setup

1. **Create PayPal Developer Account**
   - Go to [PayPal Developer](https://developer.paypal.com)
   - Sign up or log in with your PayPal account
   - Access the Developer Dashboard

2. **Create Sandbox Application**
   - Navigate to "My Apps & Credentials"
   - Click "Create App"
   - Choose "Sandbox" environment
   - Select "Default Application" or create new merchant account
   - Copy your Client ID and Client Secret

3. **Configure Webhooks**
   - In your PayPal app settings, go to "Webhooks"
   - Add webhook URL: `https://your-domain.com/api/payments/webhook`
   - For local testing: Use ngrok or similar to expose `http://localhost:3000/api/payments/webhook`
   - Subscribe to these events:
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.DENIED`
     - `BILLING.SUBSCRIPTION.CREATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`
     - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`

### 3. Testing the Integration

#### Sandbox Payment Testing
```bash
# Start development server
npm run dev

# Test payment flow
# 1. Navigate to marketplace or business subscription page
# 2. Click upgrade to any paid tier
# 3. Use PayPal sandbox test accounts:
#    - Buyer: sb-buyer@personal.example.com
#    - Password: provided by PayPal sandbox
```

#### API Testing
```bash
# Test webhook endpoint
curl http://localhost:3000/api/payments/webhook

# Test analytics endpoint
curl "http://localhost:3000/api/payments/analytics?period=30d"

# Test subscription management
curl -X POST http://localhost:3000/api/payments/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "subscriptionType": "marketplace",
    "tier": "gold",
    "billingCycle": "monthly",
    "paymentId": "PAYID-TEST-12345"
  }'
```

## Component Usage

### PayPal Button Component

The `PayPalButton` component automatically switches between sandbox and simulation modes:

```tsx
import { PayPalButton } from '@/components/PayPalButton';

function SubscriptionUpgrade() {
  return (
    <PayPalButton
      amount={19.99}
      currency="CAD"
      description="Marketplace Gold Subscription - Monthly"
      mode="sandbox" // or "simulation" for testing
      onSuccess={(paymentId) => {
        console.log('Payment successful:', paymentId);
        // Handle successful payment
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
        // Handle payment error
      }}
      onCancel={() => {
        console.log('Payment cancelled');
        // Handle payment cancellation
      }}
    />
  );
}
```

### Invoice Generation

```tsx
import { createSubscriptionInvoice, generateInvoiceHTML } from '@/lib/invoice';

// Generate invoice for subscription payment
const invoice = createSubscriptionInvoice(
  {
    name: 'John Doe',
    email: 'john@example.com',
    address: {
      line1: '123 Main St',
      city: 'Wetaskiwin',
      state: 'Alberta',
      postalCode: 'T9A 0T2',
      country: 'Canada'
    }
  },
  'marketplace', // or 'business'
  'gold',
  'annual',
  199.99,
  'PAYID-12345' // Optional payment ID
);

// Generate HTML for email or display
const htmlInvoice = generateInvoiceHTML(invoice);
```

## API Reference

### Payment Analytics API

**GET** `/api/payments/analytics`
- **Query Parameters:**
  - `period`: `7d`, `30d`, `90d`, `1y` (default: `30d`)
  - `start`: Start date (ISO format)
  - `end`: End date (ISO format)

**Response:**
```json
{
  "success": true,
  "analytics": {
    "period": { "start": "2023-11-01", "end": "2023-12-01" },
    "payment": {
      "totalRevenue": 45230.50,
      "subscriptionRevenue": 38445.93,
      "oneTimePayments": 6784.57,
      "refunds": 904.61,
      "failedPayments": 2261.53,
      "currency": "CAD"
    },
    "subscription": {
      "activeSubscriptions": 156,
      "newSubscriptions": 23,
      "cancelledSubscriptions": 7,
      "churnRate": 4.49,
      "averageRevenuePerUser": 246.45,
      "subscriptionsByTier": {
        "silver": { "count": 62, "revenue": 9611.23 },
        "gold": { "count": 70, "revenue": 21145.26 },
        "platinum": { "count": 24, "revenue": 7689.44 }
      }
    },
    "trends": {
      "dailyRevenue": [...],
      "monthlyGrowth": 12.5,
      "subscriptionGrowth": 15.8
    }
  }
}
```

### Subscription Management API

**POST** `/api/payments/subscriptions` - Create subscription
**PUT** `/api/payments/subscriptions` - Update subscription
**GET** `/api/payments/subscriptions` - Get subscription info
**DELETE** `/api/payments/subscriptions` - Delete subscription (admin)

### Webhook API

**POST** `/api/payments/webhook` - PayPal webhook handler
**GET** `/api/payments/webhook` - Webhook verification

### Invoice API

**POST** `/api/payments/invoice` - Generate invoice
**GET** `/api/payments/invoice` - Retrieve invoice

## Production Deployment

### 1. Environment Setup

For production deployment, update environment variables:

```env
# Production PayPal Configuration
PAYPAL_CLIENT_ID=your_production_client_id
PAYPAL_CLIENT_SECRET=your_production_client_secret
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=your_production_webhook_id
PAYPAL_WEBHOOK_SECRET=your_production_webhook_secret
```

### 2. Webhook Configuration

1. **Update Webhook URL** to your production domain
2. **Enable Webhook Signature Verification** (automatically enabled in production)
3. **Test Webhook Delivery** using PayPal's webhook simulator

### 3. Security Checklist

- [ ] PayPal webhook signature verification enabled
- [ ] HTTPS enabled for all payment endpoints
- [ ] Environment variables secured (not in code)
- [ ] Payment logging configured
- [ ] Error monitoring setup (Sentry, LogRocket, etc.)
- [ ] Rate limiting configured for payment endpoints

## Testing Scenarios

### Comprehensive Test Suite

The integration includes 40+ automated tests covering:

1. **Payment Processing Tests**
   - Successful payment flow
   - Payment failures and error handling
   - Payment timeouts and retries
   - PayPal-specific error codes

2. **Subscription Lifecycle Tests**
   - Subscription creation
   - Upgrade/downgrade flows
   - Cancellation handling
   - Reactivation scenarios

3. **Webhook Integration Tests**
   - Signature verification
   - Event processing
   - Duplicate event handling
   - Rate limiting
   - Retry logic with exponential backoff

4. **Invoice Generation Tests**
   - Tax calculations (Alberta GST)
   - HTML generation
   - Edge cases and special characters
   - Currency formatting

### Manual Testing Checklist

- [ ] **Successful Payment Flow**
  - Complete marketplace subscription upgrade
  - Complete business subscription upgrade
  - Verify invoice generation
  - Confirm webhook processing

- [ ] **Payment Failure Scenarios**
  - Declined card handling
  - Insufficient funds
  - Expired payment method
  - Network timeouts

- [ ] **Subscription Management**
  - Upgrade between tiers
  - Downgrade restrictions
  - Cancellation flow
  - Reactivation process

- [ ] **Analytics and Reporting**
  - Payment metrics accuracy
  - Subscription analytics
  - Export functionality
  - Dashboard performance

## Troubleshooting

### Common Issues

**1. PayPal SDK not loading**
- Verify `PAYPAL_CLIENT_ID` is set
- Check network connectivity
- Ensure domain is whitelisted in PayPal app settings

**2. Webhook signature verification fails**
- Confirm `PAYPAL_WEBHOOK_SECRET` matches PayPal settings
- Check webhook URL configuration
- Verify HTTPS is enabled in production

**3. Payments not processing**
- Check PayPal app permissions
- Verify sandbox vs live environment settings
- Review PayPal developer console for errors

**4. Invoice generation errors**
- Confirm all required customer data is provided
- Check tax calculation logic
- Verify HTML template rendering

### Debug Mode

Enable debug logging:

```env
DEBUG_PAYPAL=true
NODE_ENV=development
```

### Support Resources

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Sandbox Testing Guide](https://developer.paypal.com/docs/api-basics/sandbox/)
- [Webhook Best Practices](https://developer.paypal.com/docs/api/webhooks/)
- [All Things Wetaskiwin Support](mailto:support@allthingswetaskiwin.com)

## Monitoring and Maintenance

### Key Metrics to Monitor

1. **Payment Success Rate** - Target: >95%
2. **Webhook Processing Time** - Target: <2 seconds
3. **Failed Payment Rate** - Target: <5%
4. **Subscription Churn Rate** - Target: <10% monthly

### Regular Maintenance

- Review payment logs monthly
- Update PayPal SDK dependencies quarterly
- Test webhook endpoints after deployments
- Monitor PayPal API changes and updates
- Review and update tax calculations annually

---

## Next Steps

1. **Set up PayPal Developer Account** and configure sandbox app
2. **Add environment variables** to your development environment
3. **Test payment flows** using sandbox accounts
4. **Configure webhooks** for real-time event processing
5. **Deploy to staging** environment for integration testing
6. **Go live** with production PayPal configuration

For additional support or questions, contact the development team or refer to the PayPal Developer documentation.