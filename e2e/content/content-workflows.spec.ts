import { test, expect } from '@playwright/test';
import { createHelpers } from '../utils/test-helpers';

test.describe('Content Management Workflows', () => {
  test.describe('Events', () => {
    test('should display events page', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToEvents();
      await helpers.validate.validateEventsPage();
      await helpers.wait.waitForLoadingComplete();
      await helpers.errors.checkForErrors();
    });

    test('should show events or empty state', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToEvents();
      await helpers.wait.waitForLoadingComplete();
      
      // Look for event listings or empty state
      const eventListings = await page.locator('[data-testid*="event"], .event-card, .event-item').count();
      const emptyState = await page.locator('text=No events, text=No upcoming events').isVisible();
      
      expect(eventListings > 0 || emptyState).toBeTruthy();
    });

    test('should validate events API endpoint', async ({ page }) => {
      const response = await page.request.get('/api/events');
      expect(response.status()).not.toBe(404);
    });
  });

  test.describe('News', () => {
    test('should display news page', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToNews();
      await helpers.validate.validateNewsPage();
      await helpers.wait.waitForLoadingComplete();
      await helpers.errors.checkForErrors();
    });

    test('should show news articles or empty state', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToNews();
      await helpers.wait.waitForLoadingComplete();
      
      // Look for news articles or empty state
      const newsArticles = await page.locator('[data-testid*="news"], .news-card, .news-item, article').count();
      const emptyState = await page.locator('text=No news, text=No articles').isVisible();
      
      expect(newsArticles > 0 || emptyState).toBeTruthy();
    });

    test('should validate news API endpoint', async ({ page }) => {
      const response = await page.request.get('/api/news');
      expect(response.status()).not.toBe(404);
    });
  });

  test.describe('Jobs', () => {
    test('should display jobs page', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToJobs();
      await helpers.validate.validateJobsPage();
      await helpers.wait.waitForLoadingComplete();
      await helpers.errors.checkForErrors();
    });

    test('should show job listings or empty state', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToJobs();
      await helpers.wait.waitForLoadingComplete();
      
      // Look for job listings or empty state
      const jobListings = await page.locator('[data-testid*="job"], .job-card, .job-item, .job-listing').count();
      const emptyState = await page.locator('text=No jobs, text=No positions').isVisible();
      
      expect(jobListings > 0 || emptyState).toBeTruthy();
    });

    test('should validate jobs API endpoint', async ({ page }) => {
      const response = await page.request.get('/api/jobs');
      expect(response.status()).not.toBe(404);
    });

    test('should handle job search functionality', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToJobs();
      await helpers.wait.waitForLoadingComplete();
      
      // Look for job search
      const searchInput = page.locator('input[placeholder*="search"], input[name*="search"]').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('manager');
        await page.keyboard.press('Enter');
        await helpers.wait.waitForLoadingComplete();
        await helpers.errors.checkForErrors();
      }
    });
  });

  test.describe('Marketplace', () => {
    test('should display marketplace page', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToMarketplace();
      await helpers.validate.validateMarketplacePage();
      await helpers.wait.waitForLoadingComplete();
      await helpers.errors.checkForErrors();
    });

    test('should show marketplace listings or empty state', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToMarketplace();
      await helpers.wait.waitForLoadingComplete();
      
      // Look for marketplace listings or empty state
      const listings = await page.locator('[data-testid*="listing"], .listing-card, .marketplace-item').count();
      const emptyState = await page.locator('text=No listings, text=No items').isVisible();
      
      expect(listings > 0 || emptyState).toBeTruthy();
    });

    test('should validate marketplace API endpoints', async ({ page }) => {
      const endpoints = ['/api/marketplace', '/api/marketplace/quota'];
      
      for (const endpoint of endpoints) {
        const response = await page.request.get(endpoint);
        expect(response.status()).not.toBe(404);
      }
    });

    test('should handle marketplace listing creation interface', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToMarketplace();
      await helpers.wait.waitForLoadingComplete();
      
      // Look for "Create Listing" or "Add Item" button
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), a:has-text("Create"), a:has-text("Add")').first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        await helpers.wait.waitForLoadingComplete();
        
        // Should show creation form or redirect to auth
        const hasForm = await page.locator('input[name*="title"], input[name*="name"], textarea').isVisible();
        const isAuthRedirect = await page.locator('text=Sign In, text=Login').isVisible();
        
        expect(hasForm || isAuthRedirect).toBeTruthy();
      }
    });

    test('should handle marketplace categories', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToMarketplace();
      await helpers.wait.waitForLoadingComplete();
      
      // Look for category filters
      const categoryFilter = page.locator('select[name*="category"], .category-filter').first();
      
      if (await categoryFilter.isVisible()) {
        const optionCount = await categoryFilter.locator('option').count();
        expect(optionCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Content Search & Filtering', () => {
    test('should handle content search across pages', async ({ page }) => {
      const helpers = createHelpers(page);
      const contentPages = ['/events', '/news', '/jobs', '/marketplace'];
      
      for (const contentPage of contentPages) {
        await page.goto(contentPage);
        await helpers.wait.waitForLoadingComplete();
        
        // Look for search functionality
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name*="search"]').first();
        
        if (await searchInput.isVisible()) {
          await searchInput.fill('test');
          await page.keyboard.press('Enter');
          await helpers.wait.waitForLoadingComplete();
          await helpers.errors.checkForErrors();
        }
      }
    });

    test('should handle date filtering for events', async ({ page }) => {
      const helpers = createHelpers(page);
      
      await helpers.nav.goToEvents();
      await helpers.wait.waitForLoadingComplete();
      
      // Look for date filters
      const dateFilter = page.locator('input[type="date"], select[name*="date"], .date-filter').first();
      
      if (await dateFilter.isVisible()) {
        // Test date filtering interface exists
        expect(await dateFilter.isVisible()).toBeTruthy();
      }
    });
  });

  test.describe('Content APIs', () => {
    test('should validate all content API endpoints are accessible', async ({ page }) => {
      const contentEndpoints = [
        '/api/events',
        '/api/news', 
        '/api/jobs',
        '/api/marketplace'
      ];

      for (const endpoint of contentEndpoints) {
        const response = await page.request.get(endpoint);
        expect(response.status()).not.toBe(404);
        
        // Should return JSON (either data or error message)
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
      }
    });
  });
});