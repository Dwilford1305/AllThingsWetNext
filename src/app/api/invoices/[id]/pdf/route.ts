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

    // Get format parameter (pdf, html)
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

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

    if (format === 'html') {
      // Return HTML version for preview
      const invoiceHTML = InvoiceService.generateInvoiceHTML(invoice);
      return new NextResponse(invoiceHTML, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.html"`
        }
      });
    }

    // Generate PDF invoice
    const pdfBuffer = await InvoiceService.generateInvoicePDF(invoice);

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer);
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
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