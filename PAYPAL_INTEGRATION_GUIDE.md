# PayPal Payment Integration - Setup Guide

This guide covers the complete setup and configuration of the PayPal payment integration for AllThingsWetaskiwin.

## Overview

The PayPal integration provides:
- ✅ Real PayPal SDK integration (replacing mock implementation)
- ✅ Comprehensive error handling and retry logic
- ✅ Professional invoice generation system
- ✅ Payment webhook handling for subscription events
- ✅ Payment analytics and reporting dashboard
- ✅ Edge case handling for all payment scenarios

## Prerequisites

### 1. PayPal Developer Account
1. Visit [PayPal Developer Portal](https://developer.paypal.com/)
2. Sign in or create a developer account
3. Create a new application for sandbox testing
4. Note down your Client ID and Client Secret

### 2. Environment Variables

Add these variables to your `.env.local` file:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_WEBHOOK_ID=your_webhook_id_here

# Required for payment processing
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string
```

### 3. Dependencies

The following packages are required (already installed):
- `@paypal/react-paypal-js` - PayPal React components
- `@paypal/paypal-js` - PayPal JavaScript SDK
- `jspdf` - PDF generation for invoices
- `html2canvas` - HTML to canvas conversion

## Integration Components

### 1. PayPal Configuration Service (`src/lib/paypal-config.ts`)

Handles PayPal SDK configuration and validation:
- Environment-specific settings (sandbox/production)
- Subscription tier pricing configuration
- Error handling utilities
- Currency and amount validation

### 2. Payment Service (`src/lib/payment-service.ts`)

Provides payment processing with error handling:
- Automatic retry logic with exponential backoff
- Network error recovery
- Payment validation
- Error classification (retryable vs non-retryable)

### 3. Invoice Generation (`src/lib/invoice-service.ts`)

Professional invoice system:
- HTML invoice templates
- PDF generation capabilities
- Invoice data storage
- Customer and subscription details

### 4. Payment Analytics (`src/lib/payment-analytics.ts`)

Analytics and reporting:
- Revenue and subscription metrics
- Payment trends analysis
- Tier performance tracking
- Failure analysis and reporting
- CSV export functionality

## API Endpoints

### PayPal Payment APIs

#### Create Order
```
POST /api/paypal/create-order
```
Body:
```json
{
  "amount": "199.99",
  "currency": "CAD",
  "description": "Business Subscription - Gold Annual"
}
```

#### Capture Payment
```
POST /api/paypal/capture-order
```
Body:
```json
{
  "orderId": "ORDER_123456789"
}
```

#### Webhook Handler
```
POST /api/paypal/webhook
```
Handles PayPal webhook events for:
- Payment completion
- Payment failures
- Subscription lifecycle events
- Refunds and chargebacks

### Invoice APIs

#### Create Invoice
```
POST /api/invoices
```

#### Get Invoice PDF
```
GET /api/invoices/{id}/pdf
```

#### List Invoices
```
GET /api/invoices?userId=123&limit=10
```

### Analytics APIs

#### Get Payment Analytics
```
GET /api/analytics/payments?type=analytics&startDate=2024-01-01&endDate=2024-01-31
```

#### Get Payment Trends
```
GET /api/analytics/payments?type=trends&days=30&metric=revenue
```

#### Export Payment Data
```
GET /api/analytics/payments?type=export&exportType=transactions&startDate=2024-01-01&endDate=2024-01-31
```

## Frontend Integration

### PayPal Provider Setup

Wrap your app with the PayPal provider:

```tsx
import { PayPalProvider } from '@/components/PayPalProvider';

export default function App({ children }) {
  return (
    <PayPalProvider>
      {children}
    </PayPalProvider>
  );
}
```

### PayPal Button Component

Use the enhanced PayPal button:

```tsx
import { PayPalButton } from '@/components/PayPalButton';

function SubscriptionUpgrade() {
  const handlePaymentSuccess = (paymentId: string, details: any) => {
    console.log('Payment successful:', paymentId);
    // Handle successful payment
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    // Handle payment error
  };

  return (
    <PayPalButton
      amount={399.99}
      currency="CAD"
      description="Business Subscription - Gold Annual"
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
    />
  );
}
```

## Testing

### Sandbox Testing

1. Use PayPal sandbox credentials in development
2. Test with sandbox test accounts
3. Verify webhook handling with PayPal webhook simulator

### Test Scenarios Covered

#### Payment Processing
- ✅ Successful payments
- ✅ Network failures with retry
- ✅ Payment declines
- ✅ Rate limiting
- ✅ Authentication errors
- ✅ Server errors

#### Edge Cases
- ✅ Invalid amounts (too small/large)
- ✅ Unsupported currencies
- ✅ Expired sessions
- ✅ Duplicate payments
- ✅ Order not found
- ✅ Already captured orders

#### Subscription Flows
- ✅ Subscription upgrades
- ✅ Subscription downgrades
- ✅ Subscription cancellations
- ✅ Payment failures
- ✅ Renewal processing

### Running Tests

```bash
# Run all PayPal tests
npm test paypal

# Run edge case tests
npm test tests/paypal-edge-cases.test.ts

# Run complete integration test
npm test tests/complete-paypal-integration.test.ts
```

## Webhook Configuration

### PayPal Webhook Setup

1. In PayPal Developer Portal, go to your app
2. Navigate to Webhooks section
3. Add webhook URL: `https://yourdomain.com/api/paypal/webhook`
4. Select events to listen for:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `CHECKOUT.ORDER.COMPLETED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`

### Webhook Security

- Webhook signature verification implemented
- Environment-specific validation
- Event type filtering
- Proper error handling and logging

## Error Handling

### Payment Errors

The system handles various error scenarios:

1. **Network Errors** - Automatic retry with exponential backoff
2. **Authentication Errors** - Clear error messages and retry logic
3. **Payment Declined** - User-friendly error messages
4. **Rate Limiting** - Automatic retry with delays
5. **Server Errors** - Graceful degradation and retry

### Error Logging

All payment errors are logged with:
- Error type and code
- Request/response details
- User context
- Retry attempts
- Resolution status

## Analytics Dashboard

### Key Metrics Tracked

- Total revenue and transaction count
- Average transaction value
- Subscription growth and churn rates
- Tier performance analysis
- Payment failure rates and reasons
- Conversion rates

### Reporting Features

- Real-time payment metrics
- Historical trend analysis
- CSV export functionality
- Custom date range reports
- Tier comparison reports

## Production Deployment

### Pre-deployment Checklist

- [ ] PayPal production credentials configured
- [ ] Webhook URLs updated to production
- [ ] SSL certificate installed
- [ ] Payment flow testing completed
- [ ] Error monitoring configured
- [ ] Analytics dashboard tested

### Production Environment Variables

```env
PAYPAL_CLIENT_ID=your_production_client_id
PAYPAL_CLIENT_SECRET=your_production_client_secret
PAYPAL_ENVIRONMENT=production
PAYPAL_WEBHOOK_ID=your_production_webhook_id
```

### Monitoring

Monitor these key areas in production:
- Payment success/failure rates
- Webhook delivery status
- API response times
- Error frequencies
- Invoice generation success

## Troubleshooting

### Common Issues

1. **PayPal Button Not Loading**
   - Check client ID configuration
   - Verify environment setting
   - Check browser console for errors

2. **Payment Failures**
   - Review PayPal sandbox test accounts
   - Check webhook configuration
   - Verify API credentials

3. **Invoice Generation Issues**
   - Check customer data completeness
   - Verify subscription information
   - Review PDF generation logs

### Debug Mode

Enable debug logging in development:
```env
NODE_ENV=development
```

This enables detailed PayPal SDK logging and error details.

## Support

For issues related to PayPal integration:
1. Check PayPal Developer documentation
2. Review application logs
3. Test in PayPal sandbox environment
4. Contact PayPal developer support if needed

---

**Integration Status**: ✅ Complete (100%)
- Real PayPal SDK integration
- Comprehensive error handling
- Invoice generation system
- Webhook processing
- Payment analytics
- Edge case handling
- Production-ready testing

The PayPal payment integration is now fully functional and production-ready.