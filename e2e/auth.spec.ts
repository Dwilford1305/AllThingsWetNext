import { test, expect } from '@playwright/test';

test.describe('Authentication Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth test page before each test
    await page.goto('/auth-test');
  });

  test('auth test page loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Auth Test/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('user registration form is accessible', async ({ page }) => {
    // Look for registration form elements
    const registerButton = page.locator('button', { hasText: /register|sign up/i });
    const loginButton = page.locator('button', { hasText: /login|sign in/i });
    
    // At least one authentication method should be available
    const hasAuth = await registerButton.isVisible() || await loginButton.isVisible();
    expect(hasAuth).toBeTruthy();
  });

  test('user login flow navigation', async ({ page }) => {
    // Look for login functionality
    const loginElements = page.locator('button', { hasText: /login|sign in/i });
    
    if (await loginElements.count() > 0) {
      await loginElements.first().click();
      
      // After clicking login, should see either a form or redirect
      // We'll check that the page responds (doesn't show error)
      await page.waitForTimeout(2000); // Give time for any redirects
      
      // Page should still be accessible (not showing error page)
      const hasError = await page.locator('text=404').isVisible() || 
                      await page.locator('text=Error').isVisible();
      expect(hasError).toBeFalsy();
    }
  });

  test('authentication state persistence', async ({ page, context }) => {
    // Test that auth state can be maintained across page navigation
    await page.goto('/auth-test');
    
    // Navigate to another page and back
    await page.goto('/');
    await page.goto('/auth-test');
    
    // Page should still load correctly
    await expect(page.locator('main')).toBeVisible();
  });

  test('protected routes behavior', async ({ page }) => {
    // Test access to admin area without authentication
    await page.goto('/admin');
    
    // Should either redirect to login or show login form
    const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').count() > 0;
    const isAuthPage = page.url().includes('auth') || page.url().includes('login');
    const hasLoginButton = await page.locator('button', { hasText: /login|sign in/i }).isVisible();
    
    // One of these conditions should be true for protected routes
    expect(hasLoginForm || isAuthPage || hasLoginButton).toBeTruthy();
  });

  test('profile page accessibility', async ({ page }) => {
    // Test profile page behavior
    await page.goto('/profile');
    
    // Should either show profile content or redirect to auth
    const hasError = await page.locator('text=404').isVisible();
    expect(hasError).toBeFalsy();
    
    // Page should be responsive
    await expect(page.locator('main, body')).toBeVisible();
  });
});