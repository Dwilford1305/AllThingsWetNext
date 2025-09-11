import { test, expect } from '@playwright/test';
import { createHelpers, generateTestEmail, generateTestUsername } from '../utils/test-helpers';

test.describe('Authentication Workflows', () => {
  test('should access auth test page', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToAuth();
    await helpers.validate.validateAuthPage();
  });

  test('should show authentication interface', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToAuth();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for authentication-related elements
    const authElements = await page.locator('input[type="email"], input[type="password"], button:has-text("Sign"), button:has-text("Login")').count();
    expect(authElements).toBeGreaterThan(0);
  });

  test('should handle login form interaction', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToAuth();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for login form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      // Test form interaction without actually submitting
      await emailInput.fill(generateTestEmail());
      await passwordInput.fill('testpassword123');
      
      // Verify form was filled
      expect(await emailInput.inputValue()).toContain('@');
      expect(await passwordInput.inputValue()).toBe('testpassword123');
    }
  });

  test('should handle registration form if available', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToAuth();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for registration form or tab
    const registerButton = page.locator('button:has-text("Register"), button:has-text("Sign Up"), a:has-text("Register"), a:has-text("Sign Up")');
    
    if (await registerButton.isVisible()) {
      await registerButton.click();
      await helpers.wait.waitForLoadingComplete();
      
      // Look for registration form fields
      const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await nameInput.isVisible() && await emailInput.isVisible() && await passwordInput.isVisible()) {
        // Test form interaction
        await nameInput.fill(generateTestUsername());
        await emailInput.fill(generateTestEmail());
        await passwordInput.fill('TestPassword123!');
        
        // Verify form was filled
        expect(await nameInput.inputValue()).toContain('testuser_');
        expect(await emailInput.inputValue()).toContain('@example.com');
        expect(await passwordInput.inputValue()).toBe('TestPassword123!');
      }
    }
  });

  test('should handle logout if user is logged in', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goHome();
    
    if (await helpers.auth.isLoggedIn()) {
      await helpers.auth.logout();
      await helpers.wait.waitForLoadingComplete();
      
      // Verify logout was successful
      const isStillLoggedIn = await helpers.auth.isLoggedIn();
      expect(isStillLoggedIn).toBeFalsy();
    }
  });

  test('should validate authentication-related API endpoints', async ({ page }) => {
    // Test that auth API endpoints are accessible
    const authEndpoints = [
      '/api/auth/me',
      '/api/auth/signup', 
      '/api/health'
    ];

    for (const endpoint of authEndpoints) {
      const response = await page.request.get(endpoint);
      // Should not return 404 - may return 401/403/500 which is expected for auth endpoints
      expect(response.status()).not.toBe(404);
    }
  });

  test('should handle password reset flow interface', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.nav.goToAuth();
    await helpers.wait.waitForLoadingComplete();
    
    // Look for "Forgot Password" or similar link
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), button:has-text("Forgot"), a:has-text("Reset"), button:has-text("Reset")');
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await helpers.wait.waitForLoadingComplete();
      
      // Should show password reset form
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill(generateTestEmail());
        expect(await emailInput.inputValue()).toContain('@example.com');
      }
    }
  });
});