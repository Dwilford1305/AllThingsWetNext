import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/lib/invoice-service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice ID is required',
          code: 'MISSING_INVOICE_ID'
        },
        { status: 400 }
      );
    }

    // Get invoice data
    const invoice = await InvoiceService.getInvoice(id);

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Generate HTML invoice
    const invoiceHTML = InvoiceService.generateInvoiceHTML(invoice);

    // For now, return HTML. In production, you'd convert to PDF
    // Using libraries like Puppeteer, html-pdf, or similar
    return new NextResponse(invoiceHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.html"`
      }
    });

  } catch (error) {
    console.error('Invoice PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate invoice PDF',
        code: 'PDF_GENERATION_ERROR'
      },
      { status: 500 }
    );
  }
}