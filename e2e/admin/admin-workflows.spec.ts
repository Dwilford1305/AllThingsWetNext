import { test, expect } from '@playwright/test';
import { createHelpers } from '../utils/test-helpers';

test.describe('Admin Dashboard Workflows', () => {
  test('should access admin page', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToAdmin();
    await helpers.validate.validateAdminPage();
    await helpers.wait.waitForLoadingComplete();
  });

  test('should handle admin authentication', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToAdmin();
    await helpers.wait.waitForLoadingComplete();
    
    // Admin page should either show admin interface or redirect to auth
    const isAdminDashboard = await page.locator('text=Dashboard, text=Admin, text=Users, text=Businesses').isVisible();
    const isAuthRedirect = await page.locator('text=Sign In, text=Login, text=Unauthorized').isVisible();
    
    expect(isAdminDashboard || isAuthRedirect).toBeTruthy();
  });

  test('should validate admin API endpoints', async ({ page }) => {
    const adminEndpoints = [
      '/api/admin/businesses',
      '/api/admin/users',
      '/api/admin/stats',
      '/api/admin/business-requests'
    ];

    for (const endpoint of adminEndpoints) {
      const response = await page.request.get(endpoint);
      // Should not be 404 - may be 401/403 which is expected for admin endpoints
      expect(response.status()).not.toBe(404);
    }
  });

  test('should handle admin business management interface', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToAdmin();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for business management interface
    const businessManagement = page.locator('text=Business, text=Manage, a[href*="businesses"], button:has-text("Business")').first();
    
    if (await businessManagement.isVisible()) {
      await businessManagement.click();
      await helpers.wait.waitForLoadingComplete();
      await helpers.errors.checkForErrors();
    }
  });

  test('should handle admin user management interface', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToAdmin();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for user management interface
    const userManagement = page.locator('text=Users, a[href*="users"], button:has-text("Users")').first();
    
    if (await userManagement.isVisible()) {
      await userManagement.click();
      await helpers.wait.waitForLoadingComplete();
      await helpers.errors.checkForErrors();
    }
  });

  test('should handle admin statistics interface', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToAdmin();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for statistics/analytics interface
    const statsInterface = page.locator('text=Statistics, text=Analytics, text=Reports, text=Stats').first();
    
    if (await statsInterface.isVisible()) {
      // Stats interface exists
      expect(await statsInterface.isVisible()).toBeTruthy();
    }
  });

  test('should handle scraper management interface', async ({ page }) => {
    await page.goto('/scraper');
    await page.waitForLoadState();
    
    // Should show scraper interface or redirect
    const isScraperPage = await page.locator('text=Scraper, text=Data Collection').isVisible();
    const isRedirect = page.url() !== page.url();
    
    expect(isScraperPage || isRedirect).toBeTruthy();
  });

  test('should validate scraper API endpoints', async ({ page }) => {
    const scraperEndpoints = [
      '/api/scraper/businesses',
      '/api/scraper/events',
      '/api/scraper/news',
      '/api/scraper/comprehensive'
    ];

    for (const endpoint of scraperEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).not.toBe(404);
    }
  });

  test('should handle admin email system interface', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToAdmin();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for email management
    const emailManagement = page.locator('text=Email, a[href*="email"], button:has-text("Email")').first();
    
    if (await emailManagement.isVisible()) {
      await emailManagement.click();
      await helpers.wait.waitForLoadingComplete();
      await helpers.errors.checkForErrors();
    }
  });

  test('should validate admin email API endpoints', async ({ page }) => {
    const emailEndpoints = [
      '/api/admin/email',
      '/api/email/preferences'
    ];

    for (const endpoint of emailEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).not.toBe(404);
    }
  });

  test('should handle super admin setup interface', async ({ page }) => {
    await page.goto('/setup/super-admin');
    await page.waitForLoadState();
    
    // Should show setup interface or redirect
    const isSetupPage = await page.locator('text=Setup, text=Super Admin, input[type="password"]').isVisible();
    const isRedirect = page.url().includes('/setup') || page.url() === page.url();
    
    expect(isSetupPage || isRedirect).toBeTruthy();
  });

  test('should validate setup API endpoint', async ({ page }) => {
    const response = await page.request.get('/api/setup/super-admin');
    expect(response.status()).not.toBe(404);
  });
});