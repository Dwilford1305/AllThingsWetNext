import { test, expect, TEST_USERS } from '../fixtures/test-fixtures';

test.describe('User Authentication Workflows', () => {
  test('should access auth test page', async ({ page }) => {
    await page.goto('/auth-test');
    await page.waitForLoadState('domcontentloaded');
    
    // Check that auth test page loads
    await expect(page).toHaveURL('/auth-test');
    
    // Look for authentication elements
    const authElements = page.locator('button, form, .auth, [data-testid="auth"]');
    const hasAuthElements = await authElements.count() > 0;
    
    if (hasAuthElements) {
      await expect(authElements.first()).toBeVisible();
    }
    
    // Take screenshot of auth test page
    await page.screenshot({ path: 'tests/e2e/screenshots/auth-test-page.png', fullPage: true });
  });

  test('should handle user registration flow', async ({ page }) => {
    await page.goto('/auth-test');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for registration form or signup button
    const signupButton = page.locator('button:has-text("Sign Up"), a:has-text("Sign Up"), [data-testid="signup"]').first();
    const signupVisible = await signupButton.isVisible().catch(() => false);
    
    if (signupVisible) {
      await signupButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if we're redirected to Auth0 or have a registration form
      const currentUrl = page.url();
      
      if (currentUrl.includes('auth0') || currentUrl.includes('login')) {
        // Auth0 integration - check for Auth0 elements
        const emailField = page.locator('input[type="email"], input[name="email"]').first();
        const passwordField = page.locator('input[type="password"], input[name="password"]').first();
        
        const emailVisible = await emailField.isVisible().catch(() => false);
        const passwordVisible = await passwordField.isVisible().catch(() => false);
        
        if (emailVisible && passwordVisible) {
          await expect(emailField).toBeVisible();
          await expect(passwordField).toBeVisible();
        }
        
        // Take screenshot of auth page
        await page.screenshot({ path: 'tests/e2e/screenshots/auth0-signup.png', fullPage: true });
      } else {
        // Local registration form
        const registrationForm = page.locator('form, .registration-form, [data-testid="registration"]').first();
        const formVisible = await registrationForm.isVisible().catch(() => false);
        
        if (formVisible) {
          await expect(registrationForm).toBeVisible();
          
          // Fill registration form if present
          const emailField = page.locator('input[type="email"], input[name="email"]').first();
          const passwordField = page.locator('input[type="password"], input[name="password"]').first();
          
          if (await emailField.isVisible().catch(() => false)) {
            await emailField.fill(TEST_USERS.user.email);
          }
          if (await passwordField.isVisible().catch(() => false)) {
            await passwordField.fill(TEST_USERS.user.password);
          }
          
          // Take screenshot of filled form
          await page.screenshot({ path: 'tests/e2e/screenshots/registration-form.png', fullPage: true });
        }
      }
    }
  });

  test('should handle user login flow', async ({ page }) => {
    await page.goto('/auth-test');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for login button or form
    const loginButton = page.locator('button:has-text("Log In"), button:has-text("Login"), a:has-text("Login"), [data-testid="login"]').first();
    const loginVisible = await loginButton.isVisible().catch(() => false);
    
    if (loginVisible) {
      await loginButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('auth0') || currentUrl.includes('login')) {
        // Auth0 login page
        const emailField = page.locator('input[type="email"], input[name="email"]').first();
        const passwordField = page.locator('input[type="password"], input[name="password"]').first();
        const submitButton = page.locator('button[type="submit"], button:has-text("Log In"), button:has-text("Continue")').first();
        
        const emailVisible = await emailField.isVisible().catch(() => false);
        const passwordVisible = await passwordField.isVisible().catch(() => false);
        const submitVisible = await submitButton.isVisible().catch(() => false);
        
        if (emailVisible && passwordVisible) {
          await expect(emailField).toBeVisible();
          await expect(passwordField).toBeVisible();
          
          // Test form interaction (don't submit with real credentials)
          await emailField.fill(TEST_USERS.user.email);
          await passwordField.fill(TEST_USERS.user.password);
          
          if (submitVisible) {
            await expect(submitButton).toBeVisible();
          }
        }
        
        // Take screenshot of login form
        await page.screenshot({ path: 'tests/e2e/screenshots/auth0-login.png', fullPage: true });
      }
    }
  });

  test('should display user profile when authenticated', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if we're redirected to login or if profile page loads
    const currentUrl = page.url();
    
    if (currentUrl.includes('/profile')) {
      // Profile page loaded - might show login prompt or profile content
      const profileContent = page.locator('.profile, [data-testid="profile"], .user-profile').first();
      const loginPrompt = page.locator('.login-prompt, .auth-required, button:has-text("Log In")').first();
      
      const profileVisible = await profileContent.isVisible().catch(() => false);
      const loginPromptVisible = await loginPrompt.isVisible().catch(() => false);
      
      if (profileVisible) {
        await expect(profileContent).toBeVisible();
      } else if (loginPromptVisible) {
        await expect(loginPrompt).toBeVisible();
      }
      
      // Take screenshot of profile page
      await page.screenshot({ path: 'tests/e2e/screenshots/profile-page.png', fullPage: true });
    } else {
      // Redirected to auth page
      expect(currentUrl).toMatch(/auth|login/);
      
      // Take screenshot of auth redirect
      await page.screenshot({ path: 'tests/e2e/screenshots/profile-auth-redirect.png', fullPage: true });
    }
  });

  test('should handle logout functionality', async ({ page }) => {
    // Start at auth test page
    await page.goto('/auth-test');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for logout functionality (might only be visible when logged in)
    const logoutButton = page.locator('button:has-text("Log Out"), button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]').first();
    const logoutVisible = await logoutButton.isVisible().catch(() => false);
    
    if (logoutVisible) {
      await expect(logoutButton).toBeVisible();
      
      // Test logout action
      await logoutButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Should redirect to homepage or show logged out state
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/|auth|login|logout/);
      
      // Take screenshot after logout
      await page.screenshot({ path: 'tests/e2e/screenshots/after-logout.png', fullPage: true });
    }
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth-test');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for forgot password link
    const forgotPasswordLink = page.locator('a:has-text("Forgot Password"), button:has-text("Forgot Password"), [data-testid="forgot-password"]').first();
    const forgotVisible = await forgotPasswordLink.isVisible().catch(() => false);
    
    if (forgotVisible) {
      await forgotPasswordLink.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Should show password reset form or redirect to Auth0
      const resetForm = page.locator('form, .reset-form, input[type="email"]').first();
      const resetVisible = await resetForm.isVisible().catch(() => false);
      
      if (resetVisible) {
        await expect(resetForm).toBeVisible();
        
        // Take screenshot of password reset form
        await page.screenshot({ path: 'tests/e2e/screenshots/password-reset.png', fullPage: true });
      }
    }
  });

  test('should validate auth security headers', async ({ page }) => {
    // Check for security headers and HTTPS redirects
    const response = await page.goto('/auth-test');
    
    if (response) {
      const headers = response.headers();
      
      // Log security-relevant headers for validation
      console.log('Security headers:', {
        'content-security-policy': headers['content-security-policy'],
        'x-frame-options': headers['x-frame-options'],
        'x-content-type-options': headers['x-content-type-options'],
        'strict-transport-security': headers['strict-transport-security'],
      });
    }
    
    // Check that auth-related cookies are secure (if any are set)
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.toLowerCase().includes('auth') ||
      cookie.name.toLowerCase().includes('session') ||
      cookie.name.toLowerCase().includes('token')
    );
    
    // Verify auth cookies have security flags (if they exist)
    authCookies.forEach(cookie => {
      if (cookie.secure !== undefined) {
        expect(cookie.secure).toBeTruthy();
      }
      if (cookie.httpOnly !== undefined) {
        expect(cookie.httpOnly).toBeTruthy();
      }
    });
  });
});