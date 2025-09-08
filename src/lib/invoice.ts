/**
 * Invoice Generation System
 * Generates invoices for subscription payments and one-time purchases
 */

import { generateId, formatDate, formatCurrency } from '@/lib/utils';

// Invoice data structure
export interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  customer: {
    name: string;
    email: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  business: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    email: string;
    phone?: string;
    taxId?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: {
    rate: number;
    amount: number;
  };
  total: number;
  currency: string;
  paymentDetails?: {
    paymentId: string;
    paymentMethod: string;
    paymentDate: Date;
    status: 'pending' | 'paid' | 'failed' | 'cancelled';
  };
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  subscriptionPeriod?: {
    start: Date;
    end: Date;
  };
}

// Default business information for invoices
const DEFAULT_BUSINESS_INFO = {
  name: 'All Things Wetaskiwin',
  address: {
    line1: 'Wetaskiwin Community Services',
    city: 'Wetaskiwin',
    state: 'Alberta',
    postalCode: 'T9A 0T2',
    country: 'Canada'
  },
  email: 'billing@allthingswetaskiwin.com',
  phone: '+1-780-352-3321'
};

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const randomId = generateId().toUpperCase().substring(0, 6);
  return `INV-${year}${month}-${randomId}`;
}

/**
 * Calculate tax for Alberta, Canada
 */
export function calculateAlbertaTax(subtotal: number): { rate: number; amount: number } {
  const GST_RATE = 0.05; // 5% GST (no PST in Alberta)
  const amount = subtotal * GST_RATE;
  
  return {
    rate: GST_RATE,
    amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
  };
}

/**
 * Create subscription invoice
 */
export function createSubscriptionInvoice(
  customer: InvoiceData['customer'],
  subscriptionType: 'marketplace' | 'business',
  tier: string,
  billingCycle: 'monthly' | 'annual',
  amount: number,
  paymentId?: string
): InvoiceData {
  
  // Calculate subscription period
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms
  
  const periodStart = new Date(issueDate);
  const periodEnd = new Date(periodStart);
  
  if (billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }
  
  // Create invoice item
  const typeLabel = subscriptionType === 'marketplace' ? 'Marketplace' : 'Business';
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const cycleLabel = billingCycle === 'monthly' ? 'Monthly' : 'Annual';
  
  const item: InvoiceItem = {
    description: `${typeLabel} ${tierLabel} Subscription - ${cycleLabel}`,
    quantity: 1,
    unitPrice: amount,
    total: amount,
    subscriptionPeriod: {
      start: periodStart,
      end: periodEnd
    }
  };
  
  // Calculate taxes
  const tax = calculateAlbertaTax(amount);
  const total = amount + tax.amount;
  
  const invoice: InvoiceData = {
    invoiceNumber: generateInvoiceNumber(),
    issueDate,
    dueDate,
    customer,
    business: DEFAULT_BUSINESS_INFO,
    items: [item],
    subtotal: amount,
    tax,
    total,
    currency: 'CAD',
    notes: `Thank you for subscribing to ${typeLabel} ${tierLabel}! Your subscription is active from ${formatDate(periodStart)} to ${formatDate(periodEnd)}.`
  };
  
  // Add payment details if provided
  if (paymentId) {
    invoice.paymentDetails = {
      paymentId,
      paymentMethod: 'PayPal',
      paymentDate: issueDate,
      status: 'paid'
    };
  }
  
  return invoice;
}

/**
 * Generate HTML invoice template
 */
export function generateInvoiceHTML(invoice: InvoiceData): string {
  const formatMoney = (amount: number) => formatCurrency(amount, invoice.currency);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-number {
            font-size: 18px;
            font-weight: bold;
            color: #0066cc;
        }
        .bill-to {
            margin: 30px 0;
        }
        .bill-to h3 {
            margin-bottom: 10px;
            color: #333;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
        }
        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .items-table .amount {
            text-align: right;
        }
        .totals {
            float: right;
            width: 300px;
            margin: 20px 0;
        }
        .totals table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals td {
            padding: 8px 12px;
            border-bottom: 1px solid #ddd;
        }
        .totals .total-row {
            font-weight: bold;
            font-size: 16px;
            background-color: #f8f9fa;
        }
        .payment-info {
            clear: both;
            margin: 40px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .paid-stamp {
            color: #28a745;
            font-weight: bold;
            font-size: 18px;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="logo">${invoice.business.name}</div>
            <p>
                ${invoice.business.address.line1}<br>
                ${invoice.business.address.line2 ? invoice.business.address.line2 + '<br>' : ''}
                ${invoice.business.address.city}, ${invoice.business.address.state} ${invoice.business.address.postalCode}<br>
                ${invoice.business.address.country}
            </p>
            <p>
                Email: ${invoice.business.email}<br>
                ${invoice.business.phone ? `Phone: ${invoice.business.phone}` : ''}
            </p>
        </div>
        <div class="invoice-info">
            <div class="invoice-number">INVOICE</div>
            <div class="invoice-number">${invoice.invoiceNumber}</div>
            <p>
                <strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}<br>
                <strong>Due Date:</strong> ${formatDate(invoice.dueDate)}
            </p>
            ${invoice.paymentDetails?.status === 'paid' ? '<div class="paid-stamp">PAID</div>' : ''}
        </div>
    </div>

    <div class="bill-to">
        <h3>Bill To:</h3>
        <p>
            <strong>${invoice.customer.name}</strong><br>
            ${invoice.customer.email}<br>
            ${invoice.customer.address ? `
                ${invoice.customer.address.line1}<br>
                ${invoice.customer.address.line2 ? invoice.customer.address.line2 + '<br>' : ''}
                ${invoice.customer.address.city}, ${invoice.customer.address.state} ${invoice.customer.address.postalCode}<br>
                ${invoice.customer.address.country}
            ` : ''}
        </p>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Period</th>
                <th class="amount">Qty</th>
                <th class="amount">Unit Price</th>
                <th class="amount">Total</th>
            </tr>
        </thead>
        <tbody>
            ${invoice.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td>
                        ${item.subscriptionPeriod ? 
                          `${formatDate(item.subscriptionPeriod.start)} - ${formatDate(item.subscriptionPeriod.end)}` 
                          : 'N/A'
                        }
                    </td>
                    <td class="amount">${item.quantity}</td>
                    <td class="amount">${formatMoney(item.unitPrice)}</td>
                    <td class="amount">${formatMoney(item.total)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal:</td>
                <td class="amount">${formatMoney(invoice.subtotal)}</td>
            </tr>
            <tr>
                <td>GST (${(invoice.tax.rate * 100).toFixed(1)}%):</td>
                <td class="amount">${formatMoney(invoice.tax.amount)}</td>
            </tr>
            <tr class="total-row">
                <td>Total:</td>
                <td class="amount">${formatMoney(invoice.total)}</td>
            </tr>
        </table>
    </div>

    ${invoice.paymentDetails ? `
        <div class="payment-info">
            <h4>Payment Information</h4>
            <p>
                <strong>Payment ID:</strong> ${invoice.paymentDetails.paymentId}<br>
                <strong>Payment Method:</strong> ${invoice.paymentDetails.paymentMethod}<br>
                <strong>Payment Date:</strong> ${formatDate(invoice.paymentDetails.paymentDate)}<br>
                <strong>Status:</strong> ${invoice.paymentDetails.status.toUpperCase()}
            </p>
        </div>
    ` : ''}

    ${invoice.notes ? `
        <div class="payment-info">
            <h4>Notes</h4>
            <p>${invoice.notes}</p>
        </div>
    ` : ''}

    <div class="footer">
        <p>Thank you for your business!</p>
        <p>This invoice was generated automatically by All Things Wetaskiwin platform.</p>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Save invoice to database
 */
export async function saveInvoice(invoice: InvoiceData): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    // TODO: Implement database save logic
    // This would save the invoice to MongoDB
    
    console.log('Invoice generated:', {
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer.email,
      total: invoice.total,
      currency: invoice.currency
    });
    
    return {
      success: true,
      invoiceId: invoice.invoiceNumber
    };
    
  } catch (error) {
    console.error('Error saving invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}