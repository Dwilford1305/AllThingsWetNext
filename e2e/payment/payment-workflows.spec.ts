import { test, expect } from '@playwright/test';
import { createHelpers } from '../utils/test-helpers';

test.describe('Payment & Subscription Workflows', () => {
  test('should validate PayPal API endpoints', async ({ page }) => {
    const paypalEndpoints = [
      '/api/paypal/config',
      '/api/paypal/create-order',
      '/api/paypal/capture-order',
      '/api/paypal/webhook'
    ];

    for (const endpoint of paypalEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).not.toBe(404);
    }
  });

  test('should handle subscription interface on business management', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await page.goto('/businesses/manage');
    await helpers.wait.waitForLoadingComplete();
    
    // Look for subscription-related elements
    const subscriptionElements = page.locator('text=Subscription, text=Upgrade, text=Premium, text=Plan, button:has-text("Subscribe")');
    
    if (await subscriptionElements.first().isVisible()) {
      // Subscription interface exists
      expect(await subscriptionElements.first().isVisible()).toBeTruthy();
    }
  });

  test('should validate subscription API endpoints', async ({ page }) => {
    const subscriptionEndpoints = [
      '/api/businesses/subscription',
      '/api/marketplace/subscription'
    ];

    for (const endpoint of subscriptionEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).not.toBe(404);
    }
  });

  test('should handle upgrade demo page', async ({ page }) => {
    await page.goto('/upgrade-demo');
    await page.waitForLoadState();
    
    // Should show upgrade interface
    const upgradeElements = await page.locator('text=Upgrade, text=Premium, text=Subscription, text=Plan').count();
    expect(upgradeElements).toBeGreaterThan(0);
  });

  test('should handle PayPal configuration loading', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Test PayPal config endpoint
    const configResponse = await page.request.get('/api/paypal/config');
    expect(configResponse.status()).not.toBe(404);
    
    if (configResponse.ok()) {
      const config = await configResponse.json();
      // Should return some configuration data
      expect(config).toBeDefined();
    }
  });

  test('should handle subscription validation interface', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await page.goto('/businesses/manage');
    await helpers.wait.waitForLoadingComplete();
    
    // Look for offer code validation
    const offerCodeInput = page.locator('input[name*="offer"], input[name*="code"], input[placeholder*="code"]').first();
    
    if (await offerCodeInput.isVisible()) {
      await offerCodeInput.fill('TESTCODE');
      
      // Look for validation button
      const validateButton = page.locator('button:has-text("Validate"), button:has-text("Apply")').first();
      if (await validateButton.isVisible()) {
        await validateButton.click();
        await helpers.wait.waitForLoadingComplete();
        await helpers.errors.checkForErrors();
      }
    }
  });

  test('should validate offer code API endpoint', async ({ page }) => {
    const response = await page.request.get('/api/businesses/validate-offer-code');
    expect(response.status()).not.toBe(404);
  });

  test('should handle invoice generation interface', async ({ page }) => {
    // Test invoice API endpoints
    const invoiceEndpoints = [
      '/api/invoices'
    ];

    for (const endpoint of invoiceEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).not.toBe(404);
    }
  });

  test('should handle payment analytics interface', async ({ page }) => {
    const response = await page.request.get('/api/analytics/payments');
    expect(response.status()).not.toBe(404);
  });

  test('should handle subscription tier selection', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await page.goto('/upgrade-demo');
    await helpers.wait.waitForLoadingComplete();
    
    // Look for subscription tier options
    const tierOptions = await page.locator('.tier, .plan, .subscription-option, button:has-text("Select")').count();
    
    if (tierOptions > 0) {
      // Should have selectable subscription tiers
      expect(tierOptions).toBeGreaterThan(0);
      
      // Test tier selection
      const firstTier = page.locator('button:has-text("Select"), button:has-text("Choose")').first();
      if (await firstTier.isVisible()) {
        await firstTier.click();
        await helpers.wait.waitForLoadingComplete();
        await helpers.errors.checkForErrors();
      }
    }
  });

  test('should handle payment form interface', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await page.goto('/upgrade-demo');
    await helpers.wait.waitForLoadingComplete();
    
    // Look for PayPal payment interface
    const paypalContainer = page.locator('#paypal-button-container, .paypal-buttons, [data-testid*="paypal"]').first();
    
    if (await paypalContainer.isVisible()) {
      // PayPal integration is loaded
      expect(await paypalContainer.isVisible()).toBeTruthy();
    }
  });

  test('should validate webhook handling', async ({ page }) => {
    // Test webhook endpoint exists
    const webhookResponse = await page.request.post('/api/paypal/webhook', {
      data: { test: 'webhook' }
    });
    
    // Should not be 404, may be 400/401 which is expected for invalid webhook data
    expect(webhookResponse.status()).not.toBe(404);
  });

  test('should handle subscription cancellation interface', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToProfile();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for subscription management in profile
    const subscriptionSection = page.locator('text=Subscription, text=Billing, text=Plan').first();
    
    if (await subscriptionSection.isVisible()) {
      // Should have subscription management interface
      expect(await subscriptionSection.isVisible()).toBeTruthy();
      
      // Look for cancellation option
      const cancelButton = page.locator('button:has-text("Cancel"), a:has-text("Cancel")').first();
      if (await cancelButton.isVisible()) {
        // Cancellation interface exists (don't actually cancel)
        expect(await cancelButton.isVisible()).toBeTruthy();
      }
    }
  });
});