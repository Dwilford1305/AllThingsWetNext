import { defineConfig, devices } from '@playwright/test';

/**
 * Mock Playwright configuration for environments where browser binaries cannot be downloaded
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Disable for mock mode
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* No retries in mock mode */
  retries: 0,
  
  /* Single worker for mock mode */
  workers: 1,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['json', { outputFile: 'playwright-mock-results.json' }]
  ],

  /* Shorter timeout for validation */
  timeout: 10 * 1000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 2000,
  },

  /* Mock settings - no actual browser interaction */
  use: {
    /* Base URL for validation */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* No traces needed for mock mode */
    trace: 'off',

    /* No screenshots needed for mock mode */
    screenshot: 'off',

    /* No video needed for mock mode */
    video: 'off',
  },

  /* Only test the framework validation without browsers */
  projects: [
    {
      name: 'framework-validation',
      testMatch: '**/00-framework-validation.spec.ts',
      use: { 
        // Mock browser context
        browserName: 'chromium',
      },
    },
  ],

  /* Don't start webserver in mock mode - tests will handle their own validation */
  // webServer: undefined,
});