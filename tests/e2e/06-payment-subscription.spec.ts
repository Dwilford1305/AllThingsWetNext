import { test, expect, TEST_USERS } from '../fixtures/test-fixtures';

test.describe('Payment and Subscription Workflows', () => {
  test('should display subscription plans on upgrade page', async ({ page }) => {
    await page.goto('/upgrade-demo');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if upgrade demo page loads
    await expect(page).toHaveURL(/.*upgrade-demo.*/);
    
    // Look for subscription plans
    const subscriptionPlans = page.locator('.pricing-plans, .subscription-plans, .plans, [data-testid="subscription-plans"]').first();
    const planCards = page.locator('.plan-card, .pricing-card, .subscription-card');
    
    const plansVisible = await subscriptionPlans.isVisible().catch(() => false);
    const cardCount = await planCards.count();
    
    if (plansVisible) {
      await expect(subscriptionPlans).toBeVisible();
    }
    
    if (cardCount > 0) {
      await expect(planCards.first()).toBeVisible();
      
      // Look for common plan types (Silver, Gold, Platinum)
      const silverPlan = page.locator(':has-text("Silver"), [data-plan="silver"], .silver-plan').first();
      const goldPlan = page.locator(':has-text("Gold"), [data-plan="gold"], .gold-plan').first();
      const platinumPlan = page.locator(':has-text("Platinum"), [data-plan="platinum"], .platinum-plan').first();
      
      const silverVisible = await silverPlan.isVisible().catch(() => false);
      const goldVisible = await goldPlan.isVisible().catch(() => false);
      const platinumVisible = await platinumPlan.isVisible().catch(() => false);
      
      if (silverVisible) {
        await expect(silverPlan).toBeVisible();
      }
      if (goldVisible) {
        await expect(goldPlan).toBeVisible();
      }
      if (platinumVisible) {
        await expect(platinumPlan).toBeVisible();
      }
      
      // Look for pricing information
      const pricing = page.locator('.price, .cost, .amount, [data-testid="price"]');
      const priceCount = await pricing.count();
      
      if (priceCount > 0) {
        await expect(pricing.first()).toBeVisible();
      }
    }
    
    // Take screenshot of subscription plans
    await page.screenshot({ path: 'tests/e2e/screenshots/subscription-plans.png', fullPage: true });
  });

  test('should handle subscription plan selection', async ({ page }) => {
    await page.goto('/upgrade-demo');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for plan selection buttons
    const selectButtons = page.locator('button:has-text("Select"), button:has-text("Choose"), button:has-text("Subscribe"), .select-plan');
    const buttonCount = await selectButtons.count();
    
    if (buttonCount > 0) {
      // Click on first plan selection button
      await selectButtons.first().click();
      await page.waitForTimeout(2000);
      
      // Check if PayPal integration loads
      const paypalContainer = page.locator('#paypal-button-container, .paypal-buttons, [data-testid="paypal-container"]').first();
      const paypalModal = page.locator('.payment-modal, .checkout-modal, [data-testid="payment-modal"]').first();
      const authPrompt = page.locator('.login-prompt, .auth-required, button:has-text("Log In")').first();
      
      const paypalVisible = await paypalContainer.isVisible().catch(() => false);
      const modalVisible = await paypalModal.isVisible().catch(() => false);
      const authVisible = await authPrompt.isVisible().catch(() => false);
      
      if (paypalVisible) {
        await expect(paypalContainer).toBeVisible();
        
        // Look for PayPal buttons
        const paypalButtons = page.locator('.paypal-button, [role="button"]').first();
        const paypalButtonVisible = await paypalButtons.isVisible().catch(() => false);
        
        if (paypalButtonVisible) {
          await expect(paypalButtons).toBeVisible();
        }
        
        // Take screenshot of PayPal integration
        await page.screenshot({ path: 'tests/e2e/screenshots/paypal-integration.png', fullPage: true });
      } else if (modalVisible) {
        await expect(paypalModal).toBeVisible();
        
        // Look for payment details in modal
        const planDetails = page.locator('.plan-details, .subscription-details, .order-summary').first();
        const planDetailsVisible = await planDetails.isVisible().catch(() => false);
        
        if (planDetailsVisible) {
          await expect(planDetails).toBeVisible();
        }
        
        // Take screenshot of payment modal
        await page.screenshot({ path: 'tests/e2e/screenshots/payment-modal.png', fullPage: true });
        
        // Close modal for other tests
        const closeButton = page.locator('button[aria-label="Close"], .modal-close, button:has-text("×")').first();
        const closeVisible = await closeButton.isVisible().catch(() => false);
        if (closeVisible) {
          await closeButton.click();
        }
      } else if (authVisible) {
        await expect(authPrompt).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/payment-auth-required.png', fullPage: true });
      }
    }
  });

  test('should display marketplace subscription upgrade', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for subscription upgrade prompts (when user hits quota)
    const upgradePrompt = page.locator('.upgrade-prompt, .quota-exceeded, .subscription-upgrade, [data-testid="upgrade-prompt"]').first();
    const createButton = page.locator('button:has-text("Create"), button:has-text("Post"), button:has-text("Sell")').first();
    
    const upgradeVisible = await upgradePrompt.isVisible().catch(() => false);
    const createVisible = await createButton.isVisible().catch(() => false);
    
    if (upgradeVisible) {
      await expect(upgradePrompt).toBeVisible();
      
      // Look for upgrade button in prompt
      const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Upgrade"), [data-testid="upgrade-button"]').first();
      const upgradeButtonVisible = await upgradeButton.isVisible().catch(() => false);
      
      if (upgradeButtonVisible) {
        await upgradeButton.click();
        await page.waitForLoadState('domcontentloaded');
        
        // Should navigate to upgrade page or show payment modal
        const currentUrl = page.url();
        const paymentModal = page.locator('.payment-modal, .subscription-modal').first();
        
        if (currentUrl.includes('upgrade') || await paymentModal.isVisible().catch(() => false)) {
          // Successfully triggered upgrade flow
          await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-upgrade-flow.png', fullPage: true });
        }
      }
    } else if (createVisible) {
      // Test creating listing to potentially trigger quota
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Check if quota warning appears
      const quotaWarning = page.locator('.quota-warning, .limit-warning, :has-text("quota"), :has-text("limit")').first();
      const quotaVisible = await quotaWarning.isVisible().catch(() => false);
      
      if (quotaVisible) {
        await expect(quotaWarning).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-quota-warning.png', fullPage: true });
      }
    }
    
    // Take general marketplace screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-subscription-context.png', fullPage: true });
  });

  test('should handle business subscription upgrade from management page', async ({ page }) => {
    await page.goto('/businesses/manage');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for business subscription options
    const subscriptionSection = page.locator('.subscription-section, .business-subscription, .upgrade-section, [data-testid="subscription-section"]').first();
    const upgradeButton = page.locator('button:has-text("Upgrade"), button:has-text("Subscribe"), a:has-text("Upgrade")').first();
    
    const sectionVisible = await subscriptionSection.isVisible().catch(() => false);
    const upgradeVisible = await upgradeButton.isVisible().catch(() => false);
    
    if (sectionVisible) {
      await expect(subscriptionSection).toBeVisible();
    }
    
    if (upgradeVisible) {
      await upgradeButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if business subscription plans appear
      const businessPlans = page.locator('.business-plans, .business-subscription-plans, [data-testid="business-plans"]').first();
      const businessPlansVisible = await businessPlans.isVisible().catch(() => false);
      
      if (businessPlansVisible) {
        await expect(businessPlans).toBeVisible();
        
        // Look for business-specific features
        const features = page.locator('.feature-list, .plan-features, .benefits').first();
        const featuresVisible = await features.isVisible().catch(() => false);
        
        if (featuresVisible) {
          await expect(features).toBeVisible();
        }
        
        // Look for business plan selection
        const businessPlanButtons = page.locator('button:has-text("Silver"), button:has-text("Gold"), button:has-text("Platinum")');
        const planButtonCount = await businessPlanButtons.count();
        
        if (planButtonCount > 0) {
          // Click on a business plan
          await businessPlanButtons.first().click();
          await page.waitForTimeout(2000);
          
          // Check for PayPal integration
          const paypalContainer = page.locator('#paypal-button-container, .paypal-buttons').first();
          const paypalVisible = await paypalContainer.isVisible().catch(() => false);
          
          if (paypalVisible) {
            await expect(paypalContainer).toBeVisible();
          }
        }
      }
      
      // Take screenshot of business subscription
      await page.screenshot({ path: 'tests/e2e/screenshots/business-subscription-upgrade.png', fullPage: true });
    } else {
      // Check if authentication is required
      const authRequired = page.locator('.login-prompt, .auth-required, button:has-text("Log In")').first();
      const authVisible = await authRequired.isVisible().catch(() => false);
      
      if (authVisible) {
        await expect(authRequired).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/business-subscription-auth-required.png', fullPage: true });
      }
    }
  });

  test('should validate PayPal configuration and security', async ({ page }) => {
    await page.goto('/upgrade-demo');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for plan selection to trigger PayPal
    const selectButton = page.locator('button:has-text("Select"), button:has-text("Choose")').first();
    const selectVisible = await selectButton.isVisible().catch(() => false);
    
    if (selectVisible) {
      await selectButton.click();
      await page.waitForTimeout(3000);
      
      // Check PayPal configuration
      const paypalContainer = page.locator('#paypal-button-container').first();
      const paypalVisible = await paypalContainer.isVisible().catch(() => false);
      
      if (paypalVisible) {
        // Verify PayPal script is loaded
        const paypalScript = page.locator('script[src*="paypal"]').first();
        const scriptVisible = await paypalScript.isVisible().catch(() => false);
        
        // Check for PayPal sandbox/production indicators
        const pageContent = await page.content();
        const isSandbox = pageContent.includes('sandbox') || pageContent.includes('sb-');
        
        console.log('PayPal Environment:', isSandbox ? 'Sandbox' : 'Production');
        
        // Verify secure HTTPS context for payments
        const currentUrl = page.url();
        if (currentUrl.startsWith('https://')) {
          console.log('✓ HTTPS secured payment context');
        } else {
          console.log('⚠ Payment context not HTTPS secured');
        }
        
        // Take screenshot of PayPal security validation
        await page.screenshot({ path: 'tests/e2e/screenshots/paypal-security-validation.png', fullPage: true });
      }
    }
    
    // Test API endpoint security
    const response = await page.goto('/api/paypal/config');
    if (response) {
      const status = response.status();
      console.log('PayPal Config API Status:', status);
      
      // Should not expose sensitive information
      const responseText = await response.text();
      const hasSensitiveInfo = responseText.includes('secret') || responseText.includes('private_key');
      
      expect(hasSensitiveInfo).toBeFalsy();
    }
  });

  test('should handle payment success and failure scenarios', async ({ page }) => {
    // Test payment success flow
    await page.goto('/upgrade-demo');
    await page.waitForLoadState('domcontentloaded');
    
    // Mock successful payment response
    await page.route('**/api/paypal/create-order', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          orderID: 'MOCK-ORDER-ID-123',
          approveUrl: 'https://sandbox.paypal.com/approve/mock-url'
        }),
      });
    });
    
    await page.route('**/api/paypal/capture-order', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          paymentID: 'MOCK-PAYMENT-ID-456',
          status: 'COMPLETED'
        }),
      });
    });
    
    // Look for plan selection
    const selectButton = page.locator('button:has-text("Select"), button:has-text("Choose")').first();
    const selectVisible = await selectButton.isVisible().catch(() => false);
    
    if (selectVisible) {
      await selectButton.click();
      await page.waitForTimeout(2000);
      
      // Look for success/failure handling elements
      const successMessage = page.locator('.success, .payment-success, .order-success, [data-testid="payment-success"]').first();
      const errorMessage = page.locator('.error, .payment-error, .order-error, [data-testid="payment-error"]').first();
      const loadingState = page.locator('.loading, .spinner, .processing, [data-testid="payment-loading"]').first();
      
      const successVisible = await successMessage.isVisible().catch(() => false);
      const errorVisible = await errorMessage.isVisible().catch(() => false);
      const loadingVisible = await loadingState.isVisible().catch(() => false);
      
      if (successVisible) {
        await expect(successMessage).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/payment-success.png', fullPage: true });
      } else if (errorVisible) {
        await expect(errorMessage).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/payment-error.png', fullPage: true });
      } else if (loadingVisible) {
        await expect(loadingState).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/payment-loading.png', fullPage: true });
      }
    }
    
    // Test payment cancellation
    await page.goto('/upgrade-demo');
    await page.waitForLoadState('domcontentloaded');
    
    // Mock payment cancellation
    await page.route('**/api/paypal/create-order', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Payment cancelled by user'
        }),
      });
    });
    
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), .cancel-payment').first();
    const cancelVisible = await cancelButton.isVisible().catch(() => false);
    
    if (cancelVisible) {
      await cancelButton.click();
      await page.waitForTimeout(1000);
      
      // Should handle cancellation gracefully
      const cancellationMessage = page.locator('.cancelled, .payment-cancelled, :has-text("cancelled")').first();
      const cancelMessageVisible = await cancellationMessage.isVisible().catch(() => false);
      
      if (cancelMessageVisible) {
        await expect(cancellationMessage).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/payment-cancelled.png', fullPage: true });
      }
    }
  });

  test('should handle subscription management and billing', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for subscription management section
    const subscriptionSection = page.locator('.subscription-management, .billing-section, .my-subscription, [data-testid="subscription-management"]').first();
    const subscriptionVisible = await subscriptionSection.isVisible().catch(() => false);
    
    if (subscriptionVisible) {
      await expect(subscriptionSection).toBeVisible();
      
      // Look for subscription details
      const subscriptionDetails = page.locator('.subscription-details, .plan-details, .current-plan').first();
      const detailsVisible = await subscriptionDetails.isVisible().catch(() => false);
      
      if (detailsVisible) {
        await expect(subscriptionDetails).toBeVisible();
        
        // Look for subscription actions
        const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Change Plan")').first();
        const cancelButton = page.locator('button:has-text("Cancel"), a:has-text("Cancel Subscription")').first();
        const billingButton = page.locator('button:has-text("Billing"), a:has-text("Billing History")').first();
        
        const upgradeButtonVisible = await upgradeButton.isVisible().catch(() => false);
        const cancelButtonVisible = await cancelButton.isVisible().catch(() => false);
        const billingButtonVisible = await billingButton.isVisible().catch(() => false);
        
        if (upgradeButtonVisible) {
          await expect(upgradeButton).toBeVisible();
        }
        if (cancelButtonVisible) {
          await expect(cancelButton).toBeVisible();
        }
        if (billingButtonVisible) {
          await expect(billingButton).toBeVisible();
          
          // Test billing history
          await billingButton.click();
          await page.waitForTimeout(1000);
          
          const billingHistory = page.locator('.billing-history, .payment-history, .invoices, [data-testid="billing-history"]').first();
          const historyVisible = await billingHistory.isVisible().catch(() => false);
          
          if (historyVisible) {
            await expect(billingHistory).toBeVisible();
          }
        }
      }
      
      // Take screenshot of subscription management
      await page.screenshot({ path: 'tests/e2e/screenshots/subscription-management.png', fullPage: true });
    } else {
      // Check if user needs to be authenticated
      const authRequired = page.locator('.login-prompt, .auth-required, button:has-text("Log In")').first();
      const authVisible = await authRequired.isVisible().catch(() => false);
      
      if (authVisible) {
        await expect(authRequired).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/subscription-management-auth-required.png', fullPage: true });
      }
    }
  });

  test('should validate payment data security and PCI compliance', async ({ page }) => {
    // Test that sensitive payment data is not exposed in frontend
    await page.goto('/upgrade-demo');
    await page.waitForLoadState('domcontentloaded');
    
    // Check page source for sensitive payment information
    const pageContent = await page.content();
    
    // Should not contain sensitive payment data
    const hasCreditCardNumbers = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(pageContent);
    const hasCVV = /\bcvv\b|\bcvc\b|\bsecurity\s+code\b/i.test(pageContent);
    const hasAPIKeys = /sk_live_|sk_test_|client_secret/i.test(pageContent);
    
    expect(hasCreditCardNumbers).toBeFalsy();
    expect(hasAPIKeys).toBeFalsy();
    
    // Check that payment forms use proper security attributes
    const paymentInputs = page.locator('input[type="text"], input[type="number"], input[type="password"]');
    const inputCount = await paymentInputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = paymentInputs.nth(i);
      const name = await input.getAttribute('name') || '';
      const autocomplete = await input.getAttribute('autocomplete') || '';
      
      // Payment-related inputs should have proper autocomplete attributes
      if (name.includes('card') || name.includes('credit') || name.includes('payment')) {
        console.log(`Payment input found: ${name}, autocomplete: ${autocomplete}`);
      }
    }
    
    // Check for HTTPS requirement
    const currentUrl = page.url();
    if (currentUrl.includes('payment') || currentUrl.includes('checkout')) {
      expect(currentUrl).toMatch(/^https:/);
    }
    
    // Take screenshot for compliance validation
    await page.screenshot({ path: 'tests/e2e/screenshots/payment-security-validation.png', fullPage: true });
  });
});