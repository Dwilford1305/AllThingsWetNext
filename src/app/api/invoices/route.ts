import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService, CreateInvoiceRequest } from '@/lib/invoice-service';

// Create new invoice
export async function POST(request: NextRequest) {
  try {
    const body: CreateInvoiceRequest = await request.json();

    // Validate required fields
    const requiredFields = ['paymentId', 'orderId', 'captureId', 'customerInfo', 'subscriptionInfo', 'amount', 'currency'];
    const missingFields = requiredFields.filter(field => !body[field as keyof CreateInvoiceRequest]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate customer info
    if (!body.customerInfo.name || !body.customerInfo.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer name and email are required',
          code: 'INVALID_CUSTOMER_INFO'
        },
        { status: 400 }
      );
    }

    // Validate subscription info
    if (!body.subscriptionInfo.type || !body.subscriptionInfo.tier || !body.subscriptionInfo.billingCycle) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription type, tier, and billing cycle are required',
          code: 'INVALID_SUBSCRIPTION_INFO'
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount. Must be a positive number.',
          code: 'INVALID_AMOUNT'
        },
        { status: 400 }
      );
    }

    // Create invoice
    const invoice = await InvoiceService.createInvoice(body);

    console.log('✅ Invoice created successfully:', {
      invoiceNumber: invoice.invoiceNumber,
      paymentId: invoice.paymentId,
      amount: `$${invoice.totals.total} ${invoice.totals.currency}`,
      customer: invoice.customerInfo.email
    });

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totals.total,
        currency: invoice.totals.currency,
        status: invoice.payment.status,
        createdAt: invoice.createdAt
      }
    });

  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice',
        code: 'INVOICE_CREATION_ERROR'
      },
      { status: 500 }
    );
  }
}

// List invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const businessId = searchParams.get('businessId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit must be between 1 and 100',
          code: 'INVALID_LIMIT'
        },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Offset must be non-negative',
          code: 'INVALID_OFFSET'
        },
        { status: 400 }
      );
    }

    // At least one filter must be provided
    if (!userId && !businessId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either userId or businessId must be provided',
          code: 'MISSING_FILTER'
        },
        { status: 400 }
      );
    }

    const invoices = await InvoiceService.listInvoices({
      userId: userId || undefined,
      businessId: businessId || undefined,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        limit,
        offset,
        total: invoices.length // In production, get actual total count
      }
    });

  } catch (error) {
    console.error('Invoice listing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve invoices',
        code: 'INVOICE_RETRIEVAL_ERROR'
      },
      { status: 500 }
    );
  }
}