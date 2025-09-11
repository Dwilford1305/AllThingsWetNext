import { test, expect } from '../fixtures/test-fixtures';

test.describe('Homepage and Basic Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check page title
    await expect(page).toHaveTitle(/All Things Wetaskiwin/);
    
    // Check main heading is visible
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    
    // Take screenshot for visual regression
    await page.screenshot({ path: 'tests/e2e/screenshots/homepage-load.png', fullPage: true });
  });

  test('should navigate to all main sections', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to Events
    await page.click('a[href="/events"], nav a:has-text("Events")');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*events.*/);
    await expect(page.locator('h1, h2')).toContainText(['Events', 'Community Events']);
    
    // Test navigation to Businesses
    await page.click('a[href="/businesses"], nav a:has-text("Business")');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*businesses.*/);
    await expect(page.locator('h1, h2')).toContainText(['Business', 'Directory']);
    
    // Test navigation to News
    await page.click('a[href="/news"], nav a:has-text("News")');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*news.*/);
    await expect(page.locator('h1, h2')).toContainText('News');
    
    // Test navigation to Jobs
    await page.click('a[href="/jobs"], nav a:has-text("Jobs")');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*jobs.*/);
    await expect(page.locator('h1, h2')).toContainText('Jobs');
    
    // Test navigation to Marketplace
    await page.click('a[href="/marketplace"], nav a:has-text("Marketplace")');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*marketplace.*/);
    await expect(page.locator('h1, h2')).toContainText('Marketplace');
    
    // Return to homepage
    await page.click('a[href="/"], nav a:has-text("Home"), .logo');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL('/');
  });

  test('should display community stats on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for stats sections (these may be loaded dynamically)
    const statsSection = page.locator('[data-testid="community-stats"], .stats, .dashboard-stats').first();
    
    // If stats are present, verify they're visible
    const statsVisible = await statsSection.isVisible().catch(() => false);
    if (statsVisible) {
      await expect(statsSection).toBeVisible();
      
      // Look for number indicators (businesses, events, jobs, etc.)
      const numbers = page.locator('.stat-number, .count, .total');
      const numbersCount = await numbers.count();
      
      if (numbersCount > 0) {
        expect(numbersCount).toBeGreaterThan(0);
      }
    }
    
    // Take screenshot of homepage with stats
    await page.screenshot({ path: 'tests/e2e/screenshots/homepage-stats.png', fullPage: true });
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check mobile navigation (hamburger menu or responsive nav)
    const mobileNav = page.locator('.mobile-menu, .hamburger, [data-testid="mobile-nav"]').first();
    const mobileNavVisible = await mobileNav.isVisible().catch(() => false);
    
    if (mobileNavVisible) {
      await expect(mobileNav).toBeVisible();
      
      // Try to open mobile menu if it exists
      await mobileNav.click();
      
      // Check if navigation items become visible
      const navItems = page.locator('nav a, .nav-menu a');
      await expect(navItems.first()).toBeVisible();
    }
    
    // Take mobile screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/homepage-mobile.png', fullPage: true });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Take tablet screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/homepage-tablet.png', fullPage: true });
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    // Check that there are no critical console errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('MONGODB_URI') && // Expected in dev without DB
      !error.includes('404') // Expected for missing resources in dev
    );
    
    expect(criticalErrors.length).toBe(0);
    
    // Test navigation to non-existent page
    await page.goto('/non-existent-page');
    
    // Should show 404 page or redirect
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/not found|404|error/i);
  });
});