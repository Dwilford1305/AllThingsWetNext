import { test, expect } from '../fixtures/test-fixtures';

test.describe('Visual Regression Testing', () => {
  test('should capture baseline screenshots for key pages', async ({ page }) => {
    // Homepage baseline
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for dynamic content
    
    await expect(page).toHaveScreenshot('homepage-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Business directory baseline
    await page.goto('/businesses');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('businesses-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Events page baseline
    await page.goto('/events');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('events-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Marketplace baseline
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('marketplace-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // News page baseline
    await page.goto('/news');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('news-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Jobs page baseline
    await page.goto('/jobs');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('jobs-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should capture admin dashboard baseline', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('admin-dashboard-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should capture authentication pages baseline', async ({ page }) => {
    await page.goto('/auth-test');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('auth-test-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('profile-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should capture business management baseline', async ({ page }) => {
    await page.goto('/businesses/manage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('business-management-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should capture subscription pages baseline', async ({ page }) => {
    await page.goto('/upgrade-demo');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('upgrade-demo-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should capture mobile viewport baselines', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Homepage mobile
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-mobile-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Business directory mobile
    await page.goto('/businesses');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('businesses-mobile-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Marketplace mobile
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('marketplace-mobile-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should capture tablet viewport baselines', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Homepage tablet
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-tablet-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Admin dashboard tablet
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('admin-tablet-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should detect visual changes in key components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test navigation component
    const navigation = page.locator('nav, .navigation, [data-testid="navigation"]').first();
    const navVisible = await navigation.isVisible().catch(() => false);
    
    if (navVisible) {
      await expect(navigation).toHaveScreenshot('navigation-component.png', {
        animations: 'disabled',
      });
    }
    
    // Test footer component
    const footer = page.locator('footer, .footer, [data-testid="footer"]').first();
    const footerVisible = await footer.isVisible().catch(() => false);
    
    if (footerVisible) {
      await expect(footer).toHaveScreenshot('footer-component.png', {
        animations: 'disabled',
      });
    }
    
    // Test main content area
    const mainContent = page.locator('main, .main-content, [role="main"]').first();
    const mainVisible = await mainContent.isVisible().catch(() => false);
    
    if (mainVisible) {
      await expect(mainContent).toHaveScreenshot('main-content-component.png', {
        animations: 'disabled',
      });
    }
  });

  test('should capture error and loading states', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('404-page-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Test loading states by intercepting slow APIs
    await page.route('**/api/businesses', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });
    
    await page.goto('/businesses');
    
    // Capture loading state
    const loadingElement = page.locator('.loading, .spinner, .skeleton, [data-testid="loading"]').first();
    const loadingVisible = await loadingElement.isVisible().catch(() => false);
    
    if (loadingVisible) {
      await expect(loadingElement).toHaveScreenshot('loading-state.png', {
        animations: 'disabled',
      });
    }
    
    // Wait for content to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should capture form and modal states', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for modal triggers
    const modalTrigger = page.locator('button:has-text("Create"), button:has-text("Post"), .modal-trigger').first();
    const triggerVisible = await modalTrigger.isVisible().catch(() => false);
    
    if (triggerVisible) {
      await modalTrigger.click();
      await page.waitForTimeout(1000);
      
      // Capture modal state
      const modal = page.locator('.modal, .dialog, [role="dialog"]').first();
      const modalVisible = await modal.isVisible().catch(() => false);
      
      if (modalVisible) {
        await expect(modal).toHaveScreenshot('modal-component.png', {
          animations: 'disabled',
        });
      }
      
      // Capture form state
      const form = page.locator('form').first();
      const formVisible = await form.isVisible().catch(() => false);
      
      if (formVisible) {
        await expect(form).toHaveScreenshot('form-component.png', {
          animations: 'disabled',
        });
      }
    }
  });

  test('should capture business-specific visual states', async ({ page }) => {
    await page.goto('/businesses');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Capture business card components
    const businessCards = page.locator('.business-card, .business-item, [data-testid="business-card"]');
    const cardCount = await businessCards.count();
    
    if (cardCount > 0) {
      await expect(businessCards.first()).toHaveScreenshot('business-card-component.png', {
        animations: 'disabled',
      });
    }
    
    // Test business search results
    const searchInput = page.locator('input[name="search"], input[placeholder*="search"]').first();
    const searchVisible = await searchInput.isVisible().catch(() => false);
    
    if (searchVisible) {
      await searchInput.fill('restaurant');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('business-search-results.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('should validate consistent styling across pages', async ({ page }) => {
    const pages = [
      '/',
      '/events',
      '/businesses',
      '/news',
      '/jobs',
      '/marketplace'
    ];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      // Capture header consistency
      const header = page.locator('header, .header, nav').first();
      const headerVisible = await header.isVisible().catch(() => false);
      
      if (headerVisible) {
        const pageName = pagePath.replace('/', '') || 'homepage';
        await expect(header).toHaveScreenshot(`${pageName}-header.png`, {
          animations: 'disabled',
        });
      }
      
      // Capture footer consistency
      const footer = page.locator('footer, .footer').first();
      const footerVisible = await footer.isVisible().catch(() => false);
      
      if (footerVisible) {
        const pageName = pagePath.replace('/', '') || 'homepage';
        await expect(footer).toHaveScreenshot(`${pageName}-footer.png`, {
          animations: 'disabled',
        });
      }
    }
  });

  test('should capture theme and color consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for theme toggles if they exist
    const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, button:has-text("Dark"), button:has-text("Light")').first();
    const toggleVisible = await themeToggle.isVisible().catch(() => false);
    
    if (toggleVisible) {
      // Capture light theme
      await expect(page).toHaveScreenshot('homepage-light-theme.png', {
        fullPage: true,
        animations: 'disabled',
      });
      
      // Toggle to dark theme
      await themeToggle.click();
      await page.waitForTimeout(1000);
      
      // Capture dark theme
      await expect(page).toHaveScreenshot('homepage-dark-theme.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
    
    // Capture color palette elements
    const colorElements = page.locator('.btn, .button, .card, .badge, .alert');
    const elementCount = await colorElements.count();
    
    if (elementCount > 0) {
      // Take screenshot of first few colored elements for color consistency checking
      for (let i = 0; i < Math.min(3, elementCount); i++) {
        const element = colorElements.nth(i);
        const elementVisible = await element.isVisible().catch(() => false);
        
        if (elementVisible) {
          await expect(element).toHaveScreenshot(`color-element-${i}.png`, {
            animations: 'disabled',
          });
        }
      }
    }
  });
});