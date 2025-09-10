import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for visual testing
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('homepage visual consistency', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of homepage
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('navigation menu visual consistency', async ({ page }) => {
    await page.goto('/');
    
    // Wait for navigation to be visible
    await expect(page.locator('nav')).toBeVisible();
    
    // Take screenshot of navigation
    await expect(page.locator('nav')).toHaveScreenshot('navigation.png');
  });

  test('business directory visual layout', async ({ page }) => {
    await page.goto('/businesses');
    
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of business directory
    await expect(page).toHaveScreenshot('businesses-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('events page visual layout', async ({ page }) => {
    await page.goto('/events');
    
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of events page
    await expect(page).toHaveScreenshot('events-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('marketplace visual layout', async ({ page }) => {
    await page.goto('/marketplace');
    
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of marketplace
    await expect(page).toHaveScreenshot('marketplace-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('admin dashboard visual layout', async ({ page }) => {
    await page.goto('/admin');
    
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of admin interface
    await expect(page).toHaveScreenshot('admin-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('responsive design - tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const pages = ['/', '/businesses', '/events', '/marketplace'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      const pageName = pagePath === '/' ? 'homepage' : pagePath.slice(1);
      await expect(page).toHaveScreenshot(`${pageName}-tablet.png`, {
        animations: 'disabled'
      });
    }
  });

  test('responsive design - mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const pages = ['/', '/businesses', '/events', '/marketplace'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      const pageName = pagePath === '/' ? 'homepage' : pagePath.slice(1);
      await expect(page).toHaveScreenshot(`${pageName}-mobile.png`, {
        animations: 'disabled'
      });
    }
  });

  test('dark mode visual consistency', async ({ page }) => {
    // Test if dark mode is available
    await page.goto('/');
    
    // Look for dark mode toggle
    const darkModeToggle = page.locator('button:has-text("Dark"), [data-theme="dark"], .dark-mode-toggle');
    
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot in dark mode
      await expect(page).toHaveScreenshot('homepage-dark.png', {
        animations: 'disabled'
      });
    }
  });

  test('form elements visual consistency', async ({ page }) => {
    await page.goto('/auth-test');
    
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of auth forms
    await expect(page).toHaveScreenshot('auth-forms.png', {
      animations: 'disabled'
    });
  });

  test('error page visual layout', async ({ page }) => {
    // Navigate to non-existent page to test 404
    await page.goto('/non-existent-page');
    
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of error page
    await expect(page).toHaveScreenshot('error-page.png', {
      animations: 'disabled'
    });
  });

  test('loading states visual consistency', async ({ page }) => {
    await page.goto('/businesses');
    
    // Try to capture loading state
    const loadingElements = page.locator('.loading, .spinner, [data-testid="loading"]');
    
    if (await loadingElements.first().isVisible()) {
      await expect(loadingElements.first()).toHaveScreenshot('loading-state.png');
    }
  });

  test('button and interactive elements visual states', async ({ page }) => {
    await page.goto('/');
    
    // Find buttons to test hover states
    const buttons = page.locator('button').first();
    
    if (await buttons.isVisible()) {
      // Take screenshot of normal state
      await expect(buttons).toHaveScreenshot('button-normal.png');
      
      // Hover and take screenshot
      await buttons.hover();
      await expect(buttons).toHaveScreenshot('button-hover.png');
    }
  });
});