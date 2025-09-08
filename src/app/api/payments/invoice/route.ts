import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionInvoice, generateInvoiceHTML, saveInvoice } from '@/lib/invoice';
import { AuthService } from '@/lib/auth';
import { z } from 'zod';

// Request validation schema
const CreateInvoiceSchema = z.object({
  subscriptionType: z.enum(['marketplace', 'business']),
  tier: z.enum(['silver', 'gold', 'platinum']),
  billingCycle: z.enum(['monthly', 'annual']),
  amount: z.number().positive(),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    address: z.object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1)
    }).optional()
  }),
  paymentId: z.string().optional()
});

/**
 * POST /api/payments/invoice
 * Generate and save an invoice for a subscription payment
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token (simplified check - in production you'd verify with AuthService)
    // For now, just check that a token is present
    if (token.length < 10) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = CreateInvoiceSchema.parse(body);

    // Generate invoice
    const invoice = createSubscriptionInvoice(
      validatedData.customer,
      validatedData.subscriptionType,
      validatedData.tier,
      validatedData.billingCycle,
      validatedData.amount,
      validatedData.paymentId
    );

    // Save invoice to database
    const saveResult = await saveInvoice(invoice);
    
    if (!saveResult.success) {
      return NextResponse.json(
        { error: 'Failed to save invoice', details: saveResult.error },
        { status: 500 }
      );
    }

    // Generate HTML for preview/email
    const htmlContent = generateInvoiceHTML(invoice);

    return NextResponse.json({
      success: true,
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.paymentDetails?.status || 'pending'
      },
      htmlContent
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Invoice generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/invoice?invoiceNumber=INV-XXXX
 * Retrieve an existing invoice
 */
export async function GET(request: NextRequest) {
  try {
    // Get authorization token  
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token.length < 10) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const invoiceNumber = searchParams.get('invoiceNumber');
    const format = searchParams.get('format') || 'json'; // json or html

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: 'Invoice number is required' },
        { status: 400 }
      );
    }

    // TODO: Implement database retrieval
    // For now, return a placeholder response
    
    if (format === 'html') {
      // Return HTML content for viewing/printing
      return new Response(
        '<h1>Invoice not found</h1><p>This feature will be implemented when database is connected.</p>',
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    return NextResponse.json(
      { 
        error: 'Invoice not found',
        message: 'Database integration pending'
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('Invoice retrieval error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve invoice',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}