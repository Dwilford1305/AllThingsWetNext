import { test, expect } from '../fixtures/base';

/**
 * Authentication E2E Tests
 * 
 * Tests critical user authentication workflows:
 * - User registration
 * - Email verification (if applicable)
 * - User login
 * - Password reset
 * - Logout
 */

test.describe('User Authentication Workflows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from auth test page
    await page.goto('/auth-test');
  });

  test('should display authentication page correctly', async ({ page, screenshotHelper }) => {
    // Verify page loads
    await expect(page).toHaveTitle(/AllThingsWetaskiwin|Auth/);
    
    // Check for main authentication elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Take screenshot for visual regression
    await screenshotHelper.takeFullPageScreenshot('auth-page-initial');
  });

  test('should register a new user successfully', async ({ page, testUser, authHelper, waitHelper }) => {
    console.log(`Testing user registration for: ${testUser.email}`);
    
    // Navigate to registration
    const signUpButton = page.locator('text=Sign Up, button:has-text("Sign Up"), a[href*="register"]');
    if (await signUpButton.count() > 0) {
      await signUpButton.first().click();
    }
    
    // Wait for registration form to load
    await page.waitForSelector('input[name="firstName"], input[name="email"]', { timeout: 10000 });
    
    // Fill registration form
    const firstNameField = page.locator('input[name="firstName"]');
    const lastNameField = page.locator('input[name="lastName"]');
    const emailField = page.locator('input[name="email"]');
    const passwordField = page.locator('input[name="password"]');
    
    if (await firstNameField.count() > 0) {
      await firstNameField.fill(testUser.firstName);
    }
    if (await lastNameField.count() > 0) {
      await lastNameField.fill(testUser.lastName);
    }
    
    await emailField.fill(testUser.email);
    await passwordField.fill(testUser.password);
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for success response
    await waitHelper.waitForPageLoad();
    
    // Verify registration success
    // This might redirect to verification page, login page, or show success message
    const successIndicators = [
      'text=Registration successful',
      'text=Account created',
      'text=Check your email',
      'text=Welcome',
      'url**/profile',
      'url**/verify'
    ];
    
    let foundSuccess = false;
    for (const indicator of successIndicators) {
      if (indicator.startsWith('url')) {
        try {
          await page.waitForURL(indicator.substring(3), { timeout: 5000 });
          foundSuccess = true;
          break;
        } catch {}
      } else {
        if (await page.locator(indicator).count() > 0) {
          foundSuccess = true;
          break;
        }
      }
    }
    
    expect(foundSuccess).toBe(true);
  });

  test('should login existing user successfully', async ({ page, authHelper, testUser, waitHelper }) => {
    console.log(`Testing user login for: ${testUser.email}`);
    
    // First register the user (in a real test environment, this user would already exist)
    try {
      await authHelper.register(testUser);
      // Navigate back to login if registration redirected us
      await page.goto('/auth-test');
    } catch (error) {
      console.log('Registration failed or user already exists, proceeding with login test');
    }
    
    // Perform login
    await authHelper.login(testUser);
    
    // Verify we're logged in
    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBe(true);
    
    // Verify we're on the profile or dashboard page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(profile|dashboard|$)/);
  });

  test('should handle login with invalid credentials', async ({ page, waitHelper }) => {
    const invalidUser = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    };
    
    // Fill login form with invalid credentials
    await page.fill('input[name="email"]', invalidUser.email);
    await page.fill('input[name="password"]', invalidUser.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error response
    await waitHelper.waitForPageLoad();
    
    // Verify error message appears
    const errorIndicators = [
      'text=Invalid credentials',
      'text=Login failed',
      'text=Incorrect email or password',
      'text=Authentication failed',
      '.error',
      '[data-testid="error-message"]'
    ];
    
    let foundError = false;
    for (const indicator of errorIndicators) {
      if (await page.locator(indicator).count() > 0) {
        foundError = true;
        break;
      }
    }
    
    expect(foundError).toBe(true);
    
    // Verify we're still on the login page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(auth-test|login|$)/);
  });

  test('should logout user successfully', async ({ page, authenticatedUser, authHelper, waitHelper }) => {
    console.log(`Testing logout for authenticated user: ${authenticatedUser.email}`);
    
    // User should already be logged in from the authenticatedUser fixture
    expect(await authHelper.isLoggedIn()).toBe(true);
    
    // Perform logout
    await authHelper.logout();
    
    // Wait for logout to complete
    await waitHelper.waitForPageLoad();
    
    // Verify user is logged out
    expect(await authHelper.isLoggedIn()).toBe(false);
    
    // Verify we're redirected to home or login page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(auth-test|login|$)/);
  });

  test('should handle password reset flow', async ({ page, testUser, waitHelper }) => {
    // Look for password reset link
    const resetLinks = [
      'text=Forgot password',
      'text=Reset password',
      'a[href*="reset"]',
      'button:has-text("Forgot Password")'
    ];
    
    let resetLinkFound = false;
    for (const linkSelector of resetLinks) {
      const link = page.locator(linkSelector);
      if (await link.count() > 0) {
        await link.first().click();
        resetLinkFound = true;
        break;
      }
    }
    
    if (!resetLinkFound) {
      console.log('Password reset link not found, skipping test');
      test.skip();
      return;
    }
    
    // Wait for reset form
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    
    // Fill reset form
    await page.fill('input[name="email"], input[type="email"]', testUser.email);
    
    // Submit reset request
    await page.click('button[type="submit"]');
    
    // Wait for response
    await waitHelper.waitForPageLoad();
    
    // Verify success message
    const successIndicators = [
      'text=Reset link sent',
      'text=Check your email',
      'text=Password reset email sent',
      'text=Reset instructions sent'
    ];
    
    let foundSuccess = false;
    for (const indicator of successIndicators) {
      if (await page.locator(indicator).count() > 0) {
        foundSuccess = true;
        break;
      }
    }
    
    expect(foundSuccess).toBe(true);
  });

  test('should navigate between auth pages correctly', async ({ page, navHelper }) => {
    // Test navigation between login and registration
    await navHelper.goToHome();
    
    // Navigate to auth
    await page.goto('/auth-test');
    
    // Check if we can navigate between different auth states
    const signUpButton = page.locator('text=Sign Up, button:has-text("Sign Up"), a:has-text("Sign Up")');
    if (await signUpButton.count() > 0) {
      await signUpButton.first().click();
      
      // Verify we're on registration page/form
      await expect(page.locator('input[name="firstName"], input[name="email"]')).toBeVisible();
      
      // Navigate back to login
      const loginButton = page.locator('text=Login, text=Sign In, button:has-text("Login"), a:has-text("Login")');
      if (await loginButton.count() > 0) {
        await loginButton.first().click();
        
        // Verify we're back on login
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
      }
    }
  });
});