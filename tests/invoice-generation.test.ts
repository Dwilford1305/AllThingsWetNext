import { describe, it, expect } from '@jest/globals';
import { 
  createSubscriptionInvoice, 
  generateInvoiceHTML, 
  generateInvoiceNumber,
  calculateAlbertaTax
} from '@/lib/invoice';
import { 
  calculateSubscriptionPrice,
  calculateAnnualSavings,
  SUBSCRIPTION_TIERS 
} from '@/lib/paypal';

describe('Invoice Generation System', () => {
  describe('Invoice utilities', () => {
    it('should generate valid invoice numbers', () => {
      const invoice1 = generateInvoiceNumber();
      const invoice2 = generateInvoiceNumber();
      
      expect(invoice1).toMatch(/^INV-\d{6}-[A-Z0-9]{6}$/);
      expect(invoice2).toMatch(/^INV-\d{6}-[A-Z0-9]{6}$/);
      expect(invoice1).not.toBe(invoice2); // Should be unique
    });

    it('should calculate Alberta tax correctly', () => {
      const testAmounts = [100, 19.99, 199.99, 799.99];
      
      testAmounts.forEach(amount => {
        const tax = calculateAlbertaTax(amount);
        
        expect(tax.rate).toBe(0.05); // 5% GST
        expect(tax.amount).toBeCloseTo(amount * 0.05, 2);
        expect(tax.amount).toBe(Math.round(amount * 0.05 * 100) / 100); // Properly rounded
      });
    });

    it('should calculate subscription pricing correctly', () => {
      // Test marketplace pricing
      expect(calculateSubscriptionPrice('marketplace', 'silver', 'monthly')).toBe(9.99);
      expect(calculateSubscriptionPrice('marketplace', 'gold', 'annual')).toBe(199.99);
      
      // Test business pricing
      expect(calculateSubscriptionPrice('business', 'platinum', 'monthly')).toBe(79.99);
      expect(calculateSubscriptionPrice('business', 'silver', 'annual')).toBe(199.99);
    });

    it('should calculate annual savings correctly', () => {
      const marketplaceGoldSavings = calculateAnnualSavings('marketplace', 'gold');
      const monthlyTotal = 19.99 * 12; // 239.88
      const annualPrice = 199.99;
      const expectedSavings = monthlyTotal - annualPrice; // 39.89
      const expectedPercentage = Math.round((expectedSavings / monthlyTotal) * 100); // 17%
      
      expect(marketplaceGoldSavings.savings).toBeCloseTo(expectedSavings, 2);
      expect(marketplaceGoldSavings.percentage).toBe(expectedPercentage);
    });
  });

  describe('Subscription invoice creation', () => {
    const mockCustomer = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      address: {
        line1: '123 Main St',
        city: 'Wetaskiwin',
        state: 'Alberta',
        postalCode: 'T9A 0T2',
        country: 'Canada'
      }
    };

    it('should create marketplace subscription invoice', () => {
      const invoice = createSubscriptionInvoice(
        mockCustomer,
        'marketplace',
        'gold',
        'annual',
        199.99,
        'PAYID-TEST-12345'
      );

      expect(invoice.invoiceNumber).toMatch(/^INV-\d{6}-[A-Z0-9]{6}$/);
      expect(invoice.customer.name).toBe('John Doe');
      expect(invoice.customer.email).toBe('john.doe@example.com');
      expect(invoice.subtotal).toBe(199.99);
      expect(invoice.tax.rate).toBe(0.05);
      expect(invoice.tax.amount).toBeCloseTo(10.00, 2); // 5% of 199.99 = 9.9995, rounded to 10.00
      expect(invoice.total).toBeCloseTo(209.99, 2);
      expect(invoice.currency).toBe('CAD');
      expect(invoice.paymentDetails?.paymentId).toBe('PAYID-TEST-12345');
      expect(invoice.paymentDetails?.status).toBe('paid');
      
      // Check item details
      expect(invoice.items).toHaveLength(1);
      expect(invoice.items[0].description).toBe('Marketplace Gold Subscription - Annual');
      expect(invoice.items[0].quantity).toBe(1);
      expect(invoice.items[0].unitPrice).toBe(199.99);
      expect(invoice.items[0].total).toBe(199.99);
      expect(invoice.items[0].subscriptionPeriod).toBeDefined();
    });

    it('should create business subscription invoice', () => {
      const invoice = createSubscriptionInvoice(
        mockCustomer,
        'business',
        'platinum',
        'monthly',
        79.99
      );

      expect(invoice.subtotal).toBe(79.99);
      expect(invoice.tax.amount).toBeCloseTo(4.00, 2);
      expect(invoice.total).toBeCloseTo(83.99, 2);
      expect(invoice.items[0].description).toBe('Business Platinum Subscription - Monthly');
      expect(invoice.paymentDetails).toBeUndefined(); // No payment ID provided
    });

    it('should handle subscription periods correctly', () => {
      const monthlyInvoice = createSubscriptionInvoice(
        mockCustomer,
        'marketplace',
        'silver',
        'monthly',
        9.99
      );

      const annualInvoice = createSubscriptionInvoice(
        mockCustomer,
        'marketplace',
        'silver',
        'annual',
        99.99
      );

      const monthlyPeriod = monthlyInvoice.items[0].subscriptionPeriod!;
      const annualPeriod = annualInvoice.items[0].subscriptionPeriod!;

      // Monthly period should be ~30 days
      const monthlyDays = Math.ceil((monthlyPeriod.end.getTime() - monthlyPeriod.start.getTime()) / (1000 * 60 * 60 * 24));
      expect(monthlyDays).toBeGreaterThanOrEqual(28);
      expect(monthlyDays).toBeLessThanOrEqual(31);

      // Annual period should be ~365 days
      const annualDays = Math.ceil((annualPeriod.end.getTime() - annualPeriod.start.getTime()) / (1000 * 60 * 60 * 24));
      expect(annualDays).toBeGreaterThanOrEqual(365);
      expect(annualDays).toBeLessThanOrEqual(366);
    });
  });

  describe('Invoice HTML generation', () => {
    it('should generate valid HTML invoice', () => {
      const mockCustomer = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com'
      };

      const invoice = createSubscriptionInvoice(
        mockCustomer,
        'business',
        'gold',
        'annual',
        399.99,
        'PAYID-HTML-TEST'
      );

      const html = generateInvoiceHTML(invoice);

      // Check HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
      
      // Check invoice content
      expect(html).toContain(invoice.invoiceNumber);
      expect(html).toContain('Jane Smith');
      expect(html).toContain('jane.smith@example.com');
      expect(html).toContain('Business Gold Subscription - Annual');
      expect(html).toContain('$399.99');
      expect(html).toContain('PAYID-HTML-TEST');
      expect(html).toContain('PAID'); // Payment status
      
      // Check business info
      expect(html).toContain('All Things Wetaskiwin');
      expect(html).toContain('Wetaskiwin');
      expect(html).toContain('Alberta');
      
      // Check tax calculation
      expect(html).toContain('GST (5.0%)');
    });

    it('should handle invoices without payment details', () => {
      const invoice = createSubscriptionInvoice(
        { name: 'Test User', email: 'test@example.com' },
        'marketplace',
        'silver',
        'monthly',
        9.99
      );

      const html = generateInvoiceHTML(invoice);

      expect(html).not.toContain('PAID');
      expect(html).not.toContain('Payment Information');
    });

    it('should format currency correctly in HTML', () => {
      const invoice = createSubscriptionInvoice(
        { name: 'Test User', email: 'test@example.com' },
        'marketplace',
        'gold',
        'annual',
        199.99
      );

      const html = generateInvoiceHTML(invoice);

      // Check Canadian currency formatting
      expect(html).toContain('$199.99'); // Subtotal
      expect(html).toContain('$10.00'); // Tax (5% of 199.99 = 9.9995 rounded to 10.00)
      expect(html).toContain('$209.99'); // Total
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle zero amount gracefully', () => {
      const invoice = createSubscriptionInvoice(
        { name: 'Free User', email: 'free@example.com' },
        'marketplace',
        'silver',
        'monthly',
        0
      );

      expect(invoice.subtotal).toBe(0);
      expect(invoice.tax.amount).toBe(0);
      expect(invoice.total).toBe(0);
    });

    it('should handle large amounts correctly', () => {
      const largeAmount = 9999.99;
      const invoice = createSubscriptionInvoice(
        { name: 'Enterprise User', email: 'enterprise@example.com' },
        'business',
        'platinum',
        'annual',
        largeAmount
      );

      expect(invoice.subtotal).toBe(largeAmount);
      expect(invoice.tax.amount).toBeCloseTo(500.00, 2); // 5% of 9999.99 = 499.9995, rounded to 500.00
      expect(invoice.total).toBeCloseTo(10499.99, 2);
    });

    it('should handle special characters in customer names', () => {
      const specialCustomer = {
        name: 'José María O\'Connor-Smith',
        email: 'jose.maria@example.com'
      };

      const invoice = createSubscriptionInvoice(
        specialCustomer,
        'marketplace',
        'gold',
        'monthly',
        19.99
      );

      const html = generateInvoiceHTML(invoice);

      expect(html).toContain('José María O\'Connor-Smith');
      expect(invoice.customer.name).toBe('José María O\'Connor-Smith');
    });
  });
});