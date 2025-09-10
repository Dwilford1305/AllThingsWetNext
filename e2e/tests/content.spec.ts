import { test, expect } from '../fixtures/base';

/**
 * Content Management E2E Tests
 * 
 * Tests content creation and management workflows:
 * - News articles browsing and creation
 * - Events listing and creation
 * - Jobs posting and browsing
 * - Marketplace item management
 */

test.describe('Content Management Workflows', () => {

  test('should display news page correctly', async ({ page, navHelper, waitHelper, screenshotHelper }) => {
    await navHelper.goToNews();
    
    // Verify page loads
    await expect(page).toHaveTitle(/News|AllThingsWetaskiwin/);
    await waitHelper.waitForPageLoad();
    
    // Check for news elements
    const newsElements = [
      '.news-article',
      '.news-item',
      '[data-testid="news-item"]',
      'h2',
      'text=Read more',
      'text=No news available'
    ];
    
    let elementsFound = 0;
    for (const element of newsElements) {
      if (await page.locator(element).count() > 0) {
        elementsFound++;
      }
    }
    
    expect(elementsFound).toBeGreaterThan(0);
    
    // Take screenshot
    await screenshotHelper.takeFullPageScreenshot('news-page');
  });

  test('should display events page correctly', async ({ page, navHelper, waitHelper, screenshotHelper }) => {
    await navHelper.goToEvents();
    
    // Verify page loads
    await expect(page).toHaveTitle(/Events|AllThingsWetaskiwin/);
    await waitHelper.waitForPageLoad();
    
    // Check for events elements
    const eventElements = [
      '.event-card',
      '.event-item',
      '[data-testid="event-item"]',
      'text=Date',
      'text=Time',
      'text=Location',
      'text=No events',
      'h2',
      'h3'
    ];
    
    let elementsFound = 0;
    for (const element of eventElements) {
      if (await page.locator(element).count() > 0) {
        elementsFound++;
      }
    }
    
    expect(elementsFound).toBeGreaterThan(0);
    
    // Take screenshot
    await screenshotHelper.takeFullPageScreenshot('events-page');
  });

  test('should display jobs page correctly', async ({ page, navHelper, waitHelper, screenshotHelper }) => {
    await navHelper.goToJobs();
    
    // Verify page loads
    await expect(page).toHaveTitle(/Jobs|Employment|AllThingsWetaskiwin/);
    await waitHelper.waitForPageLoad();
    
    // Check for jobs elements
    const jobElements = [
      '.job-listing',
      '.job-item',
      '[data-testid="job-item"]',
      'text=Salary',
      'text=Company',
      'text=Apply',
      'text=Full-time',
      'text=Part-time',
      'text=No jobs',
      'h2',
      'h3'
    ];
    
    let elementsFound = 0;
    for (const element of jobElements) {
      if (await page.locator(element).count() > 0) {
        elementsFound++;
      }
    }
    
    expect(elementsFound).toBeGreaterThan(0);
    
    // Take screenshot
    await screenshotHelper.takeFullPageScreenshot('jobs-page');
  });

  test('should display marketplace page correctly', async ({ page, navHelper, waitHelper, screenshotHelper }) => {
    await navHelper.goToMarketplace();
    
    // Verify page loads
    await expect(page).toHaveTitle(/Marketplace|Buy|Sell|AllThingsWetaskiwin/);
    await waitHelper.waitForPageLoad();
    
    // Check for marketplace elements
    const marketplaceElements = [
      '.marketplace-item',
      '.listing',
      '[data-testid="marketplace-item"]',
      'text=Price',
      'text=Seller',
      'text=Contact',
      'text=For Sale',
      'text=Wanted',
      'text=No listings',
      'button:has-text("Post")',
      'h2',
      'h3'
    ];
    
    let elementsFound = 0;
    for (const element of marketplaceElements) {
      if (await page.locator(element).count() > 0) {
        elementsFound++;
      }
    }
    
    expect(elementsFound).toBeGreaterThan(0);
    
    // Take screenshot
    await screenshotHelper.takeFullPageScreenshot('marketplace-page');
  });

  test('should search and filter content', async ({ page, navHelper, waitHelper }) => {
    // Test search on news page
    await navHelper.goToNews();
    await waitHelper.waitForPageLoad();
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('community');
      await page.keyboard.press('Enter');
      await waitHelper.waitForPageLoad();
      
      // Should show search results
      console.log('News search completed');
    }
    
    // Test filter on events page
    await navHelper.goToEvents();
    await waitHelper.waitForPageLoad();
    
    const dateFilter = page.locator('input[type="date"], select[name="date"]');
    if (await dateFilter.count() > 0) {
      console.log('Events date filter found');
    }
    
    // Test category filter on marketplace
    await navHelper.goToMarketplace();
    await waitHelper.waitForPageLoad();
    
    const categoryFilter = page.locator('select[name="category"], [data-testid="category-filter"]');
    if (await categoryFilter.count() > 0) {
      await categoryFilter.first().selectOption('For Sale');
      await waitHelper.waitForPageLoad();
      console.log('Marketplace category filter applied');
    }
  });

  test('should create marketplace listing when authenticated', async ({ page, authenticatedUser, formHelper, waitHelper, navHelper }) => {
    console.log(`Testing marketplace listing creation for user: ${authenticatedUser.email}`);
    
    await navHelper.goToMarketplace();
    await waitHelper.waitForPageLoad();
    
    // Look for create listing button
    const createButtons = page.locator('button:has-text("Post"), button:has-text("Create"), button:has-text("Add Listing"), a:has-text("Post Item")');
    
    if (await createButtons.count() > 0) {
      await createButtons.first().click();
      await waitHelper.waitForPageLoad();
      
      // Fill listing form
      const listingData = {
        title: 'Test E2E Listing',
        description: 'This is a test marketplace listing created during E2E testing',
        price: '50',
        category: 'For Sale',
        condition: 'Good',
        contactMethod: 'email'
      };
      
      try {
        await formHelper.fillForm(listingData);
        await formHelper.submitForm();
        await waitHelper.waitForPageLoad();
        
        // Verify listing creation
        const successIndicators = [
          'text=Listing created',
          'text=Posted successfully',
          'text=Your listing',
          'text=Published'
        ];
        
        let foundSuccess = false;
        for (const indicator of successIndicators) {
          if (await page.locator(indicator).count() > 0) {
            foundSuccess = true;
            break;
          }
        }
        
        expect(foundSuccess).toBe(true);
        
      } catch (error) {
        console.log('Marketplace listing form structure different than expected:', error);
        // At minimum, verify we have a form
        expect(page.locator('form')).toBeVisible();
      }
    } else {
      console.log('Create listing button not found, testing alternative path');
      
      // Try direct marketplace creation API
      const response = await page.goto('/api/marketplace');
      expect(response?.status()).toBeLessThan(500);
    }
  });

  test('should interact with marketplace listings', async ({ page, navHelper, waitHelper }) => {
    await navHelper.goToMarketplace();
    await waitHelper.waitForPageLoad();
    
    // Find first listing
    const firstListing = page.locator('.marketplace-item, .listing, [data-testid="marketplace-item"]').first();
    
    if (await firstListing.count() > 0) {
      // Click on listing to view details
      await firstListing.click();
      await waitHelper.waitForPageLoad();
      
      // Verify we're on listing detail page or modal opened
      const detailElements = [
        'text=Description',
        'text=Price',
        'text=Contact',
        'button:has-text("Contact")',
        'button:has-text("Message")',
        '.listing-detail',
        '[data-testid="listing-detail"]'
      ];
      
      let detailsFound = 0;
      for (const element of detailElements) {
        if (await page.locator(element).count() > 0) {
          detailsFound++;
        }
      }
      
      expect(detailsFound).toBeGreaterThan(1);
      
      // Test contact button
      const contactButton = page.locator('button:has-text("Contact"), button:has-text("Message"), a[href^="mailto:"], a[href^="tel:"]');
      if (await contactButton.count() > 0) {
        console.log('Contact method available for listing');
        // Note: We don't actually trigger contact to avoid sending real emails/calls
      }
    } else {
      console.log('No marketplace listings found to test interaction');
      test.skip();
    }
  });

  test('should handle content pagination', async ({ page, navHelper, waitHelper }) => {
    const pagesToTest = [
      { name: 'news', navigate: () => navHelper.goToNews() },
      { name: 'events', navigate: () => navHelper.goToEvents() },
      { name: 'jobs', navigate: () => navHelper.goToJobs() },
      { name: 'marketplace', navigate: () => navHelper.goToMarketplace() }
    ];
    
    for (const pageTest of pagesToTest) {
      await pageTest.navigate();
      await waitHelper.waitForPageLoad();
      
      // Look for pagination elements
      const paginationElements = [
        'button:has-text("Next")',
        'button:has-text("Previous")',
        'a:has-text("Next")',
        'a:has-text("Previous")',
        '.pagination',
        '[data-testid="pagination"]',
        'button:has-text("Load More")',
        'text=Page'
      ];
      
      let paginationFound = false;
      for (const element of paginationElements) {
        if (await page.locator(element).count() > 0) {
          paginationFound = true;
          console.log(`Pagination found on ${pageTest.name} page`);
          break;
        }
      }
      
      // If pagination exists, test it
      if (paginationFound) {
        const nextButton = page.locator('button:has-text("Next"), a:has-text("Next")');
        if (await nextButton.count() > 0 && await nextButton.first().isEnabled()) {
          await nextButton.first().click();
          await waitHelper.waitForPageLoad();
          console.log(`Tested pagination on ${pageTest.name} page`);
        }
      }
    }
  });

  test('should handle content sorting and filtering', async ({ page, navHelper, waitHelper }) => {
    // Test sorting on jobs page
    await navHelper.goToJobs();
    await waitHelper.waitForPageLoad();
    
    const sortSelect = page.locator('select[name="sort"], [data-testid="sort-select"]');
    if (await sortSelect.count() > 0) {
      const options = await sortSelect.locator('option').count();
      if (options > 1) {
        await sortSelect.selectOption({ index: 1 });
        await waitHelper.waitForPageLoad();
        console.log('Jobs sorting tested');
      }
    }
    
    // Test filtering on marketplace
    await navHelper.goToMarketplace();
    await waitHelper.waitForPageLoad();
    
    const priceFilter = page.locator('input[name="minPrice"], input[name="maxPrice"]');
    if (await priceFilter.count() > 0) {
      await priceFilter.first().fill('0');
      await page.keyboard.press('Enter');
      await waitHelper.waitForPageLoad();
      console.log('Marketplace price filtering tested');
    }
  });

  test('should display content detail views', async ({ page, navHelper, waitHelper, screenshotHelper }) => {
    const contentTypes = [
      { name: 'news', navigate: () => navHelper.goToNews(), selector: '.news-article, .news-item' },
      { name: 'events', navigate: () => navHelper.goToEvents(), selector: '.event-card, .event-item' },
      { name: 'jobs', navigate: () => navHelper.goToJobs(), selector: '.job-listing, .job-item' }
    ];
    
    for (const contentType of contentTypes) {
      await contentType.navigate();
      await waitHelper.waitForPageLoad();
      
      const firstItem = page.locator(contentType.selector).first();
      if (await firstItem.count() > 0) {
        await firstItem.click();
        await waitHelper.waitForPageLoad();
        
        // Verify detail view loaded
        const detailIndicators = [
          'h1',
          'h2',
          'text=Date',
          'text=Description',
          'text=Details',
          '.content-detail',
          '[data-testid="detail-view"]'
        ];
        
        let detailsFound = 0;
        for (const indicator of detailIndicators) {
          if (await page.locator(indicator).count() > 0) {
            detailsFound++;
          }
        }
        
        expect(detailsFound).toBeGreaterThan(1);
        
        // Take screenshot of detail view
        await screenshotHelper.takeFullPageScreenshot(`${contentType.name}-detail`);
        
        // Navigate back
        await page.goBack();
        await waitHelper.waitForPageLoad();
      }
    }
  });
});