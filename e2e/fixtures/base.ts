import { test as base, expect } from '@playwright/test';
import { 
  AuthHelper, 
  NavigationHelper, 
  FormHelper, 
  WaitHelper, 
  ScreenshotHelper,
  TestDataGenerator,
  TestUser,
  TestBusiness
} from '../utils/test-helpers';

/**
 * Extended Playwright fixtures for AllThingsWetNext E2E testing
 * 
 * These fixtures provide:
 * - Pre-configured helper classes
 * - Test data generation
 * - Common test patterns
 */

type TestFixtures = {
  authHelper: AuthHelper;
  navHelper: NavigationHelper;
  formHelper: FormHelper;
  waitHelper: WaitHelper;
  screenshotHelper: ScreenshotHelper;
  testUser: TestUser;
  testBusiness: TestBusiness;
  authenticatedUser: TestUser;
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  // Helper fixtures
  authHelper: async ({ page }, use) => {
    await use(new AuthHelper(page));
  },

  navHelper: async ({ page }, use) => {
    await use(new NavigationHelper(page));
  },

  formHelper: async ({ page }, use) => {
    await use(new FormHelper(page));
  },

  waitHelper: async ({ page }, use) => {
    await use(new WaitHelper(page));
  },

  screenshotHelper: async ({ page }, use) => {
    await use(new ScreenshotHelper(page));
  },

  // Data generation fixtures
  testUser: async ({}, use) => {
    const user = TestDataGenerator.generateTestUser();
    await use(user);
  },

  testBusiness: async ({}, use) => {
    const business = TestDataGenerator.generateTestBusiness();
    await use(business);
  },

  // Authenticated user fixture - automatically creates and logs in a user
  authenticatedUser: async ({ page, authHelper }, use) => {
    const user = TestDataGenerator.generateTestUser();
    
    try {
      // Register the user first
      await authHelper.register(user);
      
      // Then log them in
      await authHelper.login(user);
      
      // Verify login was successful
      expect(await authHelper.isLoggedIn()).toBe(true);
      
      await use(user);
    } finally {
      // Cleanup: logout after test
      try {
        await authHelper.logout();
      } catch (error) {
        console.warn('Failed to logout user during cleanup:', error);
      }
    }
  },
});

/**
 * Export expect for use in tests
 */
export { expect } from '@playwright/test';