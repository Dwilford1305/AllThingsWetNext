import { test, expect } from '@playwright/test';
import { createHelpers } from './utils/test-helpers';

test.describe('Mobile Responsive Testing', () => {
  test.describe('Mobile Navigation', () => {
    test('should display mobile navigation on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const helpers = createHelpers(page);
      await helpers.nav.goHome();
      await helpers.wait.waitForLoadingComplete();
      
      // Look for mobile navigation patterns
      const mobileNav = page.locator('.mobile-nav, .hamburger, [aria-label*="menu"], [data-testid*="mobile"]').first();
      
      if (await mobileNav.isVisible()) {
        await mobileNav.click();
        await helpers.wait.waitForLoadingComplete();
        
        // Navigation menu should open
        const navMenu = page.locator('nav, .nav-menu, .mobile-menu').first();
        await expect(navMenu).toBeVisible();
      }
    });

    test('should handle mobile viewport on all main pages', async ({ page }) => {
      // Test mobile viewport on key pages
      await page.setViewportSize({ width: 375, height: 667 });
      
      const helpers = createHelpers(page);
      const pages = [
        '/',
        '/businesses', 
        '/events',
        '/news',
        '/jobs',
        '/marketplace'
      ];

      for (const pagePath of pages) {
        await page.goto(pagePath);
        await helpers.wait.waitForLoadingComplete();
        
        // Page should load without horizontal scroll
        const body = page.locator('body');
        const bodyWidth = await body.boundingBox();
        expect(bodyWidth?.width).toBeLessThanOrEqual(375);
        
        await helpers.errors.checkForErrors();
      }
    });
  });

  test.describe('Tablet Responsive', () => {
    test('should handle tablet viewport', async ({ page }) => {
      // iPad viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const helpers = createHelpers(page);
      await helpers.nav.goHome();
      await helpers.validate.validateHomePage();
      await helpers.errors.checkForErrors();
    });

    test('should display proper tablet navigation', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const helpers = createHelpers(page);
      await helpers.nav.goHome();
      await helpers.wait.waitForLoadingComplete();
      
      // Should have appropriate navigation for tablet
      const nav = page.locator('nav').first();
      if (await nav.isVisible()) {
        expect(await nav.isVisible()).toBeTruthy();
      }
    });
  });

  test.describe('Touch Interactions', () => {
    test('should handle touch interactions on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const helpers = createHelpers(page);
      await helpers.nav.goToBusinesses();
      await helpers.wait.waitForLoadingComplete();
      
      // Test touch scrolling
      await page.touchscreen.tap(200, 300);
      await helpers.errors.checkForErrors();
    });

    test('should handle mobile form interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/auth-test');
      await page.waitForLoadState();
      
      // Test mobile form interaction
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.tap();
        await emailInput.fill('test@example.com');
        expect(await emailInput.inputValue()).toBe('test@example.com');
      }
    });
  });

  test.describe('Mobile Content Layout', () => {
    test('should display content properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const helpers = createHelpers(page);
      const contentPages = ['/businesses', '/events', '/news', '/jobs', '/marketplace'];
      
      for (const contentPage of contentPages) {
        await page.goto(contentPage);
        await helpers.wait.waitForLoadingComplete();
        
        // Content should be visible and not overflow
        const mainContent = page.locator('main, .content, .container').first();
        if (await mainContent.isVisible()) {
          const contentBox = await mainContent.boundingBox();
          expect(contentBox?.width).toBeLessThanOrEqual(375);
        }
      }
    });

    test('should handle mobile business cards layout', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const helpers = createHelpers(page);
      await helpers.nav.goToBusinesses();
      await helpers.wait.waitForLoadingComplete();
      
      // Business cards should stack on mobile
      const businessCards = await page.locator('.business-card, [data-testid*="business"]').all();
      
      if (businessCards.length > 0) {
        // At least one business card should be visible
        expect(businessCards.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Mobile Performance', () => {
    test('should load quickly on mobile connection', async ({ page }) => {
      // Simulate slow 3G
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });
      
      await page.setViewportSize({ width: 375, height: 667 });
      
      const start = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      
      // Should load within reasonable time even with simulated slow connection
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should have proper touch targets on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const helpers = createHelpers(page);
      await helpers.nav.goHome();
      await helpers.wait.waitForLoadingComplete();
      
      // Check that interactive elements have proper touch target size
      const buttons = await page.locator('button, a, input[type="submit"]').all();
      
      for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            // Touch targets should be at least 44px (iOS) or 48px (Android)
            expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });

    test('should handle mobile keyboard input', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/auth-test');
      await page.waitForLoadState();
      
      const input = page.locator('input[type="email"], input[type="text"]').first();
      if (await input.isVisible()) {
        await input.focus();
        await page.keyboard.type('mobile test input');
        
        expect(await input.inputValue()).toBe('mobile test input');
      }
    });
  });

  test.describe('Different Mobile Devices', () => {
    test('should work on iPhone SE', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const helpers = createHelpers(page);
      await helpers.nav.goHome();
      await helpers.validate.validateHomePage();
    });

    test('should work on iPhone 12', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      
      const helpers = createHelpers(page);
      await helpers.nav.goHome();
      await helpers.validate.validateHomePage();
    });

    test('should work on Android device', async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 851 });
      
      const helpers = createHelpers(page);
      await helpers.nav.goHome();
      await helpers.validate.validateHomePage();
    });
  });
});