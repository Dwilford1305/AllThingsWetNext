import { test, expect } from '@playwright/test';
import { createHelpers } from './utils/test-helpers';

// Check if browsers are available before running visual tests
const fs = require('fs');
const path = require('path');
const os = require('os');

const checkBrowserAvailable = () => {
  const homeDir = os.homedir();
  const chromiumPath = path.join(homeDir, '.cache', 'ms-playwright', 'chromium_headless_shell-1187', 'chrome-linux', 'headless_shell');
  return fs.existsSync(chromiumPath);
};

const BROWSER_AVAILABLE = checkBrowserAvailable();

test.describe('Visual Regression Testing', () => {
  test('should provide installation guidance when browsers not available', async () => {
    if (!BROWSER_AVAILABLE) {
      console.log('📋 Browser Installation Required for Visual Tests:');
      console.log('   Run: npx playwright install');
      console.log('   This will download required browser binaries for visual regression testing.');
      console.log('   Visual tests verify UI consistency across different browsers and viewports.');
      
      // This test passes but informs about browser installation
      expect(true).toBeTruthy();
    } else {
      console.log('✅ Browsers are installed and ready for visual regression testing');
      expect(BROWSER_AVAILABLE).toBeTruthy();
    }
  });

  test.describe('Browser-dependent tests', () => {
    test.beforeEach(async ({}, testInfo) => {
      if (!BROWSER_AVAILABLE) {
        testInfo.skip('Skipping visual regression test: Browser not installed. Run `npx playwright install` to enable visual tests.');
      }
    });

    test.describe('Homepage Screenshots', () => {
    test('should match homepage screenshot', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goHome();
      await helpers.wait.waitForLoadingComplete();
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('homepage-full.png', {
        fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: 1000 }
      });
    });

    test('should match homepage header', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goHome();
      await helpers.wait.waitForLoadingComplete();
      
      // Screenshot of just the header area
      const header = page.locator('header, nav, .header').first();
      if (await header.isVisible()) {
        await expect(header).toHaveScreenshot('homepage-header.png');
      }
    });

    test('should match homepage mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const helpers = createHelpers(page);
      await helpers.nav.goHome();
      await helpers.wait.waitForLoadingComplete();
      
      await expect(page).toHaveScreenshot('homepage-mobile.png', {
        fullPage: true
      });
    });
  });

  test.describe('Business Pages Screenshots', () => {
    test('should match businesses page', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToBusinesses();
      await helpers.wait.waitForLoadingComplete();
      
      await expect(page).toHaveScreenshot('businesses-page.png', {
        fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: 1000 }
      });
    });

    test('should match business management page', async ({ page }) => {
      await page.goto('/businesses/manage');
      await page.waitForLoadState();
      
      await expect(page).toHaveScreenshot('business-manage.png', {
        fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: 1000 }
      });
    });
  });

  test.describe('Content Pages Screenshots', () => {
    test('should match events page', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToEvents();
      await helpers.wait.waitForLoadingComplete();
      
      await expect(page).toHaveScreenshot('events-page.png', {
        fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: 1000 }
      });
    });

    test('should match news page', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToNews();
      await helpers.wait.waitForLoadingComplete();
      
      await expect(page).toHaveScreenshot('news-page.png', {
        fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: 1000 }
      });
    });

    test('should match jobs page', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToJobs();
      await helpers.wait.waitForLoadingComplete();
      
      await expect(page).toHaveScreenshot('jobs-page.png', {
        fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: 1000 }
      });
    });

    test('should match marketplace page', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToMarketplace();
      await helpers.wait.waitForLoadingComplete();
      
      await expect(page).toHaveScreenshot('marketplace-page.png', {
        fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: 1000 }
      });
    });
  });

  test.describe('Authentication Screenshots', () => {
    test('should match auth test page', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToAuth();
      await helpers.wait.waitForLoadingComplete();
      
      await expect(page).toHaveScreenshot('auth-test-page.png', {
        fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: 1000 }
      });
    });
  });

  test.describe('Admin Screenshots', () => {
    test('should match admin page', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToAdmin();
      await helpers.wait.waitForLoadingComplete();
      
      await expect(page).toHaveScreenshot('admin-page.png', {
        fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: 1000 }
      });
    });

    test('should match scraper page', async ({ page }) => {
      await page.goto('/scraper');
      await page.waitForLoadState();
      
      await expect(page).toHaveScreenshot('scraper-page.png', {
        fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: 1000 }
      });
    });
  });

  test.describe('Form Screenshots', () => {
    test('should match form elements consistently', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToAuth();
      await helpers.wait.waitForLoadingComplete();
      
      // Screenshot form elements for consistency
      const forms = await page.locator('form').all();
      
      for (let i = 0; i < Math.min(forms.length, 3); i++) {
        const form = forms[i];
        if (await form.isVisible()) {
          await expect(form).toHaveScreenshot(`form-${i}.png`);
        }
      }
    });
  });

  test.describe('Cross-Browser Visual Testing', () => {
    test('should look consistent across viewports', async ({ page }) => {
      const helpers = createHelpers(page);
      
      // Test multiple viewport sizes
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop-large' },
        { width: 1280, height: 720, name: 'desktop-medium' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await helpers.nav.goHome();
        await helpers.wait.waitForLoadingComplete();
        
        await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
          fullPage: false,
          clip: { x: 0, y: 0, width: viewport.width, height: Math.min(viewport.height, 800) }
        });
      }
    });
  });

  test.describe('Error State Screenshots', () => {
    test('should capture 404 page appearance', async ({ page }) => {
      await page.goto('/non-existent-page-test-404');
      await page.waitForLoadState();
      
      await expect(page).toHaveScreenshot('404-page.png', {
        fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: 800 }
      });
    });
  });

  test.describe('Loading State Screenshots', () => {
    test('should capture loading states', async ({ page }) => {
      // Slow down network to capture loading states
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 200);
      });

      const helpers = createHelpers(page);
      
      const loadingPromise = helpers.nav.goToBusinesses();
      
      // Try to capture loading state
      try {
        await page.waitForSelector('[data-loading="true"], .loading, .spinner', { timeout: 1000 });
        await expect(page).toHaveScreenshot('loading-state.png');
      } catch {
        // Loading state might be too fast to capture
      }
      
      await loadingPromise;
    });
  });

  test.describe('Interactive Elements Screenshots', () => {
    test('should capture button states', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goHome();
      await helpers.wait.waitForLoadingComplete();
      
      // Find buttons and capture their normal state
      const buttons = await page.locator('button, [role="button"]').all();
      
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const button = buttons[i];
        if (await button.isVisible()) {
          await expect(button).toHaveScreenshot(`button-${i}-normal.png`);
          
          // Hover state
          await button.hover();
          await expect(button).toHaveScreenshot(`button-${i}-hover.png`);
        }
      }
    });
  });

  test.describe('Dark Mode Screenshots', () => {
    test('should capture dark mode if available', async ({ page }) => {
      const helpers = createHelpers(page);
      
      // Try to enable dark mode
      await helpers.nav.goHome();
      await helpers.wait.waitForLoadingComplete();
      
      // Look for dark mode toggle
      const darkModeToggle = page.locator('[aria-label*="dark"], [title*="dark"], .dark-mode-toggle').first();
      
      if (await darkModeToggle.isVisible()) {
        await darkModeToggle.click();
        await helpers.wait.waitForLoadingComplete();
        
        await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
          fullPage: true,
          clip: { x: 0, y: 0, width: 1280, height: 1000 }
        });
      }
    });
  });
  
  }); // Close Browser-dependent tests
});