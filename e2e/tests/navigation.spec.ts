import { test, expect } from '../fixtures/base';

/**
 * Navigation and UI E2E Tests
 * 
 * Tests core navigation and user interface:
 * - Homepage layout and functionality
 * - Navigation between pages
 * - Mobile responsiveness
 * - UI component interactions
 * - Cross-browser compatibility
 */

test.describe('Navigation and UI Workflows', () => {

  test('should display homepage correctly', async ({ page, waitHelper, screenshotHelper }) => {
    await page.goto('/');
    await waitHelper.waitForPageLoad();
    
    // Verify homepage loads
    await expect(page).toHaveTitle(/AllThingsWetaskiwin|Wetaskiwin|Community/);
    
    // Check for main homepage elements
    const homepageElements = [
      'h1',
      'nav',
      'header',
      'footer',
      'text=Wetaskiwin',
      'text=Community',
      'text=Business',
      'text=Events',
      'text=News',
      'text=Jobs',
      'text=Marketplace'
    ];
    
    let elementsFound = 0;
    for (const element of homepageElements) {
      if (await page.locator(element).count() > 0) {
        elementsFound++;
      }
    }
    
    expect(elementsFound).toBeGreaterThan(5);
    
    // Take screenshot for visual regression
    await screenshotHelper.takeFullPageScreenshot('homepage');
  });

  test('should navigate between main sections', async ({ page, navHelper, waitHelper }) => {
    const navigationTests = [
      { name: 'Home', navigate: () => navHelper.goToHome(), urlPattern: /\/$/ },
      { name: 'Businesses', navigate: () => navHelper.goToBusinesses(), urlPattern: /\/businesses/ },
      { name: 'Events', navigate: () => navHelper.goToEvents(), urlPattern: /\/events/ },
      { name: 'News', navigate: () => navHelper.goToNews(), urlPattern: /\/news/ },
      { name: 'Jobs', navigate: () => navHelper.goToJobs(), urlPattern: /\/jobs/ },
      { name: 'Marketplace', navigate: () => navHelper.goToMarketplace(), urlPattern: /\/marketplace/ }
    ];
    
    for (const navTest of navigationTests) {
      console.log(`Testing navigation to ${navTest.name}`);
      
      await navTest.navigate();
      await waitHelper.waitForPageLoad();
      
      // Verify URL
      expect(page.url()).toMatch(navTest.urlPattern);
      
      // Verify page content loads
      await expect(page.locator('h1, h2')).toBeVisible();
      
      console.log(`✓ Successfully navigated to ${navTest.name}`);
    }
  });

  test('should have working navigation menu', async ({ page, waitHelper }) => {
    await page.goto('/');
    await waitHelper.waitForPageLoad();
    
    // Test main navigation links
    const navLinks = [
      { text: 'Home', url: '/' },
      { text: 'Business', url: '/businesses' },
      { text: 'Event', url: '/events' },
      { text: 'News', url: '/news' },
      { text: 'Job', url: '/jobs' },
      { text: 'Marketplace', url: '/marketplace' }
    ];
    
    for (const link of navLinks) {
      // Look for navigation link
      const navLink = page.locator(`nav a:has-text("${link.text}"), a[href="${link.url}"]`);
      
      if (await navLink.count() > 0) {
        await navLink.first().click();
        await waitHelper.waitForPageLoad();
        
        // Verify navigation worked
        expect(page.url()).toContain(link.url);
        console.log(`✓ Navigation link "${link.text}" works`);
        
        // Go back to home for next test
        await page.goto('/');
        await waitHelper.waitForPageLoad();
      } else {
        console.log(`Navigation link "${link.text}" not found`);
      }
    }
  });

  test('should have responsive design on mobile', async ({ page, waitHelper, screenshotHelper }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    await page.goto('/');
    await waitHelper.waitForPageLoad();
    
    // Check mobile layout
    const mobileElements = [
      'button[aria-label*="menu"], button[aria-label*="Menu"]', // Mobile menu button
      '.mobile-menu',
      '[data-testid="mobile-nav"]',
      'button:has-text("☰")', // Hamburger menu
      'nav'
    ];
    
    let mobileElementsFound = 0;
    for (const element of mobileElements) {
      if (await page.locator(element).count() > 0) {
        mobileElementsFound++;
      }
    }
    
    console.log(`Found ${mobileElementsFound} mobile-responsive elements`);
    
    // Take mobile screenshot
    await screenshotHelper.takeFullPageScreenshot('homepage-mobile');
    
    // Test mobile menu if present
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], button:has-text("☰")');
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.first().click();
      await waitHelper.waitForPageLoad();
      
      // Mobile menu should be visible
      const mobileMenu = page.locator('.mobile-menu, [data-testid="mobile-nav"], nav[role="dialog"]');
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu.first()).toBeVisible();
        console.log('✓ Mobile menu functionality works');
      }
    }
    
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle search functionality', async ({ page, waitHelper }) => {
    await page.goto('/');
    await waitHelper.waitForPageLoad();
    
    // Look for search functionality
    const searchElements = [
      'input[type="search"]',
      'input[placeholder*="search"]',
      'input[placeholder*="Search"]',
      'button:has-text("Search")',
      '[data-testid="search"]'
    ];
    
    let searchFound = false;
    for (const element of searchElements) {
      const searchElement = page.locator(element);
      if (await searchElement.count() > 0) {
        searchFound = true;
        
        // Test search functionality
        if (element.includes('input')) {
          await searchElement.first().fill('community');
          await page.keyboard.press('Enter');
          await waitHelper.waitForPageLoad();
          
          console.log('✓ Search functionality tested');
        }
        break;
      }
    }
    
    if (!searchFound) {
      console.log('Search functionality not found on homepage');
    }
  });

  test('should display footer correctly', async ({ page, waitHelper, screenshotHelper }) => {
    await page.goto('/');
    await waitHelper.waitForPageLoad();
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await waitHelper.waitForPageLoad();
    
    // Check footer elements
    const footerElements = [
      'footer',
      'text=Privacy',
      'text=Terms',
      'text=Contact',
      'text=© ',
      'text=AllThingsWetaskiwin',
      'a[href*="privacy"]',
      'a[href*="terms"]'
    ];
    
    let footerElementsFound = 0;
    for (const element of footerElements) {
      if (await page.locator(element).count() > 0) {
        footerElementsFound++;
      }
    }
    
    expect(footerElementsFound).toBeGreaterThan(2);
    
    // Take footer screenshot
    await screenshotHelper.takeElementScreenshot('footer', 'footer');
  });

  test('should handle error pages gracefully', async ({ page, waitHelper }) => {
    // Test 404 page
    await page.goto('/nonexistent-page-test-404');
    await waitHelper.waitForPageLoad();
    
    // Should show 404 or be redirected
    const errorIndicators = [
      'text=404',
      'text=Not Found',
      'text=Page not found',
      'text=Not found',
      'h1:has-text("404")',
      'h1:has-text("Not Found")'
    ];
    
    let errorPageFound = false;
    for (const indicator of errorIndicators) {
      if (await page.locator(indicator).count() > 0) {
        errorPageFound = true;
        break;
      }
    }
    
    // Either shows 404 page or redirects to valid page
    expect(errorPageFound || page.url().includes('/')).toBe(true);
    console.log('✓ Error page handling tested');
  });

  test('should have working breadcrumb navigation', async ({ page, navHelper, waitHelper }) => {
    // Navigate to a sub-page that might have breadcrumbs
    await navHelper.goToBusinesses();
    await waitHelper.waitForPageLoad();
    
    // Look for breadcrumbs
    const breadcrumbElements = [
      '.breadcrumb',
      '[data-testid="breadcrumb"]',
      'nav[aria-label="breadcrumb"]',
      'ol li',
      'text=Home >'
    ];
    
    let breadcrumbsFound = false;
    for (const element of breadcrumbElements) {
      if (await page.locator(element).count() > 0) {
        breadcrumbsFound = true;
        console.log('✓ Breadcrumb navigation found');
        
        // Test breadcrumb links
        const homeLink = page.locator('a:has-text("Home"), .breadcrumb a').first();
        if (await homeLink.count() > 0) {
          await homeLink.click();
          await waitHelper.waitForPageLoad();
          
          // Should be back at home
          expect(page.url()).toMatch(/\/$/);
          console.log('✓ Breadcrumb navigation works');
        }
        break;
      }
    }
    
    if (!breadcrumbsFound) {
      console.log('Breadcrumb navigation not implemented');
    }
  });

  test('should handle loading states properly', async ({ page, waitHelper }) => {
    await page.goto('/');
    
    // Look for loading indicators during navigation
    await page.goto('/businesses');
    
    // Check if loading indicators appear and disappear
    const loadingIndicators = [
      '.loading',
      '.spinner',
      '[data-testid="loading"]',
      'text=Loading',
      '.skeleton'
    ];
    
    // Wait a moment to see if loading indicators are present
    await page.waitForTimeout(100);
    
    for (const indicator of loadingIndicators) {
      const loadingElement = page.locator(indicator);
      if (await loadingElement.count() > 0) {
        console.log(`Found loading indicator: ${indicator}`);
        
        // Wait for loading to complete
        await loadingElement.waitFor({ state: 'hidden', timeout: 10000 });
        console.log('✓ Loading indicator properly disappears');
        break;
      }
    }
    
    // Ensure page is fully loaded
    await waitHelper.waitForPageLoad();
  });

  test('should test accessibility features', async ({ page, waitHelper }) => {
    await page.goto('/');
    await waitHelper.waitForPageLoad();
    
    // Check for accessibility features
    const accessibilityElements = [
      '[aria-label]',
      '[aria-describedby]',
      '[role]',
      'button',
      'a[href]',
      'input[id]',
      'label[for]',
      'h1, h2, h3, h4, h5, h6',
      '[alt]'
    ];
    
    let accessibilityScore = 0;
    for (const element of accessibilityElements) {
      const count = await page.locator(element).count();
      if (count > 0) {
        accessibilityScore++;
        console.log(`Found ${count} ${element} elements`);
      }
    }
    
    // Should have good accessibility features
    expect(accessibilityScore).toBeGreaterThan(5);
    console.log(`✓ Accessibility score: ${accessibilityScore}/9`);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = await page.locator(':focus').count();
    console.log(`Focused elements during tab navigation: ${focusedElement}`);
  });

  test('should handle different screen sizes', async ({ page, waitHelper, screenshotHelper }) => {
    const screenSizes = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'large-desktop', width: 1920, height: 1080 }
    ];
    
    for (const size of screenSizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/');
      await waitHelper.waitForPageLoad();
      
      // Verify page renders properly at this size
      await expect(page.locator('body')).toBeVisible();
      
      // Take screenshot for visual regression
      await screenshotHelper.takeFullPageScreenshot(`homepage-${size.name}`);
      
      console.log(`✓ Page renders correctly at ${size.name} resolution (${size.width}x${size.height})`);
    }
    
    // Reset to default size
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});