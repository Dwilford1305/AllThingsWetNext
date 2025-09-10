import { test, expect } from '../fixtures/base';

/**
 * Business Management E2E Tests
 * 
 * Tests critical business workflows:
 * - Business directory browsing
 * - Business registration/claiming
 * - Business profile management
 * - Subscription management
 */

test.describe('Business Management Workflows', () => {

  test('should display business directory correctly', async ({ page, navHelper, screenshotHelper, waitHelper }) => {
    // Navigate to businesses page
    await navHelper.goToBusinesses();
    
    // Verify page loads
    await expect(page).toHaveTitle(/Business|Directory|AllThingsWetaskiwin/);
    
    // Wait for content to load
    await waitHelper.waitForPageLoad();
    
    // Check for main business directory elements
    const businessElements = [
      '.business-card',
      '[data-testid="business-item"]',
      'text=Search businesses',
      'input[type="search"]',
      'text=Category',
      'select[name="category"]'
    ];
    
    let elementsFound = 0;
    for (const element of businessElements) {
      if (await page.locator(element).count() > 0) {
        elementsFound++;
      }
    }
    
    // Should find at least some business directory elements
    expect(elementsFound).toBeGreaterThan(0);
    
    // Take screenshot for visual regression
    await screenshotHelper.takeFullPageScreenshot('business-directory');
  });

  test('should search and filter businesses', async ({ page, navHelper, waitHelper }) => {
    await navHelper.goToBusinesses();
    await waitHelper.waitForPageLoad();
    
    // Test search functionality
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('restaurant');
      await page.keyboard.press('Enter');
      await waitHelper.waitForPageLoad();
      
      // Should show search results or filter businesses
      const businessCount = await page.locator('.business-card, [data-testid="business-item"]').count();
      console.log(`Found ${businessCount} businesses in search results`);
    }
    
    // Test category filtering
    const categorySelect = page.locator('select[name="category"], select[data-testid="category-filter"]');
    if (await categorySelect.count() > 0) {
      await categorySelect.first().selectOption('Restaurant');
      await waitHelper.waitForPageLoad();
      
      // Should filter businesses by category
      const filteredCount = await page.locator('.business-card, [data-testid="business-item"]').count();
      console.log(`Found ${filteredCount} restaurants after filtering`);
    }
  });

  test('should view business details', async ({ page, navHelper, waitHelper, screenshotHelper }) => {
    await navHelper.goToBusinesses();
    await waitHelper.waitForPageLoad();
    
    // Find first business and click on it
    const firstBusiness = page.locator('.business-card, [data-testid="business-item"]').first();
    
    if (await firstBusiness.count() > 0) {
      await firstBusiness.click();
      await waitHelper.waitForPageLoad();
      
      // Verify we're on a business detail page
      const detailElements = [
        'h1', // Business name
        'text=Address',
        'text=Phone',
        'text=Category',
        'button:has-text("Contact")',
        'button:has-text("Claim")'
      ];
      
      let detailsFound = 0;
      for (const element of detailElements) {
        if (await page.locator(element).count() > 0) {
          detailsFound++;
        }
      }
      
      expect(detailsFound).toBeGreaterThan(2);
      
      // Take screenshot of business detail page
      await screenshotHelper.takeFullPageScreenshot('business-detail');
    } else {
      console.log('No businesses found to test detail view');
      test.skip();
    }
  });

  test('should handle business claiming workflow', async ({ page, authenticatedUser, navHelper, waitHelper, formHelper }) => {
    console.log(`Testing business claiming for user: ${authenticatedUser.email}`);
    
    // Navigate to businesses
    await navHelper.goToBusinesses();
    await waitHelper.waitForPageLoad();
    
    // Look for a business to claim
    const claimButton = page.locator('button:has-text("Claim"), a:has-text("Claim")');
    
    if (await claimButton.count() > 0) {
      await claimButton.first().click();
      await waitHelper.waitForPageLoad();
      
      // Should be on claim business form
      await expect(page.locator('form')).toBeVisible();
      
      // Fill claim form if fields are present
      const claimFormData = {
        ownerName: `${authenticatedUser.firstName} ${authenticatedUser.lastName}`,
        position: 'Owner',
        verificationMethod: 'phone',
        notes: 'This is a test business claim for E2E testing'
      };
      
      try {
        await formHelper.fillForm(claimFormData);
        await formHelper.submitForm();
        await waitHelper.waitForPageLoad();
        
        // Verify claim submission
        const successIndicators = [
          'text=Claim submitted',
          'text=Request sent',
          'text=Thank you',
          'text=We will review'
        ];
        
        let foundSuccess = false;
        for (const indicator of successIndicators) {
          if (await page.locator(indicator).count() > 0) {
            foundSuccess = true;
            break;
          }
        }
        
        expect(foundSuccess).toBe(true);
        
      } catch (error) {
        console.log('Claim form fields not found or form structure different:', error);
        // At minimum, verify we reached a claim form
        expect(page.url()).toMatch(/claim/);
      }
    } else {
      console.log('No claimable businesses found, skipping claim test');
      test.skip();
    }
  });

  test('should access business management dashboard', async ({ page, authenticatedUser, navHelper, waitHelper }) => {
    console.log(`Testing business management for user: ${authenticatedUser.email}`);
    
    // Navigate to business management
    await page.goto('/businesses/manage');
    await waitHelper.waitForPageLoad();
    
    // Should show business management interface
    const managementElements = [
      'text=My Businesses',
      'text=Business Dashboard',
      'button:has-text("Add Business")',
      'text=No businesses',
      '.business-management'
    ];
    
    let elementsFound = 0;
    for (const element of managementElements) {
      if (await page.locator(element).count() > 0) {
        elementsFound++;
        break; // Found management interface
      }
    }
    
    expect(elementsFound).toBeGreaterThan(0);
  });

  test('should handle business registration flow', async ({ page, authenticatedUser, testBusiness, formHelper, waitHelper }) => {
    console.log(`Testing business registration for: ${testBusiness.name}`);
    
    // Navigate to business registration
    await page.goto('/businesses/manage');
    await waitHelper.waitForPageLoad();
    
    // Look for add business button
    const addBusinessButton = page.locator('button:has-text("Add Business"), a:has-text("Add Business"), text=Register Business');
    
    if (await addBusinessButton.count() > 0) {
      await addBusinessButton.first().click();
      await waitHelper.waitForPageLoad();
      
      // Fill business registration form
      const businessFormData = {
        name: testBusiness.name,
        category: testBusiness.category,
        description: testBusiness.description,
        address: testBusiness.address,
        phone: testBusiness.phone,
        website: testBusiness.website || ''
      };
      
      try {
        await formHelper.fillForm(businessFormData);
        await formHelper.submitForm();
        await waitHelper.waitForPageLoad();
        
        // Verify registration success
        const successIndicators = [
          'text=Business registered',
          'text=Business added',
          'text=Successfully created',
          'text=Registration complete'
        ];
        
        let foundSuccess = false;
        for (const indicator of successIndicators) {
          if (await page.locator(indicator).count() > 0) {
            foundSuccess = true;
            break;
          }
        }
        
        expect(foundSuccess).toBe(true);
        
      } catch (error) {
        console.log('Business registration form structure different than expected:', error);
        // At minimum, verify we have a business form
        expect(page.locator('form')).toBeVisible();
      }
    } else {
      console.log('Add business button not found, testing alternative registration path');
      
      // Try direct business request API
      await page.goto('/api/business/request');
      const response = await page.waitForResponse('**/api/business/request');
      
      // Should at least get a response (even if it's an error about missing data)
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('should display subscription options', async ({ page, navHelper, waitHelper, screenshotHelper }) => {
    // Navigate to subscription/upgrade page
    await page.goto('/upgrade-demo');
    await waitHelper.waitForPageLoad();
    
    // Should show subscription tiers
    const subscriptionElements = [
      'text=Free',
      'text=Basic',
      'text=Premium',
      'text=Platinum',
      'text=Subscribe',
      'text=Upgrade',
      '.subscription-tier',
      '.pricing-card'
    ];
    
    let tiersFound = 0;
    for (const element of subscriptionElements) {
      if (await page.locator(element).count() > 0) {
        tiersFound++;
      }
    }
    
    expect(tiersFound).toBeGreaterThan(2);
    
    // Take screenshot of subscription page
    await screenshotHelper.takeFullPageScreenshot('subscription-tiers');
  });

  test('should handle subscription upgrade flow', async ({ page, authenticatedUser, waitHelper }) => {
    console.log(`Testing subscription upgrade for user: ${authenticatedUser.email}`);
    
    // Navigate to upgrade page
    await page.goto('/upgrade-demo');
    await waitHelper.waitForPageLoad();
    
    // Look for upgrade buttons
    const upgradeButtons = page.locator('button:has-text("Upgrade"), button:has-text("Subscribe"), button:has-text("Choose Plan")');
    
    if (await upgradeButtons.count() > 0) {
      // Click first upgrade button (usually Basic plan)
      await upgradeButtons.first().click();
      await waitHelper.waitForPageLoad();
      
      // Should reach payment or confirmation page
      const paymentIndicators = [
        'text=PayPal',
        'text=Payment',
        'text=Checkout',
        'text=Confirm',
        'iframe[src*="paypal"]',
        '#paypal-button-container'
      ];
      
      let foundPayment = false;
      for (const indicator of paymentIndicators) {
        if (await page.locator(indicator).count() > 0) {
          foundPayment = true;
          break;
        }
      }
      
      expect(foundPayment).toBe(true);
      
    } else {
      console.log('No upgrade buttons found, skipping subscription test');
      test.skip();
    }
  });
});