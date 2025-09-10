import { test, expect } from '@playwright/test';

test.describe('Business Workflows', () => {
  test('business directory page loads and displays businesses', async ({ page }) => {
    await page.goto('/businesses');
    
    // Verify page loads
    await expect(page).toHaveTitle(/Business/i);
    await expect(page.locator('main')).toBeVisible();
    
    // Check for business listing components
    const hasBusinessList = await page.locator('[data-testid="business-list"], .business-card, .business-item').count() > 0;
    const hasSearchFunction = await page.locator('input[type="search"], input[placeholder*="search"]').isVisible();
    
    // Should have either business listings or search functionality
    expect(hasBusinessList || hasSearchFunction).toBeTruthy();
  });

  test('business search functionality', async ({ page }) => {
    await page.goto('/businesses');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible()) {
      // Test search functionality
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      // Wait for any search results or loading states
      await page.waitForTimeout(2000);
      
      // Verify page still responds correctly
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('business filtering and categories', async ({ page }) => {
    await page.goto('/businesses');
    
    // Look for filter/category controls
    const filterElements = page.locator('select, [role="combobox"], button:has-text("Filter"), button:has-text("Category")');
    
    if (await filterElements.count() > 0) {
      const firstFilter = filterElements.first();
      await firstFilter.click();
      
      // Wait for any dropdown or filter options
      await page.waitForTimeout(1000);
      
      // Page should remain functional
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('business detail view accessibility', async ({ page }) => {
    await page.goto('/businesses');
    
    // Look for business links or cards
    const businessLinks = page.locator('a[href*="/business"], .business-card a, [data-testid="business-link"]');
    
    if (await businessLinks.count() > 0) {
      // Click on first business
      await businessLinks.first().click();
      
      // Should navigate to business detail page
      await page.waitForTimeout(2000);
      await expect(page.locator('main')).toBeVisible();
      
      // Should not show 404 error
      const hasError = await page.locator('text=404, text=Not Found').isVisible();
      expect(hasError).toBeFalsy();
    }
  });

  test('business claim/request process', async ({ page }) => {
    await page.goto('/businesses');
    
    // Look for business claiming functionality
    const claimButtons = page.locator('button:has-text("Claim"), a:has-text("Claim"), button:has-text("Request")');
    
    if (await claimButtons.count() > 0) {
      await claimButtons.first().click();
      
      // Should either show a form or navigate to claim page
      await page.waitForTimeout(2000);
      
      // Check for form elements or successful navigation
      const hasForm = await page.locator('form, input[type="email"], textarea').count() > 0;
      const isClaimPage = page.url().includes('claim') || page.url().includes('request');
      
      expect(hasForm || isClaimPage).toBeTruthy();
    }
  });

  test('business management dashboard access', async ({ page }) => {
    await page.goto('/businesses/manage');
    
    // Should either show management interface or redirect to auth
    const hasError = await page.locator('text=404').isVisible();
    expect(hasError).toBeFalsy();
    
    // Should show either business management content or auth requirement
    const hasManagementContent = await page.locator('form, .dashboard, .management, button:has-text("Add"), button:has-text("Edit")').count() > 0;
    const requiresAuth = await page.locator('button:has-text("Login"), input[type="password"]').isVisible();
    
    expect(hasManagementContent || requiresAuth).toBeTruthy();
  });

  test('business subscription/upgrade flows', async ({ page }) => {
    await page.goto('/upgrade-demo');
    
    // Check for subscription/upgrade interface
    await expect(page.locator('main')).toBeVisible();
    
    // Look for pricing or subscription elements
    const hasSubscriptionContent = await page.locator(
      'button:has-text("Subscribe"), button:has-text("Upgrade"), .pricing, .subscription, .tier'
    ).count() > 0;
    
    // Should show subscription-related content
    expect(hasSubscriptionContent).toBeTruthy();
  });

  test('business listings pagination', async ({ page }) => {
    await page.goto('/businesses');
    
    // Look for pagination controls
    const paginationElements = page.locator(
      'button:has-text("Next"), button:has-text("Previous"), .pagination, [aria-label*="pagination"]'
    );
    
    if (await paginationElements.count() > 0) {
      // Test pagination functionality
      const nextButton = page.locator('button:has-text("Next")').first();
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(2000);
        
        // Should still be on businesses page
        expect(page.url()).toContain('/businesses');
        await expect(page.locator('main')).toBeVisible();
      }
    }
  });
});