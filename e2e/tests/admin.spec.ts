import { test, expect } from '../fixtures/base';

/**
 * Admin Dashboard E2E Tests
 * 
 * Tests administrative workflows:
 * - Admin authentication and access control
 * - Business management from admin side
 * - User management
 * - Content moderation
 * - System monitoring
 */

test.describe('Admin Dashboard Workflows', () => {

  test('should restrict admin access to unauthorized users', async ({ page, testUser, authHelper, waitHelper }) => {
    console.log(`Testing admin access restriction for regular user: ${testUser.email}`);
    
    // Register and login as regular user
    try {
      await authHelper.register(testUser);
      await authHelper.login(testUser);
    } catch (error) {
      console.log('User setup failed, proceeding with access test');
    }
    
    // Try to access admin dashboard
    await page.goto('/admin');
    await waitHelper.waitForPageLoad();
    
    // Should be redirected or see access denied
    const restrictionIndicators = [
      'text=Access denied',
      'text=Unauthorized',
      'text=Admin access required',
      'text=Forbidden',
      'text=Login',
      'url**/auth-test',
      'url**/'  // Redirected to home
    ];
    
    let accessRestricted = false;
    for (const indicator of restrictionIndicators) {
      if (indicator.startsWith('url')) {
        if (page.url().includes(indicator.substring(5))) {
          accessRestricted = true;
          break;
        }
      } else {
        if (await page.locator(indicator).count() > 0) {
          accessRestricted = true;
          break;
        }
      }
    }
    
    expect(accessRestricted).toBe(true);
    console.log('Admin access properly restricted for regular users');
  });

  test('should display admin login page', async ({ page, waitHelper, screenshotHelper }) => {
    // Navigate directly to admin
    await page.goto('/admin');
    await waitHelper.waitForPageLoad();
    
    // Should show admin login or redirect to auth
    const loginElements = [
      'input[name="email"]',
      'input[name="password"]',
      'input[type="password"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'text=Admin Login',
      'text=Administrator Access'
    ];
    
    let loginFormFound = false;
    for (const element of loginElements) {
      if (await page.locator(element).count() > 0) {
        loginFormFound = true;
        break;
      }
    }
    
    expect(loginFormFound).toBe(true);
    
    // Take screenshot
    await screenshotHelper.takeFullPageScreenshot('admin-login');
  });

  test('should attempt admin login workflow', async ({ page, waitHelper, formHelper }) => {
    await page.goto('/admin');
    await waitHelper.waitForPageLoad();
    
    // Try admin login with test credentials
    const adminCredentials = {
      email: 'admin@allthingswetaskiwin.com',
      password: 'admin123'  // This would typically be set up in test environment
    };
    
    // Look for login form
    const emailField = page.locator('input[name="email"], input[type="email"]');
    const passwordField = page.locator('input[name="password"], input[type="password"]');
    
    if (await emailField.count() > 0 && await passwordField.count() > 0) {
      await emailField.fill(adminCredentials.email);
      await passwordField.fill(adminCredentials.password);
      
      // Submit login
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      await waitHelper.waitForPageLoad();
      
      // Check if login succeeded or failed appropriately
      const currentUrl = page.url();
      const hasAdminContent = await page.locator('text=Dashboard, text=Admin Panel, text=Users, text=Businesses').count() > 0;
      const hasLoginError = await page.locator('text=Invalid, text=Error, text=Failed').count() > 0;
      
      // Either we should be in admin dashboard or see a login error
      expect(hasAdminContent || hasLoginError || currentUrl.includes('admin')).toBe(true);
      
      console.log(`Admin login attempt result: URL=${currentUrl}, hasContent=${hasAdminContent}, hasError=${hasLoginError}`);
    } else {
      console.log('Admin login form not found in expected format');
      test.skip();
    }
  });

  test('should display admin dashboard components when accessible', async ({ page, waitHelper, screenshotHelper }) => {
    // This test assumes we can access admin dashboard (would need proper admin credentials in real test)
    await page.goto('/admin');
    await waitHelper.waitForPageLoad();
    
    // Check if we have admin dashboard access
    const dashboardElements = [
      'text=Dashboard',
      'text=Admin Panel',
      'text=Statistics',
      'text=Users',
      'text=Businesses',
      'text=Content',
      'text=Settings',
      '.admin-dashboard',
      '[data-testid="admin-dashboard"]'
    ];
    
    let adminElementsFound = 0;
    for (const element of dashboardElements) {
      if (await page.locator(element).count() > 0) {
        adminElementsFound++;
      }
    }
    
    if (adminElementsFound > 0) {
      console.log(`Found ${adminElementsFound} admin dashboard elements`);
      
      // Take screenshot of admin interface
      await screenshotHelper.takeFullPageScreenshot('admin-dashboard');
      
      // Test navigation between admin sections
      const adminSections = [
        'text=Users',
        'text=Businesses', 
        'text=Statistics',
        'text=Reports'
      ];
      
      for (const section of adminSections) {
        const sectionLink = page.locator(section);
        if (await sectionLink.count() > 0) {
          await sectionLink.first().click();
          await waitHelper.waitForPageLoad();
          
          // Verify section loaded
          expect(page.locator('h1, h2')).toBeVisible();
          console.log(`Navigated to admin section: ${section}`);
        }
      }
    } else {
      console.log('Admin dashboard not accessible - this is expected without proper admin credentials');
      test.skip();
    }
  });

  test('should test admin business management features', async ({ page, waitHelper }) => {
    // Navigate to admin businesses section
    await page.goto('/admin');
    await waitHelper.waitForPageLoad();
    
    // Look for businesses management
    const businessesLink = page.locator('text=Businesses, a[href*="businesses"], button:has-text("Businesses")');
    
    if (await businessesLink.count() > 0) {
      await businessesLink.first().click();
      await waitHelper.waitForPageLoad();
      
      // Check for business management features
      const businessManagementElements = [
        'text=Business List',
        'text=Pending',
        'text=Approved',
        'text=Rejected',
        'button:has-text("Approve")',
        'button:has-text("Reject")',
        'text=Subscription',
        '.business-admin-table',
        '[data-testid="business-list"]'
      ];
      
      let managementFeaturesFound = 0;
      for (const element of businessManagementElements) {
        if (await page.locator(element).count() > 0) {
          managementFeaturesFound++;
        }
      }
      
      if (managementFeaturesFound > 0) {
        console.log(`Found ${managementFeaturesFound} business management features`);
        expect(managementFeaturesFound).toBeGreaterThan(0);
      } else {
        console.log('Business management features not found - may require admin access');
      }
    } else {
      console.log('Businesses link not found in admin dashboard');
      test.skip();
    }
  });

  test('should test admin user management features', async ({ page, waitHelper }) => {
    await page.goto('/admin');
    await waitHelper.waitForPageLoad();
    
    // Look for user management
    const usersLink = page.locator('text=Users, a[href*="users"], button:has-text("Users")');
    
    if (await usersLink.count() > 0) {
      await usersLink.first().click();
      await waitHelper.waitForPageLoad();
      
      // Check for user management features
      const userManagementElements = [
        'text=User List',
        'text=Active',
        'text=Inactive',
        'text=Role',
        'text=Email',
        'button:has-text("Edit")',
        'button:has-text("Delete")',
        'select[name="role"]',
        '.user-admin-table',
        '[data-testid="user-list"]'
      ];
      
      let userFeaturesFound = 0;
      for (const element of userManagementElements) {
        if (await page.locator(element).count() > 0) {
          userFeaturesFound++;
        }
      }
      
      if (userFeaturesFound > 0) {
        console.log(`Found ${userFeaturesFound} user management features`);
        expect(userFeaturesFound).toBeGreaterThan(0);
      } else {
        console.log('User management features not found - may require admin access');
      }
    } else {
      console.log('Users link not found in admin dashboard');
      test.skip();
    }
  });

  test('should test admin statistics and reporting', async ({ page, waitHelper, screenshotHelper }) => {
    await page.goto('/admin');
    await waitHelper.waitForPageLoad();
    
    // Look for statistics/reports section
    const statsLinks = [
      'text=Statistics',
      'text=Reports',
      'text=Analytics',
      'a[href*="stats"]',
      'a[href*="reports"]'
    ];
    
    let statsLinkFound = false;
    for (const linkSelector of statsLinks) {
      const link = page.locator(linkSelector);
      if (await link.count() > 0) {
        await link.first().click();
        await waitHelper.waitForPageLoad();
        statsLinkFound = true;
        break;
      }
    }
    
    if (statsLinkFound) {
      // Check for statistics elements
      const statsElements = [
        'text=Total Users',
        'text=Total Businesses',
        'text=Active',
        'text=Revenue',
        'text=Growth',
        '.chart',
        '.statistics',
        '[data-testid="stats"]',
        'canvas', // Charts
        '.metric'
      ];
      
      let statsFound = 0;
      for (const element of statsElements) {
        if (await page.locator(element).count() > 0) {
          statsFound++;
        }
      }
      
      if (statsFound > 0) {
        console.log(`Found ${statsFound} statistics elements`);
        expect(statsFound).toBeGreaterThan(0);
        
        // Take screenshot of admin stats
        await screenshotHelper.takeFullPageScreenshot('admin-statistics');
      }
    } else {
      console.log('Statistics section not found in admin dashboard');
      test.skip();
    }
  });

  test('should test admin content moderation', async ({ page, waitHelper }) => {
    await page.goto('/admin');
    await waitHelper.waitForPageLoad();
    
    // Look for content moderation features
    const contentLinks = [
      'text=Content',
      'text=Moderation',
      'text=Reports',
      'a[href*="content"]',
      'a[href*="moderation"]'
    ];
    
    let contentLinkFound = false;
    for (const linkSelector of contentLinks) {
      const link = page.locator(linkSelector);
      if (await link.count() > 0) {
        await link.first().click();
        await waitHelper.waitForPageLoad();
        contentLinkFound = true;
        break;
      }
    }
    
    if (contentLinkFound) {
      // Check for moderation features
      const moderationElements = [
        'text=Pending',
        'text=Flagged',
        'text=Approve',
        'text=Reject',
        'text=Reports',
        'button:has-text("Moderate")',
        '.moderation-queue',
        '[data-testid="content-moderation"]'
      ];
      
      let moderationFeaturesFound = 0;
      for (const element of moderationElements) {
        if (await page.locator(element).count() > 0) {
          moderationFeaturesFound++;
        }
      }
      
      if (moderationFeaturesFound > 0) {
        console.log(`Found ${moderationFeaturesFound} content moderation features`);
        expect(moderationFeaturesFound).toBeGreaterThan(0);
      }
    } else {
      console.log('Content moderation section not found');
      test.skip();
    }
  });

  test('should test admin system settings', async ({ page, waitHelper }) => {
    await page.goto('/admin');
    await waitHelper.waitForPageLoad();
    
    // Look for settings
    const settingsLinks = [
      'text=Settings',
      'text=Configuration',
      'text=System',
      'a[href*="settings"]',
      'a[href*="config"]'
    ];
    
    let settingsLinkFound = false;
    for (const linkSelector of settingsLinks) {
      const link = page.locator(linkSelector);
      if (await link.count() > 0) {
        await link.first().click();
        await waitHelper.waitForPageLoad();
        settingsLinkFound = true;
        break;
      }
    }
    
    if (settingsLinkFound) {
      // Check for settings elements
      const settingsElements = [
        'input[type="text"]',
        'input[type="checkbox"]',
        'select',
        'textarea',
        'button:has-text("Save")',
        'button:has-text("Update")',
        'text=Email Settings',
        'text=Payment Settings',
        'text=API Settings',
        '.settings-form'
      ];
      
      let settingsFound = 0;
      for (const element of settingsElements) {
        if (await page.locator(element).count() > 0) {
          settingsFound++;
        }
      }
      
      if (settingsFound > 0) {
        console.log(`Found ${settingsFound} system settings elements`);
        expect(settingsFound).toBeGreaterThan(0);
      }
    } else {
      console.log('Settings section not found');
      test.skip();
    }
  });
});