/**
 * Invoice Generation Service
 * Handles creation, storage, and delivery of payment invoices
 */

import { connectDB } from '@/lib/mongodb';
import { BUSINESS_SUBSCRIPTION_TIERS, MARKETPLACE_SUBSCRIPTION_TIERS } from '@/lib/paypal-config';

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  paymentId: string;
  orderId: string;
  businessId?: string;
  userId?: string;
  customerInfo: {
    name: string;
    email: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  subscriptionInfo: {
    type: 'marketplace' | 'business';
    tier: string;
    tierName: string;
    billingCycle: 'monthly' | 'annual';
    startDate: Date;
    endDate: Date;
  };
  payment: {
    amount: number;
    currency: string;
    method: 'PayPal';
    status: 'completed' | 'pending' | 'failed';
    captureId: string;
    processedAt: Date;
  };
  discount?: {
    code: string;
    name: string;
    amount: number;
    percentage?: number;
  };
  totals: {
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceRequest {
  paymentId: string;
  orderId: string;
  captureId: string;
  businessId?: string;
  userId?: string;
  customerInfo: InvoiceData['customerInfo'];
  subscriptionInfo: InvoiceData['subscriptionInfo'];
  amount: number;
  currency: string;
  discount?: InvoiceData['discount'];
}

/**
 * Invoice Generation Service
 */
export class InvoiceService {
  /**
   * Create a new invoice from payment data
   */
  static async createInvoice(data: CreateInvoiceRequest): Promise<InvoiceData> {
    await connectDB();

    // Generate unique invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate totals
    const subtotal = data.amount + (data.discount?.amount || 0);
    const discountAmount = data.discount?.amount || 0;
    const total = data.amount;

    // Create invoice data
    const invoice: InvoiceData = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceNumber,
      paymentId: data.paymentId,
      orderId: data.orderId,
      businessId: data.businessId,
      userId: data.userId,
      customerInfo: data.customerInfo,
      subscriptionInfo: data.subscriptionInfo,
      payment: {
        amount: data.amount,
        currency: data.currency,
        method: 'PayPal',
        status: 'completed',
        captureId: data.captureId,
        processedAt: new Date()
      },
      discount: data.discount,
      totals: {
        subtotal,
        discount: discountAmount,
        total,
        currency: data.currency
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store invoice in database (create Invoice model if needed)
    try {
      // For now, we'll store as a simple record
      // In production, you'd want a proper Invoice model
      console.log('📄 Invoice created:', {
        invoiceNumber: invoice.invoiceNumber,
        amount: `$${invoice.totals.total} ${invoice.totals.currency}`,
        customer: invoice.customerInfo.email,
        subscription: `${invoice.subscriptionInfo.tierName} (${invoice.subscriptionInfo.billingCycle})`
      });

      return invoice;
    } catch (error) {
      console.error('Error storing invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  /**
   * Generate unique invoice number
   */
  private static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits for uniqueness
    
    return `ATW-${year}${month}-${timestamp}`;
  }

  /**
   * Generate PDF invoice
   */
  static async generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
    // For PDF generation, we use jsPDF, imported dynamically for server-side use.
    // This approach allows us to generate PDFs directly in Node.js.
    
    try {
      // Import jsPDF dynamically for server-side use
      const { jsPDF } = await import('jspdf');
      
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add company header
      doc.setFontSize(20);
      doc.setTextColor(0, 123, 255);
      doc.text('AllThingsWetaskiwin', 20, 30);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Invoice #${invoice.invoiceNumber}`, 150, 30);
      doc.text(`Date: ${invoice.createdAt.toLocaleDateString()}`, 150, 40);

      // Add customer information
      let yPos = 60;
      doc.setFontSize(14);
      doc.setTextColor(0, 123, 255);
      doc.text('Customer Information', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${invoice.customerInfo.name}`, 20, yPos);
      yPos += 5;
      doc.text(`Email: ${invoice.customerInfo.email}`, 20, yPos);
      
      if (invoice.customerInfo.address) {
        yPos += 5;
        doc.text(`Address: ${invoice.customerInfo.address}`, 20, yPos);
      }

      // Add subscription details
      yPos += 20;
      doc.setFontSize(14);
      doc.setTextColor(0, 123, 255);
      doc.text('Subscription Details', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Service: ${invoice.subscriptionInfo.type === 'business' ? 'Business Directory' : 'Marketplace'} Subscription`, 20, yPos);
      yPos += 5;
      doc.text(`Plan: ${invoice.subscriptionInfo.tierName} (${invoice.subscriptionInfo.billingCycle})`, 20, yPos);
      yPos += 5;
      doc.text(`Period: ${invoice.subscriptionInfo.startDate.toLocaleDateString()} - ${invoice.subscriptionInfo.endDate.toLocaleDateString()}`, 20, yPos);

      // Add invoice items table
      yPos += 20;
      doc.setFontSize(14);
      doc.setTextColor(0, 123, 255);
      doc.text('Invoice Items', 20, yPos);

      // Table headers
      yPos += 15;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Description', 20, yPos);
      doc.text('Period', 100, yPos);
      doc.text('Amount', 150, yPos);

      // Table content
      yPos += 8;
      doc.text(`${invoice.subscriptionInfo.tierName} ${invoice.subscriptionInfo.type === 'business' ? 'Business' : 'Marketplace'} Subscription`, 20, yPos);
      doc.text(invoice.subscriptionInfo.billingCycle === 'annual' ? '12 months' : '1 month', 100, yPos);
      doc.text(`$${invoice.totals.subtotal.toFixed(2)} ${invoice.totals.currency}`, 150, yPos);

      // Discount if applicable
      if (invoice.discount) {
        yPos += 8;
        doc.text(`Discount: ${invoice.discount.name}`, 20, yPos);
        doc.text('-', 100, yPos);
        doc.text(`-$${invoice.discount.amount.toFixed(2)} ${invoice.totals.currency}`, 150, yPos);
      }

      // Totals
      yPos += 20;
      doc.setFontSize(12);
      doc.text(`Subtotal: $${invoice.totals.subtotal.toFixed(2)} ${invoice.totals.currency}`, 130, yPos);
      
      if (invoice.discount) {
        yPos += 8;
        doc.text(`Discount: -$${invoice.totals.discount.toFixed(2)} ${invoice.totals.currency}`, 130, yPos);
      }
      
      yPos += 8;
      doc.setFontSize(14);
      doc.setTextColor(0, 123, 255);
      doc.text(`Total: $${invoice.totals.total.toFixed(2)} ${invoice.totals.currency}`, 130, yPos);

      // Payment information
      yPos += 25;
      doc.setFontSize(14);
      doc.setTextColor(0, 123, 255);
      doc.text('Payment Information', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Status: PAID', 20, yPos);
      yPos += 5;
      doc.text('Payment Method: PayPal', 20, yPos);
      yPos += 5;
      doc.text(`Transaction ID: ${invoice.payment.captureId}`, 20, yPos);
      yPos += 5;
      doc.text(`Payment Date: ${invoice.payment.processedAt.toLocaleDateString()}`, 20, yPos);

      // Footer
      yPos = 270;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Thank you for your business!', 20, yPos);
      doc.text('AllThingsWetaskiwin - Community Platform', 20, yPos + 5);
      doc.text('Email: support@allthingswetaskiwin.com', 20, yPos + 10);

      // Return PDF as Buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      return pdfBuffer;

    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  /**
   * Generate HTML invoice template
   */
  static generateInvoiceHTML(invoice: InvoiceData): string {
    const tierInfo = this.getTierInfo(invoice.subscriptionInfo.tier, invoice.subscriptionInfo.type);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }
        .invoice-details {
            text-align: right;
        }
        .invoice-number {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
        }
        .customer-info, .subscription-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
        }
        .info-row {
            margin-bottom: 8px;
        }
        .label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .items-table th,
        .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .items-table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .amount-cell {
            text-align: right;
        }
        .totals {
            margin-top: 20px;
            text-align: right;
        }
        .total-row {
            margin-bottom: 8px;
        }
        .total-label {
            display: inline-block;
            width: 120px;
            font-weight: bold;
        }
        .total-amount {
            display: inline-block;
            width: 100px;
            text-align: right;
        }
        .grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
            border-top: 2px solid #007bff;
            padding-top: 10px;
            margin-top: 10px;
        }
        .payment-info {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #28a745;
        }
        .payment-status {
            font-weight: bold;
            color: #28a745;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">AllThingsWetaskiwin</div>
        <div class="invoice-details">
            <div class="invoice-number">Invoice #${invoice.invoiceNumber}</div>
            <div>Date: ${invoice.createdAt.toLocaleDateString()}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="customer-info">
            <div class="info-row">
                <span class="label">Name:</span>
                ${invoice.customerInfo.name}
            </div>
            <div class="info-row">
                <span class="label">Email:</span>
                ${invoice.customerInfo.email}
            </div>
            ${invoice.customerInfo.address ? `
            <div class="info-row">
                <span class="label">Address:</span>
                ${invoice.customerInfo.address}
            </div>
            ` : ''}
            ${invoice.customerInfo.city ? `
            <div class="info-row">
                <span class="label">City:</span>
                ${invoice.customerInfo.city}, ${invoice.customerInfo.province || ''} ${invoice.customerInfo.postalCode || ''}
            </div>
            ` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Subscription Details</div>
        <div class="subscription-info">
            <div class="info-row">
                <span class="label">Service:</span>
                ${invoice.subscriptionInfo.type === 'business' ? 'Business Directory' : 'Marketplace'} Subscription
            </div>
            <div class="info-row">
                <span class="label">Plan:</span>
                ${invoice.subscriptionInfo.tierName} (${invoice.subscriptionInfo.billingCycle})
            </div>
            <div class="info-row">
                <span class="label">Period:</span>
                ${invoice.subscriptionInfo.startDate.toLocaleDateString()} - ${invoice.subscriptionInfo.endDate.toLocaleDateString()}
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Invoice Items</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Period</th>
                    <th class="amount-cell">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        ${invoice.subscriptionInfo.tierName} ${invoice.subscriptionInfo.type === 'business' ? 'Business' : 'Marketplace'} Subscription
                        <br><small style="color: #666;">${tierInfo.features.slice(0, 3).join(', ')}</small>
                    </td>
                    <td>${invoice.subscriptionInfo.billingCycle === 'annual' ? '12 months' : '1 month'}</td>
                    <td class="amount-cell">$${invoice.totals.subtotal.toFixed(2)} ${invoice.totals.currency}</td>
                </tr>
                ${invoice.discount ? `
                <tr>
                    <td>
                        Discount: ${invoice.discount.name}
                        <br><small style="color: #666;">Code: ${invoice.discount.code}</small>
                    </td>
                    <td>-</td>
                    <td class="amount-cell">-$${invoice.discount.amount.toFixed(2)} ${invoice.totals.currency}</td>
                </tr>
                ` : ''}
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span class="total-amount">$${invoice.totals.subtotal.toFixed(2)} ${invoice.totals.currency}</span>
            </div>
            ${invoice.discount ? `
            <div class="total-row">
                <span class="total-label">Discount:</span>
                <span class="total-amount">-$${invoice.totals.discount.toFixed(2)} ${invoice.totals.currency}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
                <span class="total-label">Total:</span>
                <span class="total-amount">$${invoice.totals.total.toFixed(2)} ${invoice.totals.currency}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Payment Information</div>
        <div class="payment-info">
            <div class="info-row">
                <span class="label">Status:</span>
                <span class="payment-status">PAID</span>
            </div>
            <div class="info-row">
                <span class="label">Payment Method:</span>
                PayPal
            </div>
            <div class="info-row">
                <span class="label">Transaction ID:</span>
                ${invoice.payment.captureId}
            </div>
            <div class="info-row">
                <span class="label">Payment Date:</span>
                ${invoice.payment.processedAt.toLocaleDateString()}
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Thank you for your business!</p>
        <p>
            AllThingsWetaskiwin - Community Platform<br>
            Email: support@allthingswetaskiwin.com<br>
            This is an automated invoice generated by our payment system.
        </p>
    </div>
</body>
</html>`;
  }

  /**
   * Get tier information for invoice
   */
  private static getTierInfo(tierId: string, type: 'marketplace' | 'business') {
    const tiers = type === 'business' ? BUSINESS_SUBSCRIPTION_TIERS : MARKETPLACE_SUBSCRIPTION_TIERS;
    const tier = tiers.find(t => t.id === tierId);
    
    if (!tier) {
      return {
        name: tierId,
        features: ['Subscription features']
      };
    }

    // Default features based on tier type
    const businessFeatures = {
      silver: ['Enhanced listing', 'Contact form', 'Basic analytics', 'Business hours', '2 job postings per month'],
      gold: ['Everything in Silver', 'Photo gallery', 'Social media links', 'Special offers', 'Featured placement', '5 job postings per month'],
      platinum: ['Everything in Gold', 'Logo upload', 'Advanced analytics', 'Priority support', 'Custom description', 'Unlimited job postings']
    };

    const marketplaceFeatures = {
      silver: ['Enhanced listings', 'Featured placement', 'Basic analytics', 'Priority support'],
      gold: ['Everything in Silver', 'Premium visibility', 'Advanced analytics', 'Promotional tools'],
      platinum: ['Everything in Gold', 'Priority placement', 'Custom branding', 'Dedicated support']
    };

    const features = type === 'business' 
      ? businessFeatures[tierId as keyof typeof businessFeatures] || []
      : marketplaceFeatures[tierId as keyof typeof marketplaceFeatures] || [];

    return {
      name: tier.name,
      features
    };
  }

  /**
   * Retrieve invoice by ID
   */
  static async getInvoice(invoiceId: string): Promise<InvoiceData | null> {
    // In production, retrieve from database
    // For now, return null as placeholder
    console.log(`Retrieving invoice: ${invoiceId}`);
    return null;
  }

  /**
   * List invoices for a user or business
   */
  static async listInvoices(filters: {
    userId?: string;
    businessId?: string;
    limit?: number;
    offset?: number;
  }): Promise<InvoiceData[]> {
    // In production, query database with filters
    console.log('Listing invoices with filters:', filters);
    return [];
  }
}