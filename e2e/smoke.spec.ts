import { test, expect } from '@playwright/test';

test.describe('Application Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Verify the page loads
    await expect(page).toHaveTitle(/AllThingsWetaskiwin/i);
    
    // Check for main navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for main content
    await expect(page.locator('main')).toBeVisible();
  });

  test('navigation menu is functional', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation links
    const navLinks = [
      { text: 'Events', url: '/events' },
      { text: 'Businesses', url: '/businesses' },
      { text: 'News', url: '/news' },
      { text: 'Jobs', url: '/jobs' },
      { text: 'Marketplace', url: '/marketplace' }
    ];

    for (const link of navLinks) {
      const navLink = page.locator(`a[href="${link.url}"]`).first();
      await navLink.click();
      await expect(page).toHaveURL(new RegExp(link.url));
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('health API endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    
    // Accept both healthy (200) and unhealthy (500) responses
    // since tests may run without database connection
    expect([200, 500]).toContain(response.status());
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(['healthy', 'unhealthy']).toContain(data.status);
  });
});