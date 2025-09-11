import { test, expect } from '@playwright/test';

test.describe('E2E Framework Validation', () => {
  test('should validate framework configuration', async ({ request }) => {
    // Test that Playwright is configured correctly by testing API endpoints
    // This test can run without browser installation and handles graceful degradation
    
    // Test health endpoint - should be accessible even without database
    const healthResponse = await request.get('http://localhost:3000/api/health');
    expect(healthResponse.status()).not.toBe(404);
    console.log('✅ Health endpoint is accessible');
    
    // Test API endpoints - they should return proper HTTP codes, not 404
    // Even if they return errors due to missing database, they should be reachable
    const apiEndpoints = [
      '/api/businesses',
      '/api/events', 
      '/api/news',
      '/api/jobs',
      '/api/marketplace'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await request.get(`http://localhost:3000${endpoint}`);
        // Should not be 404 - endpoint exists
        expect(response.status()).not.toBe(404);
        console.log(`✅ ${endpoint} endpoint is accessible (status: ${response.status()})`);
      } catch (error) {
        // If we get network errors, that means server isn't running - that's the real problem
        console.error(`❌ Failed to reach ${endpoint}:`, error.message);
        throw new Error(`API endpoint ${endpoint} is not accessible - server may not be running`);
      }
    }
    
    console.log('✅ All API endpoints are accessible and E2E framework is working correctly');
  });

  test('should validate test helper utilities', () => {
    // Test that our helper utilities are properly structured
    const { generateTestEmail, generateTestUsername, generateTestBusinessName } = require('./utils/test-helpers');
    
    // Test email generator
    const email = generateTestEmail();
    expect(email).toMatch(/@example\.com$/);
    expect(email).toContain('test.');
    
    // Test username generator
    const username = generateTestUsername();
    expect(username).toMatch(/^testuser_\d+$/);
    
    // Test business name generator
    const businessName = generateTestBusinessName();
    expect(businessName).toMatch(/^Test Business \d+$/);
    
    console.log('✅ Test helper utilities are working correctly');
  });

  test('should validate project structure', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Verify key files exist
    const keyFiles = [
      'playwright.config.ts',
      'e2e/utils/test-helpers.ts',
      'e2e/basic-navigation.spec.ts',
      'e2e/auth/authentication.spec.ts',
      'e2e/business/business-workflows.spec.ts',
      'e2e/content/content-workflows.spec.ts',
      'e2e/admin/admin-workflows.spec.ts',
      'e2e/payment/payment-workflows.spec.ts',
      'e2e/mobile-responsive.spec.ts',
      'e2e/visual-regression.spec.ts',
      '.github/workflows/e2e-tests.yml',
      'E2E_TESTING_GUIDE.md'
    ];
    
    for (const file of keyFiles) {
      expect(fs.existsSync(file)).toBeTruthy();
    }
    
    console.log('✅ All required E2E files are present');
  });
});