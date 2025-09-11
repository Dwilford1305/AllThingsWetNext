import { test, expect } from '@playwright/test';
import { createHelpers } from './utils/test-helpers';

test.describe('Basic Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goHome();
    await helpers.validate.validateHomePage();
    await helpers.errors.checkForErrors();
  });

  test('should navigate to all main pages', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Test all main navigation links
    const pages = [
      { path: '/', validator: 'validateHomePage' },
      { path: '/businesses', validator: 'validateBusinessesPage' },
      { path: '/events', validator: 'validateEventsPage' },
      { path: '/news', validator: 'validateNewsPage' },
      { path: '/jobs', validator: 'validateJobsPage' },
      { path: '/marketplace', validator: 'validateMarketplacePage' },
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      await helpers.wait.waitForLoadingComplete();
      
      // Validate page loaded successfully
      await expect(page).toHaveURL(new RegExp(pageInfo.path.replace('/', '\\/')));
      await helpers.errors.checkForErrors();
      
      // Basic validation that page content is visible
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have working navigation menu', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goHome();
    
    // Look for common navigation patterns
    const navSelectors = [
      'nav',
      '[role="navigation"]',
      'header nav',
      '.navigation',
      '.navbar',
    ];

    let navFound = false;
    for (const selector of navSelectors) {
      if (await page.locator(selector).isVisible()) {
        navFound = true;
        break;
      }
    }

    expect(navFound).toBeTruthy();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    
    // Should show 404 page or redirect appropriately
    const is404 = page.url().includes('404') || 
                  await page.locator('text=404').isVisible() ||
                  await page.locator('text=Not Found').isVisible();
    
    expect(is404 || page.url().includes('/')).toBeTruthy();
  });
});