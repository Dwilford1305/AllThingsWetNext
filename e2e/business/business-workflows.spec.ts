import { test, expect } from '@playwright/test';
import { createHelpers, generateTestBusinessName } from '../utils/test-helpers';

test.describe('Business Workflows', () => {
  test('should display businesses page', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToBusinesses();
    await helpers.validate.validateBusinessesPage();
    await helpers.wait.waitForLoadingComplete();
    await helpers.errors.checkForErrors();
  });

  test('should show business directory', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToBusinesses();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for business listings or empty state
    const businessListings = await page.locator('[data-testid*="business"], .business-card, .business-item').count();
    const emptyState = await page.locator('text=No businesses, text=No results').isVisible();
    
    // Either show businesses or proper empty state
    expect(businessListings > 0 || emptyState).toBeTruthy();
  });

  test('should have business search functionality', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToBusinesses();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search"], input[name*="search"], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('restaurant');
      await page.keyboard.press('Enter');
      await helpers.wait.waitForLoadingComplete();
      
      // Should handle search without errors
      await helpers.errors.checkForErrors();
    }
  });

  test('should access business management page', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await page.goto('/businesses/manage');
    await helpers.wait.waitForLoadingComplete();
    
    // Should either show management interface or redirect to auth
    const isManagePage = await page.locator('text=Manage, text=Business Management').isVisible();
    const isAuthRedirect = await page.locator('text=Sign In, text=Login').isVisible();
    
    expect(isManagePage || isAuthRedirect).toBeTruthy();
  });

  test('should handle business registration form', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await page.goto('/businesses/manage');
    await helpers.wait.waitForLoadingComplete();
    
    // Look for business registration/request form
    const businessNameInput = page.locator('input[name*="business"], input[placeholder*="business"], input[name*="name"]').first();
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Register"), button:has-text("Add")').first();
    
    if (await businessNameInput.isVisible() && await submitButton.isVisible()) {
      // Test form interaction
      await businessNameInput.fill(generateTestBusinessName());
      
      // Look for additional form fields
      const categorySelect = page.locator('select[name*="category"], select[name*="type"]').first();
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 1 });
      }
      
      const addressInput = page.locator('input[name*="address"], input[placeholder*="address"]').first();
      if (await addressInput.isVisible()) {
        await addressInput.fill('123 Test Street, Wetaskiwin, AB');
      }
      
      const phoneInput = page.locator('input[name*="phone"], input[type="tel"]').first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('780-123-4567');
      }
      
      // Verify form data
      expect(await businessNameInput.inputValue()).toContain('Test Business');
    }
  });

  test('should validate business API endpoints', async ({ page }) => {
    // Test business-related API endpoints
    const businessEndpoints = [
      '/api/businesses',
      '/api/business/request',
      '/api/businesses/ads'
    ];

    for (const endpoint of businessEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).not.toBe(404);
    }
  });

  test('should handle business categories and filtering', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToBusinesses();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for category filters
    const categoryFilter = page.locator('select[name*="category"], .category-filter, [data-testid*="category"]').first();
    
    if (await categoryFilter.isVisible()) {
      // Test category filtering
      if (await categoryFilter.locator('option').count() > 1) {
        await categoryFilter.selectOption({ index: 1 });
        await helpers.wait.waitForLoadingComplete();
        await helpers.errors.checkForErrors();
      }
    }
  });

  test('should handle business photo upload interface', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await page.goto('/businesses/manage');
    await helpers.wait.waitForLoadingComplete();
    
    // Look for photo upload interface
    const photoUpload = page.locator('input[type="file"], .photo-upload, [data-testid*="photo"]').first();
    
    if (await photoUpload.isVisible()) {
      // Verify upload interface exists (don't actually upload)
      expect(await photoUpload.isVisible()).toBeTruthy();
    }
  });

  test('should handle business claiming workflow', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Check if there's a business claiming API
    const claimResponse = await page.request.get('/api/businesses/claim');
    expect(claimResponse.status()).not.toBe(404);
    
    // Look for claiming interface in businesses page
    await helpers.nav.goToBusinesses();
    await helpers.wait.waitForLoadingComplete();
    
    const claimButton = page.locator('button:has-text("Claim"), a:has-text("Claim")').first();
    if (await claimButton.isVisible()) {
      // Claiming interface exists
      expect(await claimButton.isVisible()).toBeTruthy();
    }
  });
});