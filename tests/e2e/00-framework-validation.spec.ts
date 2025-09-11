import { test, expect } from '@playwright/test';

test.describe('E2E Framework Validation', () => {
  test('should load homepage and validate framework setup', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Basic validation that the page loads
    await expect(page).toHaveTitle(/All Things Wetaskiwin/i);
    
    // Take a screenshot for validation
    await page.screenshot({ path: 'tests/e2e/screenshots/framework-validation.png', fullPage: true });
    
    console.log('✅ E2E Framework validation successful!');
  });
});