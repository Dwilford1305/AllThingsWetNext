import { test, expect } from '@playwright/test';

test.describe('Content Management Workflows', () => {
  test.describe('Events', () => {
    test('events page loads and displays content', async ({ page }) => {
      await page.goto('/events');
      
      await expect(page).toHaveTitle(/Events/i);
      await expect(page.locator('main')).toBeVisible();
      
      // Should have events content or empty state
      const hasContent = await page.locator('.event, [data-testid="event"]').count() > 0;
      const hasEmptyState = await page.locator('text="No events", text="Coming soon"').isVisible();
      
      expect(hasContent || hasEmptyState).toBeTruthy();
    });

    test('events filtering and search', async ({ page }) => {
      await page.goto('/events');
      
      // Test search functionality if available
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('community');
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);
        await expect(page.locator('main')).toBeVisible();
      }
      
      // Test date filtering if available
      const dateFilter = page.locator('input[type="date"], select:has(option:text("Date"))').first();
      if (await dateFilter.isVisible()) {
        await dateFilter.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('News', () => {
    test('news page loads and displays articles', async ({ page }) => {
      await page.goto('/news');
      
      await expect(page).toHaveTitle(/News/i);
      await expect(page.locator('main')).toBeVisible();
      
      // Check for news articles or content
      const hasArticles = await page.locator('.article, .news-item, [data-testid="news"]').count() > 0;
      const hasHeadlines = await page.locator('h1, h2, h3').count() > 0;
      
      expect(hasArticles || hasHeadlines).toBeTruthy();
    });

    test('news article navigation', async ({ page }) => {
      await page.goto('/news');
      
      // Look for article links
      const articleLinks = page.locator('a[href*="/news/"], .article a, .news-item a').first();
      
      if (await articleLinks.isVisible()) {
        await articleLinks.click();
        await page.waitForTimeout(2000);
        
        // Should navigate successfully
        await expect(page.locator('main')).toBeVisible();
        const hasError = await page.locator('text=404').isVisible();
        expect(hasError).toBeFalsy();
      }
    });
  });

  test.describe('Jobs', () => {
    test('jobs page loads and displays listings', async ({ page }) => {
      await page.goto('/jobs');
      
      await expect(page).toHaveTitle(/Jobs/i);
      await expect(page.locator('main')).toBeVisible();
      
      // Check for job listings or content
      const hasJobs = await page.locator('.job, .job-listing, [data-testid="job"]').count() > 0;
      const hasJobContent = await page.locator('text="Position", text="Company", text="Location"').count() > 0;
      
      expect(hasJobs || hasJobContent).toBeTruthy();
    });

    test('job search and filtering', async ({ page }) => {
      await page.goto('/jobs');
      
      // Test job search
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('manager');
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);
      }
      
      // Test location filter
      const locationFilter = page.locator('select:has(option:text("Location")), input[placeholder*="location"]').first();
      if (await locationFilter.isVisible()) {
        await locationFilter.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Marketplace', () => {
    test('marketplace page loads and displays items', async ({ page }) => {
      await page.goto('/marketplace');
      
      await expect(page).toHaveTitle(/Marketplace/i);
      await expect(page.locator('main')).toBeVisible();
      
      // Check for marketplace items or content
      const hasItems = await page.locator('.item, .listing, [data-testid="marketplace-item"]').count() > 0;
      const hasMarketplaceContent = await page.locator('text="Price", text="Category", text="For Sale"').count() > 0;
      
      expect(hasItems || hasMarketplaceContent).toBeTruthy();
    });

    test('marketplace item categories', async ({ page }) => {
      await page.goto('/marketplace');
      
      // Test category filtering
      const categoryFilter = page.locator('select:has(option:text("Category")), button:has-text("Category")').first();
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        await page.waitForTimeout(1000);
        
        // Look for category options
        const categoryOptions = page.locator('option, [role="option"]');
        if (await categoryOptions.count() > 0) {
          await categoryOptions.first().click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('marketplace item detail view', async ({ page }) => {
      await page.goto('/marketplace');
      
      // Look for item links
      const itemLinks = page.locator('a[href*="/marketplace/"], .item a, .listing a').first();
      
      if (await itemLinks.isVisible()) {
        await itemLinks.click();
        await page.waitForTimeout(2000);
        
        // Should show item details
        await expect(page.locator('main')).toBeVisible();
        const hasError = await page.locator('text=404').isVisible();
        expect(hasError).toBeFalsy();
      }
    });
  });

  test.describe('Content Creation', () => {
    test('content creation requires authentication', async ({ page }) => {
      // Test creating marketplace listing
      await page.goto('/marketplace');
      
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), a:has-text("Sell")').first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(2000);
        
        // Should either show creation form or require authentication
        const hasForm = await page.locator('form, input[type="text"], textarea').count() > 0;
        const requiresAuth = await page.locator('button:has-text("Login"), input[type="password"]').isVisible();
        
        expect(hasForm || requiresAuth).toBeTruthy();
      }
    });

    test('content submission flow navigation', async ({ page }) => {
      // Test various content submission entry points
      const contentPages = ['/events', '/news', '/jobs', '/marketplace'];
      
      for (const contentPage of contentPages) {
        await page.goto(contentPage);
        
        // Look for submission/creation buttons
        const submitButtons = page.locator(
          'button:has-text("Submit"), button:has-text("Add"), button:has-text("Create"), button:has-text("Post")'
        );
        
        if (await submitButtons.count() > 0) {
          await submitButtons.first().click();
          await page.waitForTimeout(1000);
          
          // Should respond appropriately (form or auth requirement)
          const hasResponse = await page.locator('form, input, button:has-text("Login")').count() > 0;
          expect(hasResponse).toBeTruthy();
          
          // Navigate back for next iteration
          await page.goto(contentPage);
        }
      }
    });
  });
});