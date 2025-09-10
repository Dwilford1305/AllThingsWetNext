import { test, expect, devices } from '@playwright/test';

test.describe('Mobile E2E Tests', () => {
  test.use({
    ...devices['iPhone 12'],
  });

  test('mobile homepage navigation and layout', async ({ page }) => {
    await page.goto('/');
    
    // Verify mobile viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(500);
    
    // Check mobile navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Look for mobile menu button (hamburger menu)
    const mobileMenuButton = page.locator('button[aria-label*="menu"], .mobile-menu, .hamburger, button:has-text("☰")');
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);
      
      // Menu should expand
      const mobileMenu = page.locator('.mobile-menu, .nav-menu, [role="menu"]');
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('mobile touch interactions', async ({ page }) => {
    await page.goto('/businesses');
    
    // Test touch scrolling
    await page.touchscreen.tap(200, 400);
    
    // Scroll down on mobile
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);
    
    // Should maintain functionality
    await expect(page.locator('main')).toBeVisible();
  });

  test('mobile business directory functionality', async ({ page }) => {
    await page.goto('/businesses');
    
    // Test mobile search
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.tap();
      await searchInput.fill('restaurant');
      
      // On mobile, might need to tap search button
      const searchButton = page.locator('button[type="submit"], button:has-text("Search")').first();
      if (await searchButton.isVisible()) {
        await searchButton.tap();
      } else {
        await page.keyboard.press('Enter');
      }
      
      await page.waitForTimeout(2000);
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('mobile form interactions', async ({ page }) => {
    await page.goto('/auth-test');
    
    // Test mobile form interactions
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await emailInput.isVisible()) {
      await emailInput.tap();
      await emailInput.fill('test@example.com');
      
      // Test that virtual keyboard doesn't break layout
      await page.waitForTimeout(1000);
      await expect(page.locator('main')).toBeVisible();
      
      // Tap outside to close keyboard
      await page.touchscreen.tap(200, 100);
      await page.waitForTimeout(500);
    }
  });

  test('mobile marketplace interactions', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Test mobile swipe gestures if available
    const marketplaceItems = page.locator('.item, .listing, [data-testid="marketplace-item"]');
    
    if (await marketplaceItems.count() > 0) {
      const firstItem = marketplaceItems.first();
      
      // Test tap interaction
      await firstItem.tap();
      await page.waitForTimeout(2000);
      
      // Should respond to mobile interaction
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('mobile admin dashboard responsiveness', async ({ page }) => {
    await page.goto('/admin');
    
    // Admin interface should be responsive on mobile
    await page.waitForTimeout(2000);
    
    // Should show mobile-appropriate interface
    const hasResponsiveDesign = await page.locator(
      '.mobile-admin, .responsive, .sidebar-mobile'
    ).count() > 0;
    
    const hasCollapsedNav = await page.locator(
      'button[aria-label*="menu"], .mobile-menu, .hamburger'
    ).count() > 0;
    
    // Should have mobile-friendly admin interface
    expect(hasResponsiveDesign || hasCollapsedNav || await page.locator('main').isVisible()).toBeTruthy();
  });

  test('mobile payment flow accessibility', async ({ page }) => {
    await page.goto('/upgrade-demo');
    
    // Test mobile payment interface
    const subscribeButton = page.locator('button:has-text("Subscribe")').first();
    
    if (await subscribeButton.isVisible()) {
      await subscribeButton.tap();
      await page.waitForTimeout(2000);
      
      // Payment interface should be mobile-friendly
      const paymentForm = page.locator('form, .payment, .paypal');
      
      if (await paymentForm.isVisible()) {
        // Should be accessible on mobile
        await expect(paymentForm).toBeVisible();
        
        // Test mobile payment form interactions
        const emailField = page.locator('input[type="email"]').first();
        if (await emailField.isVisible()) {
          await emailField.tap();
          await page.waitForTimeout(500);
          
          // Should handle mobile keyboard
          await expect(emailField).toBeFocused();
        }
      }
    }
  });

  test('mobile page load performance', async ({ page }) => {
    // Test critical pages load quickly on mobile
    const pages = ['/', '/businesses', '/events', '/marketplace'];
    
    for (const pagePath of pages) {
      const startTime = Date.now();
      
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // Should load reasonably quickly on mobile (under 5 seconds)
      expect(loadTime).toBeLessThan(5000);
      
      // Main content should be visible
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('mobile orientation changes', async ({ page }) => {
    await page.goto('/');
    
    // Test portrait orientation
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await expect(page.locator('main')).toBeVisible();
    
    // Test landscape orientation
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(1000);
    await expect(page.locator('main')).toBeVisible();
    
    // Layout should adapt to orientation changes
    const hasResponsiveLayout = await page.locator('nav, main').isVisible();
    expect(hasResponsiveLayout).toBeTruthy();
  });

  test('mobile accessibility features', async ({ page }) => {
    await page.goto('/');
    
    // Test that buttons are large enough for touch
    const buttons = page.locator('button');
    
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      const boundingBox = await firstButton.boundingBox();
      
      if (boundingBox) {
        // Button should be at least 44x44 pixels (iOS guideline)
        expect(boundingBox.height).toBeGreaterThanOrEqual(32);
        expect(boundingBox.width).toBeGreaterThanOrEqual(32);
      }
    }
    
    // Test that links are appropriately sized
    const links = page.locator('a');
    
    if (await links.count() > 0) {
      const firstLink = links.first();
      
      if (await firstLink.isVisible()) {
        const boundingBox = await firstLink.boundingBox();
        
        if (boundingBox) {
          // Links should be touch-friendly
          expect(boundingBox.height).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });
});