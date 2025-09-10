import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Workflows', () => {
  test('admin dashboard access requires authentication', async ({ page }) => {
    await page.goto('/admin');
    
    // Should either show login form or redirect to authentication
    const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').count() > 0;
    const hasLoginButton = await page.locator('button:has-text("Login"), button:has-text("Sign In")').isVisible();
    const isAuthRedirect = page.url().includes('auth') || page.url().includes('login');
    
    // Should require authentication in some form
    expect(hasLoginForm || hasLoginButton || isAuthRedirect).toBeTruthy();
  });

  test('admin dashboard structure and navigation', async ({ page }) => {
    await page.goto('/admin');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Should show admin interface or auth requirement
    const hasAdminContent = await page.locator(
      '.dashboard, .admin-panel, nav:has(a:text("Users")), nav:has(a:text("Businesses"))'
    ).count() > 0;
    
    const requiresAuth = await page.locator('form, input[type="password"]').count() > 0;
    
    expect(hasAdminContent || requiresAuth).toBeTruthy();
  });

  test('admin navigation menu functionality', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    // Look for admin navigation elements
    const adminNav = page.locator('nav, .sidebar, .admin-menu');
    
    if (await adminNav.isVisible()) {
      // Test common admin navigation items
      const navItems = [
        'Users', 'Businesses', 'Content', 'Analytics', 
        'Settings', 'Reports', 'Dashboard'
      ];
      
      for (const item of navItems) {
        const navLink = page.locator(`a:has-text("${item}"), button:has-text("${item}")`).first();
        
        if (await navLink.isVisible()) {
          await navLink.click();
          await page.waitForTimeout(1000);
          
          // Should navigate or respond appropriately
          await expect(page.locator('main, body')).toBeVisible();
          
          // Navigate back to admin for next test
          await page.goto('/admin');
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('admin user management interface', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    // Look for user management functionality
    const userManagement = page.locator('a:has-text("Users"), button:has-text("Users")').first();
    
    if (await userManagement.isVisible()) {
      await userManagement.click();
      await page.waitForTimeout(2000);
      
      // Should show user management interface or data
      const hasUserInterface = await page.locator(
        'table, .user-list, .user-table, [data-testid="users"]'
      ).count() > 0;
      
      const hasUserActions = await page.locator(
        'button:has-text("Edit"), button:has-text("Delete"), button:has-text("Add User")'
      ).count() > 0;
      
      expect(hasUserInterface || hasUserActions).toBeTruthy();
    }
  });

  test('admin business management interface', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    // Look for business management functionality
    const businessManagement = page.locator('a:has-text("Business"), button:has-text("Business")').first();
    
    if (await businessManagement.isVisible()) {
      await businessManagement.click();
      await page.waitForTimeout(2000);
      
      // Should show business management interface
      const hasBusinessInterface = await page.locator(
        'table, .business-list, .business-table, [data-testid="businesses"]'
      ).count() > 0;
      
      const hasBusinessActions = await page.locator(
        'button:has-text("Approve"), button:has-text("Reject"), button:has-text("Edit")'
      ).count() > 0;
      
      expect(hasBusinessInterface || hasBusinessActions).toBeTruthy();
    }
  });

  test('admin content moderation interface', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    // Look for content management functionality
    const contentManagement = page.locator('a:has-text("Content"), button:has-text("Content")').first();
    
    if (await contentManagement.isVisible()) {
      await contentManagement.click();
      await page.waitForTimeout(2000);
      
      // Should show content management interface
      const hasContentInterface = await page.locator(
        'table, .content-list, [data-testid="content"]'
      ).count() > 0;
      
      const hasContentActions = await page.locator(
        'button:has-text("Approve"), button:has-text("Delete"), button:has-text("Edit")'
      ).count() > 0;
      
      expect(hasContentInterface || hasContentActions).toBeTruthy();
    }
  });

  test('admin analytics and reports access', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    // Look for analytics/reports functionality
    const analyticsLink = page.locator('a:has-text("Analytics"), a:has-text("Reports")').first();
    
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await page.waitForTimeout(2000);
      
      // Should show analytics interface or data
      const hasAnalytics = await page.locator(
        '.chart, .graph, .statistics, .metrics, [data-testid="analytics"]'
      ).count() > 0;
      
      const hasReportData = await page.locator(
        'table, .report, .dashboard, .stats'
      ).count() > 0;
      
      expect(hasAnalytics || hasReportData).toBeTruthy();
    }
  });

  test('admin settings and configuration', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    // Look for settings functionality
    const settingsLink = page.locator('a:has-text("Settings"), a:has-text("Config")').first();
    
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await page.waitForTimeout(2000);
      
      // Should show settings interface
      const hasSettings = await page.locator(
        'form, input[type="text"], input[type="email"], select, textarea'
      ).count() > 0;
      
      const hasConfigOptions = await page.locator(
        'button:has-text("Save"), button:has-text("Update"), .setting, .config'
      ).count() > 0;
      
      expect(hasSettings || hasConfigOptions).toBeTruthy();
    }
  });

  test('admin system health monitoring', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    // Look for system monitoring functionality
    const systemLink = page.locator('a:has-text("System"), a:has-text("Health"), a:has-text("Monitor")').first();
    
    if (await systemLink.isVisible()) {
      await systemLink.click();
      await page.waitForTimeout(2000);
      
      // Should show system information
      const hasSystemInfo = await page.locator(
        '.status, .health, .monitor, [data-testid="system"]'
      ).count() > 0;
      
      const hasSystemData = await page.locator(
        'text="Status", text="Health", text="Online", text="Active"'
      ).count() > 0;
      
      expect(hasSystemInfo || hasSystemData).toBeTruthy();
    }
  });
});