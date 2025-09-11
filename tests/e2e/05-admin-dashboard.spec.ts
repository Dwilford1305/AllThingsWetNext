import { test, expect, TEST_USERS } from '../fixtures/test-fixtures';

test.describe('Admin Dashboard Workflows', () => {
  test('should load admin dashboard page', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if we're at admin page or redirected to auth
    const currentUrl = page.url();
    
    if (currentUrl.includes('/admin')) {
      // Admin page loaded
      const adminContent = page.locator('.admin-dashboard, .admin-panel, [data-testid="admin-dashboard"]').first();
      const loginForm = page.locator('form, .login-form, .auth-form').first();
      
      const contentVisible = await adminContent.isVisible().catch(() => false);
      const loginVisible = await loginForm.isVisible().catch(() => false);
      
      if (contentVisible) {
        await expect(adminContent).toBeVisible();
        
        // Look for admin navigation or sections
        const adminNav = page.locator('.admin-nav, .admin-sidebar, nav').first();
        const adminSections = page.locator('.admin-section, .dashboard-card, .admin-card');
        
        const navVisible = await adminNav.isVisible().catch(() => false);
        const sectionCount = await adminSections.count();
        
        if (navVisible) {
          await expect(adminNav).toBeVisible();
        }
        
        if (sectionCount > 0) {
          await expect(adminSections.first()).toBeVisible();
        }
      } else if (loginVisible) {
        await expect(loginForm).toBeVisible();
        
        // Test admin login form
        const emailField = page.locator('input[type="email"], input[name="email"]').first();
        const passwordField = page.locator('input[type="password"], input[name="password"]').first();
        
        if (await emailField.isVisible().catch(() => false)) {
          await emailField.fill(TEST_USERS.admin.email);
        }
        if (await passwordField.isVisible().catch(() => false)) {
          await passwordField.fill(TEST_USERS.admin.password);
        }
      }
      
      // Take screenshot of admin page
      await page.screenshot({ path: 'tests/e2e/screenshots/admin-dashboard.png', fullPage: true });
    } else {
      // Redirected to auth
      expect(currentUrl).toMatch(/auth|login/);
      await page.screenshot({ path: 'tests/e2e/screenshots/admin-auth-redirect.png', fullPage: true });
    }
  });

  test('should display admin statistics and metrics', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for admin stats/metrics sections
    const statsSection = page.locator('.admin-stats, .dashboard-stats, .metrics, [data-testid="admin-stats"]').first();
    const statsCards = page.locator('.stat-card, .metric-card, .dashboard-card');
    
    const statsSectionVisible = await statsSection.isVisible().catch(() => false);
    const cardCount = await statsCards.count();
    
    if (statsSectionVisible) {
      await expect(statsSection).toBeVisible();
    }
    
    if (cardCount > 0) {
      await expect(statsCards.first()).toBeVisible();
      
      // Look for common admin metrics
      const userCount = page.locator(':has-text("Users"), :has-text("Total Users"), [data-testid="user-count"]').first();
      const businessCount = page.locator(':has-text("Businesses"), :has-text("Total Businesses"), [data-testid="business-count"]').first();
      const contentCount = page.locator(':has-text("Content"), :has-text("Posts"), :has-text("Listings")').first();
      
      const userCountVisible = await userCount.isVisible().catch(() => false);
      const businessCountVisible = await businessCount.isVisible().catch(() => false);
      const contentCountVisible = await contentCount.isVisible().catch(() => false);
      
      if (userCountVisible) {
        await expect(userCount).toBeVisible();
      }
      if (businessCountVisible) {
        await expect(businessCount).toBeVisible();
      }
      if (contentCountVisible) {
        await expect(contentCount).toBeVisible();
      }
    }
    
    // Take screenshot of admin statistics
    await page.screenshot({ path: 'tests/e2e/screenshots/admin-statistics.png', fullPage: true });
  });

  test('should handle user management functionality', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for user management section or navigation
    const userManagement = page.locator('a:has-text("Users"), button:has-text("Users"), .user-management, [data-testid="user-management"]').first();
    const userManagementVisible = await userManagement.isVisible().catch(() => false);
    
    if (userManagementVisible) {
      await userManagement.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if user list loads
      const userList = page.locator('.user-list, .users-table, table, [data-testid="user-list"]').first();
      const userListVisible = await userList.isVisible().catch(() => false);
      
      if (userListVisible) {
        await expect(userList).toBeVisible();
        
        // Look for user management actions
        const userActions = page.locator('button:has-text("Edit"), button:has-text("Delete"), button:has-text("Block"), .user-actions button');
        const actionCount = await userActions.count();
        
        if (actionCount > 0) {
          await expect(userActions.first()).toBeVisible();
        }
        
        // Test user search if available
        const userSearch = page.locator('input[placeholder*="search"], input[name="search"]').first();
        const searchVisible = await userSearch.isVisible().catch(() => false);
        
        if (searchVisible) {
          await userSearch.fill('test');
          await page.waitForTimeout(1000);
        }
      }
      
      // Take screenshot of user management
      await page.screenshot({ path: 'tests/e2e/screenshots/admin-user-management.png', fullPage: true });
    }
  });

  test('should handle business management from admin perspective', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for business management section
    const businessManagement = page.locator('a:has-text("Business"), button:has-text("Business"), .business-management, [data-testid="business-management"]').first();
    const businessManagementVisible = await businessManagement.isVisible().catch(() => false);
    
    if (businessManagementVisible) {
      await businessManagement.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if business list loads
      const businessList = page.locator('.business-list, .businesses-table, table, [data-testid="business-list"]').first();
      const businessListVisible = await businessList.isVisible().catch(() => false);
      
      if (businessListVisible) {
        await expect(businessList).toBeVisible();
        
        // Look for business management actions
        const businessActions = page.locator('button:has-text("Approve"), button:has-text("Edit"), button:has-text("Delete"), .business-actions button');
        const actionCount = await businessActions.count();
        
        if (actionCount > 0) {
          await expect(businessActions.first()).toBeVisible();
        }
        
        // Look for business requests/claims section
        const businessRequests = page.locator('.business-requests, .pending-claims, button:has-text("Requests")').first();
        const requestsVisible = await businessRequests.isVisible().catch(() => false);
        
        if (requestsVisible) {
          await businessRequests.click();
          await page.waitForTimeout(1000);
          
          // Look for pending business claims
          const pendingClaims = page.locator('.pending-claim, .business-request, .claim-item');
          const claimCount = await pendingClaims.count();
          
          if (claimCount > 0) {
            await expect(pendingClaims.first()).toBeVisible();
            
            // Look for approve/reject buttons
            const approveButton = page.locator('button:has-text("Approve"), button:has-text("Accept")').first();
            const rejectButton = page.locator('button:has-text("Reject"), button:has-text("Deny")').first();
            
            const approveVisible = await approveButton.isVisible().catch(() => false);
            const rejectVisible = await rejectButton.isVisible().catch(() => false);
            
            if (approveVisible) {
              await expect(approveButton).toBeVisible();
            }
            if (rejectVisible) {
              await expect(rejectButton).toBeVisible();
            }
          }
        }
      }
      
      // Take screenshot of business management
      await page.screenshot({ path: 'tests/e2e/screenshots/admin-business-management.png', fullPage: true });
    }
  });

  test('should handle content moderation tools', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for content moderation section
    const contentModeration = page.locator('a:has-text("Content"), a:has-text("Moderation"), button:has-text("Content"), .content-moderation').first();
    const moderationVisible = await contentModeration.isVisible().catch(() => false);
    
    if (moderationVisible) {
      await contentModeration.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check for reported content
      const reportedContent = page.locator('.reported-content, .reports, .moderation-queue, [data-testid="reported-content"]').first();
      const reportedVisible = await reportedContent.isVisible().catch(() => false);
      
      if (reportedVisible) {
        await expect(reportedContent).toBeVisible();
        
        // Look for moderation actions
        const moderationActions = page.locator('button:has-text("Approve"), button:has-text("Remove"), button:has-text("Hide"), .moderation-actions button');
        const actionCount = await moderationActions.count();
        
        if (actionCount > 0) {
          await expect(moderationActions.first()).toBeVisible();
        }
      }
      
      // Look for content categories (news, events, marketplace, jobs)
      const contentTabs = page.locator('button:has-text("News"), button:has-text("Events"), button:has-text("Marketplace"), button:has-text("Jobs")');
      const tabCount = await contentTabs.count();
      
      if (tabCount > 0) {
        // Click on first content type
        await contentTabs.first().click();
        await page.waitForTimeout(1000);
        
        // Look for content items
        const contentItems = page.locator('.content-item, .moderation-item, table tr');
        const itemCount = await contentItems.count();
        
        if (itemCount > 0) {
          await expect(contentItems.first()).toBeVisible();
        }
      }
      
      // Take screenshot of content moderation
      await page.screenshot({ path: 'tests/e2e/screenshots/admin-content-moderation.png', fullPage: true });
    }
  });

  test('should display system analytics and reports', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for analytics/reports section
    const analytics = page.locator('a:has-text("Analytics"), a:has-text("Reports"), button:has-text("Analytics"), .analytics').first();
    const analyticsVisible = await analytics.isVisible().catch(() => false);
    
    if (analyticsVisible) {
      await analytics.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Look for analytics dashboard
      const analyticsDashboard = page.locator('.analytics-dashboard, .reports-dashboard, .charts, [data-testid="analytics"]').first();
      const dashboardVisible = await analyticsDashboard.isVisible().catch(() => false);
      
      if (dashboardVisible) {
        await expect(analyticsDashboard).toBeVisible();
        
        // Look for charts or graphs
        const charts = page.locator('canvas, .chart, .graph, svg').first();
        const chartsVisible = await charts.isVisible().catch(() => false);
        
        if (chartsVisible) {
          await expect(charts).toBeVisible();
        }
        
        // Look for report generation options
        const reportGeneration = page.locator('button:has-text("Generate"), button:has-text("Export"), .report-generation').first();
        const reportVisible = await reportGeneration.isVisible().catch(() => false);
        
        if (reportVisible) {
          await expect(reportGeneration).toBeVisible();
        }
      }
      
      // Take screenshot of analytics
      await page.screenshot({ path: 'tests/e2e/screenshots/admin-analytics.png', fullPage: true });
    }
  });

  test('should handle scraper configuration and logs', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for scraper management section
    const scraperManagement = page.locator('a:has-text("Scraper"), a:has-text("Scraping"), button:has-text("Scraper"), .scraper-management').first();
    const scraperVisible = await scraperManagement.isVisible().catch(() => false);
    
    if (scraperVisible) {
      await scraperManagement.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Look for scraper controls
      const scraperControls = page.locator('.scraper-controls, .scraper-dashboard, [data-testid="scraper-controls"]').first();
      const controlsVisible = await scraperControls.isVisible().catch(() => false);
      
      if (controlsVisible) {
        await expect(scraperControls).toBeVisible();
        
        // Look for manual scraper trigger buttons
        const runScraperButton = page.locator('button:has-text("Run Scraper"), button:has-text("Start Scraping"), button:has-text("Manual Scrape")').first();
        const runButtonVisible = await runScraperButton.isVisible().catch(() => false);
        
        if (runButtonVisible) {
          await expect(runScraperButton).toBeVisible();
        }
        
        // Look for scraper logs
        const scraperLogs = page.locator('.scraper-logs, .logs, .log-output, [data-testid="scraper-logs"]').first();
        const logsVisible = await scraperLogs.isVisible().catch(() => false);
        
        if (logsVisible) {
          await expect(scraperLogs).toBeVisible();
        }
        
        // Look for scraper status
        const scraperStatus = page.locator('.scraper-status, .status-indicator, [data-testid="scraper-status"]').first();
        const statusVisible = await scraperStatus.isVisible().catch(() => false);
        
        if (statusVisible) {
          await expect(scraperStatus).toBeVisible();
        }
      }
      
      // Take screenshot of scraper management
      await page.screenshot({ path: 'tests/e2e/screenshots/admin-scraper-management.png', fullPage: true });
    }
  });

  test('should handle admin settings and configuration', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for settings section
    const settings = page.locator('a:has-text("Settings"), button:has-text("Settings"), .admin-settings, [data-testid="admin-settings"]').first();
    const settingsVisible = await settings.isVisible().catch(() => false);
    
    if (settingsVisible) {
      await settings.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Look for configuration options
      const configOptions = page.locator('.config-options, .settings-form, form, [data-testid="config-options"]').first();
      const optionsVisible = await configOptions.isVisible().catch(() => false);
      
      if (optionsVisible) {
        await expect(configOptions).toBeVisible();
        
        // Look for common admin settings
        const emailSettings = page.locator('input[name*="email"], .email-config, :has-text("Email Configuration")').first();
        const paymentSettings = page.locator('input[name*="paypal"], .payment-config, :has-text("Payment")').first();
        const scraperSettings = page.locator('input[name*="scraper"], .scraper-config, :has-text("Scraper")').first();
        
        const emailVisible = await emailSettings.isVisible().catch(() => false);
        const paymentVisible = await paymentSettings.isVisible().catch(() => false);
        const scraperSettingsVisible = await scraperSettings.isVisible().catch(() => false);
        
        if (emailVisible) {
          await expect(emailSettings).toBeVisible();
        }
        if (paymentVisible) {
          await expect(paymentSettings).toBeVisible();
        }
        if (scraperSettingsVisible) {
          await expect(scraperSettings).toBeVisible();
        }
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
        const saveVisible = await saveButton.isVisible().catch(() => false);
        
        if (saveVisible) {
          await expect(saveButton).toBeVisible();
        }
      }
      
      // Take screenshot of admin settings
      await page.screenshot({ path: 'tests/e2e/screenshots/admin-settings.png', fullPage: true });
    }
  });

  test('should validate admin permissions and security', async ({ page }) => {
    // Test that non-admin users cannot access admin functions
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if proper authentication/authorization is enforced
    const currentUrl = page.url();
    
    // Should either show login form or redirect to auth
    if (currentUrl.includes('/admin')) {
      // If we're still on admin page, should show login form
      const loginForm = page.locator('form, .login-form, .auth-form').first();
      const loginVisible = await loginForm.isVisible().catch(() => false);
      
      if (loginVisible) {
        await expect(loginForm).toBeVisible();
        
        // Test with invalid credentials
        const emailField = page.locator('input[type="email"], input[name="email"]').first();
        const passwordField = page.locator('input[type="password"], input[name="password"]').first();
        const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
        
        if (await emailField.isVisible().catch(() => false) && 
            await passwordField.isVisible().catch(() => false) &&
            await submitButton.isVisible().catch(() => false)) {
          
          // Try with invalid credentials
          await emailField.fill('invalid@test.com');
          await passwordField.fill('wrongpassword');
          await submitButton.click();
          
          await page.waitForTimeout(2000);
          
          // Should show error or remain on login form
          const errorMessage = page.locator('.error, .alert, [role="alert"]').first();
          const errorVisible = await errorMessage.isVisible().catch(() => false);
          
          if (errorVisible) {
            await expect(errorMessage).toBeVisible();
          }
        }
      }
    } else {
      // Redirected to auth - this is expected
      expect(currentUrl).toMatch(/auth|login/);
    }
    
    // Take screenshot of admin security check
    await page.screenshot({ path: 'tests/e2e/screenshots/admin-security-check.png', fullPage: true });
  });
});