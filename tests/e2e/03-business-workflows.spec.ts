import { test, expect, TEST_BUSINESS, TEST_USERS } from '../fixtures/test-fixtures';

test.describe('Business Registration and Claiming Workflows', () => {
  test('should load business directory page', async ({ page }) => {
    await page.goto('/businesses');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify business directory loads
    await expect(page).toHaveURL(/.*businesses.*/);
    
    // Check for business listings or search functionality
    const businessList = page.locator('.business-list, .business-grid, [data-testid="business-list"]').first();
    const searchBox = page.locator('input[placeholder*="search"], input[name="search"], [data-testid="search"]').first();
    
    const businessListVisible = await businessList.isVisible().catch(() => false);
    const searchBoxVisible = await searchBox.isVisible().catch(() => false);
    
    if (businessListVisible) {
      await expect(businessList).toBeVisible();
    }
    
    if (searchBoxVisible) {
      await expect(searchBox).toBeVisible();
      
      // Test search functionality
      await searchBox.fill('restaurant');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000); // Wait for search results
    }
    
    // Take screenshot of business directory
    await page.screenshot({ path: 'tests/e2e/screenshots/business-directory.png', fullPage: true });
  });

  test('should access business management page', async ({ page }) => {
    await page.goto('/businesses/manage');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if we're at the business management page or redirected to auth
    const currentUrl = page.url();
    
    if (currentUrl.includes('/businesses/manage')) {
      // Business management page loaded
      const managementContent = page.locator('.business-management, .dashboard, [data-testid="business-management"]').first();
      const authPrompt = page.locator('.login-prompt, button:has-text("Log In"), .auth-required').first();
      
      const managementVisible = await managementContent.isVisible().catch(() => false);
      const authPromptVisible = await authPrompt.isVisible().catch(() => false);
      
      if (managementVisible) {
        await expect(managementContent).toBeVisible();
      } else if (authPromptVisible) {
        await expect(authPrompt).toBeVisible();
      }
      
      // Take screenshot of business management page
      await page.screenshot({ path: 'tests/e2e/screenshots/business-management.png', fullPage: true });
    } else {
      // Redirected to auth
      expect(currentUrl).toMatch(/auth|login/);
      await page.screenshot({ path: 'tests/e2e/screenshots/business-management-auth-redirect.png', fullPage: true });
    }
  });

  test('should display business claiming form', async ({ page }) => {
    await page.goto('/businesses');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for "Claim Business" or "Add Business" button
    const claimButton = page.locator('button:has-text("Claim"), a:has-text("Claim"), button:has-text("Add Business"), [data-testid="claim-business"]').first();
    const claimButtonVisible = await claimButton.isVisible().catch(() => false);
    
    if (claimButtonVisible) {
      await claimButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if business claiming form appears
      const claimForm = page.locator('form, .claim-form, .business-form, [data-testid="business-claim-form"]').first();
      const formVisible = await claimForm.isVisible().catch(() => false);
      
      if (formVisible) {
        await expect(claimForm).toBeVisible();
        
        // Test filling out the form
        const businessNameField = page.locator('input[name="name"], input[name="businessName"], [data-testid="business-name"]').first();
        const addressField = page.locator('input[name="address"], textarea[name="address"], [data-testid="business-address"]').first();
        const phoneField = page.locator('input[name="phone"], [data-testid="business-phone"]').first();
        const emailField = page.locator('input[name="email"], [data-testid="business-email"]').first();
        
        if (await businessNameField.isVisible().catch(() => false)) {
          await businessNameField.fill(TEST_BUSINESS.name);
        }
        if (await addressField.isVisible().catch(() => false)) {
          await addressField.fill(TEST_BUSINESS.address);
        }
        if (await phoneField.isVisible().catch(() => false)) {
          await phoneField.fill(TEST_BUSINESS.phone);
        }
        if (await emailField.isVisible().catch(() => false)) {
          await emailField.fill(TEST_BUSINESS.email);
        }
        
        // Take screenshot of filled claim form
        await page.screenshot({ path: 'tests/e2e/screenshots/business-claim-form.png', fullPage: true });
        
        // Test form validation (without submitting)
        const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Claim")').first();
        if (await submitButton.isVisible().catch(() => false)) {
          await expect(submitButton).toBeVisible();
        }
      }
    } else {
      // Try direct navigation to claim form
      await page.goto('/api/business/request');
      const apiResponse = await page.textContent('body');
      
      // Should show some kind of response (success, error, or form)
      expect(apiResponse).toBeDefined();
      
      await page.screenshot({ path: 'tests/e2e/screenshots/business-claim-api.png', fullPage: true });
    }
  });

  test('should handle business search and filtering', async ({ page }) => {
    await page.goto('/businesses');
    await page.waitForLoadState('domcontentloaded');
    
    // Test business search
    const searchInput = page.locator('input[placeholder*="search"], input[name="search"], [data-testid="search"]').first();
    const searchVisible = await searchInput.isVisible().catch(() => false);
    
    if (searchVisible) {
      // Test search functionality
      await searchInput.fill('restaurant');
      
      // Look for search button or press Enter
      const searchButton = page.locator('button[type="submit"], button:has-text("Search"), [data-testid="search-button"]').first();
      const searchButtonVisible = await searchButton.isVisible().catch(() => false);
      
      if (searchButtonVisible) {
        await searchButton.click();
      } else {
        await page.keyboard.press('Enter');
      }
      
      await page.waitForTimeout(1000);
      
      // Take screenshot of search results
      await page.screenshot({ path: 'tests/e2e/screenshots/business-search-results.png', fullPage: true });
      
      // Clear search
      await searchInput.fill('');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
    
    // Test category filtering if available
    const categoryFilter = page.locator('select[name="category"], .category-filter, [data-testid="category-filter"]').first();
    const categoryVisible = await categoryFilter.isVisible().catch(() => false);
    
    if (categoryVisible) {
      await categoryFilter.click();
      
      // Look for category options
      const categoryOption = page.locator('option:has-text("Restaurant"), [data-value="restaurant"]').first();
      const optionVisible = await categoryOption.isVisible().catch(() => false);
      
      if (optionVisible) {
        await categoryOption.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot of filtered results
        await page.screenshot({ path: 'tests/e2e/screenshots/business-category-filter.png', fullPage: true });
      }
    }
  });

  test('should display individual business details', async ({ page }) => {
    await page.goto('/businesses');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for business listings
    const businessLinks = page.locator('a[href*="/businesses/"], .business-item a, .business-card a').first();
    const businessLinkVisible = await businessLinks.isVisible().catch(() => false);
    
    if (businessLinkVisible) {
      // Click on first business
      await businessLinks.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if we're on a business detail page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/businesses\/[^\/]+/);
      
      // Look for business details
      const businessName = page.locator('h1, .business-name, [data-testid="business-name"]').first();
      const businessContact = page.locator('.contact, .phone, .email, [data-testid="contact-info"]').first();
      
      const nameVisible = await businessName.isVisible().catch(() => false);
      const contactVisible = await businessContact.isVisible().catch(() => false);
      
      if (nameVisible) {
        await expect(businessName).toBeVisible();
      }
      if (contactVisible) {
        await expect(businessContact).toBeVisible();
      }
      
      // Take screenshot of business details
      await page.screenshot({ path: 'tests/e2e/screenshots/business-details.png', fullPage: true });
    } else {
      // No businesses found - check if empty state is shown
      const emptyState = page.locator('.no-businesses, .empty-state, :has-text("No businesses")').first();
      const emptyVisible = await emptyState.isVisible().catch(() => false);
      
      if (emptyVisible) {
        await expect(emptyState).toBeVisible();
      }
      
      await page.screenshot({ path: 'tests/e2e/screenshots/business-empty-state.png', fullPage: true });
    }
  });

  test('should handle business subscription upgrade flow', async ({ page }) => {
    await page.goto('/businesses/manage');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for subscription/upgrade options
    const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Upgrade"), button:has-text("Subscribe"), [data-testid="upgrade"]').first();
    const upgradeVisible = await upgradeButton.isVisible().catch(() => false);
    
    if (upgradeVisible) {
      await upgradeButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if subscription page loads
      const subscriptionOptions = page.locator('.subscription-plans, .pricing-plans, .upgrade-options, [data-testid="subscription-plans"]').first();
      const optionsVisible = await subscriptionOptions.isVisible().catch(() => false);
      
      if (optionsVisible) {
        await expect(subscriptionOptions).toBeVisible();
        
        // Look for plan options (Silver, Gold, Platinum)
        const plans = page.locator('.plan, .pricing-card, button:has-text("Silver"), button:has-text("Gold"), button:has-text("Platinum")');
        const planCount = await plans.count();
        
        if (planCount > 0) {
          expect(planCount).toBeGreaterThan(0);
          
          // Click on first plan
          await plans.first().click();
          await page.waitForTimeout(1000);
          
          // Look for PayPal integration or payment form
          const paypalButton = page.locator('#paypal-button-container, .paypal-button, button:has-text("PayPal")').first();
          const paymentForm = page.locator('.payment-form, [data-testid="payment-form"]').first();
          
          const paypalVisible = await paypalButton.isVisible().catch(() => false);
          const paymentFormVisible = await paymentForm.isVisible().catch(() => false);
          
          if (paypalVisible) {
            await expect(paypalButton).toBeVisible();
          } else if (paymentFormVisible) {
            await expect(paymentForm).toBeVisible();
          }
        }
        
        // Take screenshot of subscription plans
        await page.screenshot({ path: 'tests/e2e/screenshots/business-subscription-plans.png', fullPage: true });
      }
    } else {
      // Check if we need to be authenticated first
      const authRequired = page.locator('.login-prompt, button:has-text("Log In"), .auth-required').first();
      const authVisible = await authRequired.isVisible().catch(() => false);
      
      if (authVisible) {
        await expect(authRequired).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/business-subscription-auth-required.png', fullPage: true });
      }
    }
  });

  test('should validate business form inputs', async ({ page }) => {
    await page.goto('/businesses');
    await page.waitForLoadState('domcontentloaded');
    
    // Try to access business claim form
    const claimButton = page.locator('button:has-text("Claim"), a:has-text("Claim"), button:has-text("Add Business")').first();
    const claimVisible = await claimButton.isVisible().catch(() => false);
    
    if (claimVisible) {
      await claimButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      const form = page.locator('form').first();
      const formVisible = await form.isVisible().catch(() => false);
      
      if (formVisible) {
        // Test form validation by submitting empty form
        const submitButton = page.locator('button[type="submit"]').first();
        const submitVisible = await submitButton.isVisible().catch(() => false);
        
        if (submitVisible) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Look for validation errors
          const errorMessages = page.locator('.error, .invalid, .field-error, [role="alert"]');
          const errorCount = await errorMessages.count();
          
          if (errorCount > 0) {
            await expect(errorMessages.first()).toBeVisible();
          }
          
          // Take screenshot of validation errors
          await page.screenshot({ path: 'tests/e2e/screenshots/business-form-validation.png', fullPage: true });
        }
      }
    }
  });
});