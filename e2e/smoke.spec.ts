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

  test('health API endpoint responds appropriately', async ({ request }) => {
    const response = await request.get('/api/health');
    
    // Check if we're in mock database environment
    const isMockEnv = process.env.E2E_MOCK_DATABASE === 'true';
    
    if (isMockEnv) {
      // In mock environment, accept either healthy or unhealthy responses
      expect([200, 500]).toContain(response.status());
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(['healthy', 'unhealthy']).toContain(data.status);
    } else {
      // With real test database, should return healthy status
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data.checks.database).toBe(true);
      expect(data.checks.overall).toBe(true);
    }
  });

  test('events API responds with data or graceful error', async ({ request }) => {
    const response = await request.get('/api/events');
    const isMockEnv = process.env.E2E_MOCK_DATABASE === 'true';
    
    if (isMockEnv) {
      // In mock environment, should gracefully handle database errors
      const data = await response.json();
      expect(data).toHaveProperty('success');
    } else {
      // With real database, should return successful response
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.events)).toBe(true);
      expect(data.events.length).toBeGreaterThan(0);
    }
  });

  test('businesses API responds with data or graceful error', async ({ request }) => {
    const response = await request.get('/api/businesses');
    const isMockEnv = process.env.E2E_MOCK_DATABASE === 'true';
    
    if (isMockEnv) {
      // In mock environment, should gracefully handle database errors
      const data = await response.json();
      expect(data).toHaveProperty('success');
    } else {
      // With real database, should return successful response
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.businesses)).toBe(true);
      expect(data.businesses.length).toBeGreaterThan(0);
    }
  });

  test('news API responds with data or graceful error', async ({ request }) => {
    const response = await request.get('/api/news');
    const isMockEnv = process.env.E2E_MOCK_DATABASE === 'true';
    
    if (isMockEnv) {
      // In mock environment, should gracefully handle database errors
      const data = await response.json();
      expect(data).toHaveProperty('success');
    } else {
      // With real database, should return successful response
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.news)).toBe(true);
      expect(data.news.length).toBeGreaterThan(0);
    }
  });
});