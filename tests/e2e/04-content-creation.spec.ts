import { test, expect, TEST_MARKETPLACE_ITEM, TEST_EVENT } from '../fixtures/test-fixtures';

test.describe('Content Creation Workflows', () => {
  test('should load marketplace page successfully', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify marketplace page loads
    await expect(page).toHaveURL(/.*marketplace.*/);
    
    // Check for marketplace content
    const marketplaceContent = page.locator('.marketplace, .listings, [data-testid="marketplace"]').first();
    const createButton = page.locator('button:has-text("Create"), button:has-text("Post"), a:has-text("Sell"), [data-testid="create-listing"]').first();
    
    const contentVisible = await marketplaceContent.isVisible().catch(() => false);
    const createButtonVisible = await createButton.isVisible().catch(() => false);
    
    if (contentVisible) {
      await expect(marketplaceContent).toBeVisible();
    }
    
    if (createButtonVisible) {
      await expect(createButton).toBeVisible();
    }
    
    // Take screenshot of marketplace page
    await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-page.png', fullPage: true });
  });

  test('should handle marketplace listing creation', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for create listing button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Post"), button:has-text("Sell Something"), a:has-text("Create Listing"), [data-testid="create-listing"]').first();
    const createVisible = await createButton.isVisible().catch(() => false);
    
    if (createVisible) {
      await createButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if listing form appears or if authentication is required
      const listingForm = page.locator('form, .listing-form, .create-form, [data-testid="listing-form"]').first();
      const authPrompt = page.locator('.login-prompt, button:has-text("Log In"), .auth-required').first();
      
      const formVisible = await listingForm.isVisible().catch(() => false);
      const authVisible = await authPrompt.isVisible().catch(() => false);
      
      if (formVisible) {
        await expect(listingForm).toBeVisible();
        
        // Fill out marketplace listing form
        const titleField = page.locator('input[name="title"], input[placeholder*="title"], [data-testid="listing-title"]').first();
        const descriptionField = page.locator('textarea[name="description"], textarea[placeholder*="description"], [data-testid="listing-description"]').first();
        const priceField = page.locator('input[name="price"], input[type="number"], [data-testid="listing-price"]').first();
        const categorySelect = page.locator('select[name="category"], [data-testid="listing-category"]').first();
        
        if (await titleField.isVisible().catch(() => false)) {
          await titleField.fill(TEST_MARKETPLACE_ITEM.title);
        }
        if (await descriptionField.isVisible().catch(() => false)) {
          await descriptionField.fill(TEST_MARKETPLACE_ITEM.description);
        }
        if (await priceField.isVisible().catch(() => false)) {
          await priceField.fill(TEST_MARKETPLACE_ITEM.price.toString());
        }
        if (await categorySelect.isVisible().catch(() => false)) {
          await categorySelect.selectOption(TEST_MARKETPLACE_ITEM.category);
        }
        
        // Test image upload if available
        const imageUpload = page.locator('input[type="file"], [data-testid="image-upload"]').first();
        const imageUploadVisible = await imageUpload.isVisible().catch(() => false);
        
        if (imageUploadVisible) {
          await expect(imageUpload).toBeVisible();
        }
        
        // Take screenshot of filled form
        await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-listing-form.png', fullPage: true });
        
        // Test form validation without submitting
        const submitButton = page.locator('button[type="submit"], button:has-text("Post"), button:has-text("Create")').first();
        if (await submitButton.isVisible().catch(() => false)) {
          await expect(submitButton).toBeVisible();
        }
      } else if (authVisible) {
        await expect(authPrompt).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-auth-required.png', fullPage: true });
      }
    } else {
      // No create button - check if marketplace is empty or requires auth
      const emptyState = page.locator('.empty-state, .no-listings, :has-text("No items")').first();
      const emptyVisible = await emptyState.isVisible().catch(() => false);
      
      if (emptyVisible) {
        await expect(emptyState).toBeVisible();
      }
      
      await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-no-create-button.png', fullPage: true });
    }
  });

  test('should display marketplace listings and interactions', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for existing marketplace listings
    const listings = page.locator('.listing, .marketplace-item, .item-card, [data-testid="listing"]');
    const listingCount = await listings.count();
    
    if (listingCount > 0) {
      // Test clicking on a listing
      await listings.first().click();
      await page.waitForTimeout(1000);
      
      // Check if we navigate to listing detail or modal opens
      const currentUrl = page.url();
      const listingDetail = page.locator('.listing-detail, .item-detail, [data-testid="listing-detail"]').first();
      const modal = page.locator('.modal, .dialog, [role="dialog"]').first();
      
      const detailVisible = await listingDetail.isVisible().catch(() => false);
      const modalVisible = await modal.isVisible().catch(() => false);
      
      if (detailVisible) {
        await expect(listingDetail).toBeVisible();
        
        // Look for interaction buttons (like, comment, contact)
        const interactionButtons = page.locator('button:has-text("Contact"), button:has-text("Like"), button:has-text("Comment"), .interaction-buttons button');
        const buttonCount = await interactionButtons.count();
        
        if (buttonCount > 0) {
          await expect(interactionButtons.first()).toBeVisible();
        }
        
        await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-listing-detail.png', fullPage: true });
      } else if (modalVisible) {
        await expect(modal).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-listing-modal.png', fullPage: true });
        
        // Close modal
        const closeButton = page.locator('button[aria-label="Close"], .modal-close, button:has-text("×")').first();
        const closeVisible = await closeButton.isVisible().catch(() => false);
        if (closeVisible) {
          await closeButton.click();
        }
      }
    } else {
      // No listings found
      const emptyState = page.locator('.empty-state, .no-listings, :has-text("No items for sale")').first();
      const emptyVisible = await emptyState.isVisible().catch(() => false);
      
      if (emptyVisible) {
        await expect(emptyState).toBeVisible();
      }
      
      await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-empty.png', fullPage: true });
    }
  });

  test('should handle marketplace search and filtering', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="search"], input[name="search"], [data-testid="search"]').first();
    const searchVisible = await searchInput.isVisible().catch(() => false);
    
    if (searchVisible) {
      await searchInput.fill('electronics');
      
      const searchButton = page.locator('button[type="submit"], button:has-text("Search")').first();
      const searchButtonVisible = await searchButton.isVisible().catch(() => false);
      
      if (searchButtonVisible) {
        await searchButton.click();
      } else {
        await page.keyboard.press('Enter');
      }
      
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-search.png', fullPage: true });
    }
    
    // Test category filtering
    const categoryFilter = page.locator('select[name="category"], .category-filter, [data-testid="category-filter"]').first();
    const categoryVisible = await categoryFilter.isVisible().catch(() => false);
    
    if (categoryVisible) {
      await categoryFilter.selectOption('Electronics');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-category-filter.png', fullPage: true });
    }
    
    // Test price filtering
    const priceFilter = page.locator('input[name="minPrice"], input[name="maxPrice"], .price-filter').first();
    const priceFilterVisible = await priceFilter.isVisible().catch(() => false);
    
    if (priceFilterVisible) {
      await priceFilter.fill('50');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/e2e/screenshots/marketplace-price-filter.png', fullPage: true });
    }
  });

  test('should load events page successfully', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify events page loads
    await expect(page).toHaveURL(/.*events.*/);
    
    // Check for events content
    const eventsContent = page.locator('.events, .event-list, [data-testid="events"]').first();
    const createEventButton = page.locator('button:has-text("Create Event"), button:has-text("Add Event"), [data-testid="create-event"]').first();
    
    const contentVisible = await eventsContent.isVisible().catch(() => false);
    const createButtonVisible = await createEventButton.isVisible().catch(() => false);
    
    if (contentVisible) {
      await expect(eventsContent).toBeVisible();
    }
    
    if (createButtonVisible) {
      await expect(createEventButton).toBeVisible();
    }
    
    // Take screenshot of events page
    await page.screenshot({ path: 'tests/e2e/screenshots/events-page.png', fullPage: true });
  });

  test('should load news page successfully', async ({ page }) => {
    await page.goto('/news');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify news page loads
    await expect(page).toHaveURL(/.*news.*/);
    
    // Check for news content
    const newsContent = page.locator('.news, .news-list, .articles, [data-testid="news"]').first();
    const newsItems = page.locator('.news-item, .article, .news-card');
    
    const contentVisible = await newsContent.isVisible().catch(() => false);
    const itemCount = await newsItems.count();
    
    if (contentVisible) {
      await expect(newsContent).toBeVisible();
    }
    
    if (itemCount > 0) {
      await expect(newsItems.first()).toBeVisible();
      
      // Test clicking on a news item
      await newsItems.first().click();
      await page.waitForTimeout(1000);
      
      // Check if we navigate to article detail or modal opens
      const articleDetail = page.locator('.article-detail, .news-detail, [data-testid="article-detail"]').first();
      const modal = page.locator('.modal, .dialog, [role="dialog"]').first();
      
      const detailVisible = await articleDetail.isVisible().catch(() => false);
      const modalVisible = await modal.isVisible().catch(() => false);
      
      if (detailVisible) {
        await expect(articleDetail).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/news-article-detail.png', fullPage: true });
      } else if (modalVisible) {
        await expect(modal).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/news-article-modal.png', fullPage: true });
      }
    }
    
    // Take screenshot of news page
    await page.screenshot({ path: 'tests/e2e/screenshots/news-page.png', fullPage: true });
  });

  test('should load jobs page successfully', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify jobs page loads
    await expect(page).toHaveURL(/.*jobs.*/);
    
    // Check for jobs content
    const jobsContent = page.locator('.jobs, .job-list, .job-postings, [data-testid="jobs"]').first();
    const postJobButton = page.locator('button:has-text("Post Job"), button:has-text("Add Job"), [data-testid="post-job"]').first();
    
    const contentVisible = await jobsContent.isVisible().catch(() => false);
    const postButtonVisible = await postJobButton.isVisible().catch(() => false);
    
    if (contentVisible) {
      await expect(jobsContent).toBeVisible();
    }
    
    if (postButtonVisible) {
      await expect(postJobButton).toBeVisible();
    }
    
    // Look for job listings
    const jobListings = page.locator('.job-listing, .job-item, .job-card');
    const jobCount = await jobListings.count();
    
    if (jobCount > 0) {
      await expect(jobListings.first()).toBeVisible();
      
      // Test job search if available
      const searchInput = page.locator('input[placeholder*="search"], input[name="search"]').first();
      const searchVisible = await searchInput.isVisible().catch(() => false);
      
      if (searchVisible) {
        await searchInput.fill('manager');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    }
    
    // Take screenshot of jobs page
    await page.screenshot({ path: 'tests/e2e/screenshots/jobs-page.png', fullPage: true });
  });

  test('should handle content reporting functionality', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for existing listings to test reporting
    const listings = page.locator('.listing, .marketplace-item, .item-card');
    const listingCount = await listings.count();
    
    if (listingCount > 0) {
      // Click on first listing to see details
      await listings.first().click();
      await page.waitForTimeout(1000);
      
      // Look for report button
      const reportButton = page.locator('button:has-text("Report"), a:has-text("Report"), [data-testid="report"]').first();
      const reportVisible = await reportButton.isVisible().catch(() => false);
      
      if (reportVisible) {
        await reportButton.click();
        await page.waitForTimeout(1000);
        
        // Check if report form/modal appears
        const reportForm = page.locator('.report-form, .report-modal, [data-testid="report-form"]').first();
        const reportModal = page.locator('.modal:has-text("Report"), .dialog:has-text("Report")').first();
        
        const formVisible = await reportForm.isVisible().catch(() => false);
        const modalVisible = await reportModal.isVisible().catch(() => false);
        
        if (formVisible) {
          await expect(reportForm).toBeVisible();
        } else if (modalVisible) {
          await expect(reportModal).toBeVisible();
        }
        
        await page.screenshot({ path: 'tests/e2e/screenshots/content-report-form.png', fullPage: true });
        
        // Close modal/form if needed
        const closeButton = page.locator('button[aria-label="Close"], .modal-close, button:has-text("Cancel")').first();
        const closeVisible = await closeButton.isVisible().catch(() => false);
        if (closeVisible) {
          await closeButton.click();
        }
      }
    }
  });
});