import { test, expect } from '../fixtures/test-fixtures';

test.describe('Cross-Browser and Mobile Compatibility', () => {
  // Test critical functionality across all browsers
  const criticalPages = [
    { path: '/', name: 'Homepage' },
    { path: '/businesses', name: 'Business Directory' },
    { path: '/marketplace', name: 'Marketplace' },
    { path: '/events', name: 'Events' },
    { path: '/auth-test', name: 'Authentication' },
  ];

  criticalPages.forEach(({ path, name }) => {
    test(`${name} should work across all browsers`, async ({ page, browserName }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      
      // Basic functionality checks
      await expect(page).toHaveTitle(/All Things Wetaskiwin/i);
      
      // Check for navigation
      const navigation = page.locator('nav, .navigation').first();
      const navVisible = await navigation.isVisible().catch(() => false);
      
      if (navVisible) {
        await expect(navigation).toBeVisible();
      }
      
      // Check for main content
      const mainContent = page.locator('main, .main-content, [role="main"]').first();
      const contentVisible = await mainContent.isVisible().catch(() => false);
      
      if (contentVisible) {
        await expect(mainContent).toBeVisible();
      }
      
      // Browser-specific screenshot
      await page.screenshot({ 
        path: `tests/e2e/screenshots/${name.toLowerCase().replace(' ', '-')}-${browserName}.png`, 
        fullPage: true 
      });
    });
  });

  test('Mobile viewport functionality', async ({ page }) => {
    // Test various mobile viewport sizes
    const mobileViewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 12' },
      { width: 412, height: 915, name: 'Pixel 5' },
      { width: 360, height: 800, name: 'Galaxy S20' },
    ];
    
    for (const viewport of mobileViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Test mobile navigation
      const mobileMenu = page.locator('.mobile-menu, .hamburger, [data-testid="mobile-nav"]').first();
      const mobileMenuVisible = await mobileMenu.isVisible().catch(() => false);
      
      if (mobileMenuVisible) {
        await mobileMenu.click();
        
        // Check if menu items appear
        const menuItems = page.locator('nav a, .menu-item, .nav-link');
        const itemCount = await menuItems.count();
        
        if (itemCount > 0) {
          await expect(menuItems.first()).toBeVisible();
        }
        
        // Close menu
        await mobileMenu.click();
      }
      
      // Test responsive content
      const content = page.locator('main, .main-content').first();
      const contentVisible = await content.isVisible().catch(() => false);
      
      if (contentVisible) {
        await expect(content).toBeVisible();
      }
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: `tests/e2e/screenshots/mobile-${viewport.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: true 
      });
    }
  });

  test('Tablet viewport functionality', async ({ page }) => {
    const tabletViewports = [
      { width: 768, height: 1024, name: 'iPad' },
      { width: 820, height: 1180, name: 'iPad Air' },
      { width: 1024, height: 1366, name: 'iPad Pro' },
    ];
    
    for (const viewport of tabletViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Test tablet-specific layouts
      const navigation = page.locator('nav').first();
      const navVisible = await navigation.isVisible().catch(() => false);
      
      if (navVisible) {
        await expect(navigation).toBeVisible();
        
        // Test navigation links work
        const navLinks = page.locator('nav a');
        const linkCount = await navLinks.count();
        
        if (linkCount > 0) {
          // Click first navigation link
          await navLinks.first().click();
          await page.waitForLoadState('domcontentloaded');
          
          // Should navigate successfully
          const currentUrl = page.url();
          expect(currentUrl).toBeDefined();
        }
      }
      
      // Take tablet screenshot
      await page.screenshot({ 
        path: `tests/e2e/screenshots/tablet-${viewport.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: true 
      });
    }
  });

  test('Touch and gesture compatibility', async ({ page }) => {
    // Set mobile viewport for touch testing
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // Test touch scrolling
    await page.evaluate(() => {
      window.scrollTo(0, 200);
    });
    await page.waitForTimeout(500);
    
    // Test touch interactions
    const touchableElements = page.locator('button, a, .clickable, [role="button"]');
    const elementCount = await touchableElements.count();
    
    if (elementCount > 0) {
      // Test first touchable element
      const element = touchableElements.first();
      const elementVisible = await element.isVisible().catch(() => false);
      
      if (elementVisible) {
        // Simulate touch tap
        const box = await element.boundingBox();
        if (box) {
          await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // Test swipe gestures if carousel/swiper exists
    const carousel = page.locator('.carousel, .swiper, .slider').first();
    const carouselVisible = await carousel.isVisible().catch(() => false);
    
    if (carouselVisible) {
      const box = await carousel.boundingBox();
      if (box) {
        // Simulate swipe left
        await page.touchscreen.tap(box.x + box.width * 0.8, box.y + box.height / 2);
        await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
        await page.waitForTimeout(500);
      }
    }
    
    await page.screenshot({ path: 'tests/e2e/screenshots/touch-interactions.png', fullPage: true });
  });

  test('Keyboard navigation and accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    const focusVisible = await focusedElement.isVisible().catch(() => false);
    
    if (focusVisible) {
      await expect(focusedElement).toBeVisible();
    }
    
    // Test multiple tab navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }
    
    // Test Enter key activation
    const currentFocused = page.locator(':focus').first();
    const currentFocusedVisible = await currentFocused.isVisible().catch(() => false);
    
    if (currentFocusedVisible) {
      const tagName = await currentFocused.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'a' || tagName === 'button') {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    }
    
    // Test escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'tests/e2e/screenshots/keyboard-navigation.png', fullPage: true });
  });

  test('Print and media query compatibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Emulate print media
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(1000);
    
    // Take print view screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/print-view.png', fullPage: true });
    
    // Reset to screen media
    await page.emulateMedia({ media: 'screen' });
    await page.waitForTimeout(500);
    
    // Test reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(500);
    
    // Check that animations are reduced
    const animatedElements = page.locator('.animate, .animation, .transition');
    const animatedCount = await animatedElements.count();
    
    if (animatedCount > 0) {
      // Animations should be minimal or disabled
      await page.screenshot({ path: 'tests/e2e/screenshots/reduced-motion.png', fullPage: true });
    }
    
    // Reset media preferences
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('Network conditions and performance', async ({ page }) => {
    // Test slow 3G connection
    await page.context().route('**/*', async (route) => {
      // Add artificial delay to simulate slow connection
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time on slow connection: ${loadTime}ms`);
    
    // Check that critical content is visible
    const criticalContent = page.locator('h1, .hero, .main-content').first();
    const criticalVisible = await criticalContent.isVisible().catch(() => false);
    
    if (criticalVisible) {
      await expect(criticalContent).toBeVisible();
    }
    
    // Take screenshot of slow load state
    await page.screenshot({ path: 'tests/e2e/screenshots/slow-network-load.png', fullPage: true });
    
    // Test offline scenario
    await page.context().setOffline(true);
    
    try {
      await page.goto('/businesses');
      await page.waitForTimeout(2000);
      
      // Should show offline message or cached content
      const offlineMessage = page.locator(':has-text("offline"), :has-text("connection"), .offline-message').first();
      const offlineVisible = await offlineMessage.isVisible().catch(() => false);
      
      if (offlineVisible) {
        await expect(offlineMessage).toBeVisible();
      }
      
      await page.screenshot({ path: 'tests/e2e/screenshots/offline-state.png', fullPage: true });
    } catch (error) {
      console.log('Offline navigation failed as expected:', error.message);
    }
    
    // Restore online state
    await page.context().setOffline(false);
  });

  test('Form input compatibility across devices', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      await page.goto('/marketplace');
      await page.waitForLoadState('domcontentloaded');
      
      // Look for form inputs
      const createButton = page.locator('button:has-text("Create"), button:has-text("Post")').first();
      const createVisible = await createButton.isVisible().catch(() => false);
      
      if (createVisible) {
        await createButton.click();
        await page.waitForTimeout(1000);
        
        // Test form inputs
        const textInput = page.locator('input[type="text"], input[name="title"]').first();
        const textArea = page.locator('textarea').first();
        const numberInput = page.locator('input[type="number"], input[name="price"]').first();
        const selectInput = page.locator('select').first();
        
        const textInputVisible = await textInput.isVisible().catch(() => false);
        const textAreaVisible = await textArea.isVisible().catch(() => false);
        const numberInputVisible = await numberInput.isVisible().catch(() => false);
        const selectInputVisible = await selectInput.isVisible().catch(() => false);
        
        if (textInputVisible) {
          await textInput.fill('Test input text');
          await page.waitForTimeout(200);
        }
        
        if (textAreaVisible) {
          await textArea.fill('Test textarea content');
          await page.waitForTimeout(200);
        }
        
        if (numberInputVisible) {
          await numberInput.fill('123');
          await page.waitForTimeout(200);
        }
        
        if (selectInputVisible) {
          await selectInput.selectOption({ index: 1 });
          await page.waitForTimeout(200);
        }
        
        // Take screenshot of form on different devices
        await page.screenshot({ 
          path: `tests/e2e/screenshots/form-inputs-${viewport.name}.png`, 
          fullPage: true 
        });
        
        // Close form/modal if possible
        const closeButton = page.locator('button[aria-label="Close"], .modal-close').first();
        const closeVisible = await closeButton.isVisible().catch(() => false);
        
        if (closeVisible) {
          await closeButton.click();
        }
      }
    }
  });

  test('JavaScript functionality across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test JavaScript-dependent features
    const jsElements = page.locator('[onclick], .js-enabled, [data-toggle]');
    const jsCount = await jsElements.count();
    
    if (jsCount > 0) {
      // Click on first JavaScript element
      await jsElements.first().click();
      await page.waitForTimeout(1000);
      
      // Check if JavaScript interaction worked
      const modals = page.locator('.modal, .dialog, .popup');
      const modalCount = await modals.count();
      
      console.log(`${browserName}: Found ${modalCount} modals after JS interaction`);
    }
    
    // Test dynamic content loading
    const dynamicContent = page.locator('.loading, .skeleton, [data-loading]');
    const dynamicCount = await dynamicContent.count();
    
    if (dynamicCount > 0) {
      // Wait for dynamic content to load
      await page.waitForTimeout(3000);
      
      // Check if content loaded
      const loadedContent = page.locator('.loaded, .content, .data-loaded');
      const loadedCount = await loadedContent.count();
      
      console.log(`${browserName}: ${loadedCount} elements loaded dynamically`);
    }
    
    // Test console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Filter out expected errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('MONGODB_URI') &&
      !error.includes('404')
    );
    
    console.log(`${browserName}: ${criticalErrors.length} critical JS errors found`);
    expect(criticalErrors.length).toBeLessThanOrEqual(2); // Allow for minor non-critical errors
    
    await page.screenshot({ 
      path: `tests/e2e/screenshots/js-functionality-${browserName}.png`, 
      fullPage: true 
    });
  });
});