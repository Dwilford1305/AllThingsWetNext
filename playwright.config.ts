import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['line']
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Global timeout for each action (30 seconds)
    actionTimeout: 30000,
    
    // Global timeout for navigation actions
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    // Primary browser for CI/CD
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Additional browsers (can be disabled if not available)
    ...(process.env.FULL_BROWSER_TESTING === 'true' ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },

      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },

      // Test against mobile viewports
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 12'] },
      },

      // Test against branded browsers
      {
        name: 'Microsoft Edge',
        use: { ...devices['Desktop Edge'], channel: 'msedge' },
      },
      {
        name: 'Google Chrome',
        use: { ...devices['Desktop Chrome'], channel: 'chrome' },
      },
    ] : []),
  ],

  // Global setup for tests
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),

  // Run your local dev server before starting the tests
  webServer: {
    command: 'NODE_ENV=test NEXTAUTH_URL=http://localhost:3000 NEXTAUTH_SECRET=test-secret-for-e2e-testing-only-not-for-production JWT_SECRET=test-jwt-secret-for-e2e-testing-only-not-for-production-minimum-32-chars JWT_REFRESH_SECRET=test-jwt-refresh-secret-for-e2e-testing-only-not-for-production ADMIN_EMAIL=admin@test.example.com SUPER_ADMIN_SETUP_KEY=test-admin-setup-key-for-e2e-only CRON_SECRET=test-cron-secret-for-e2e-testing-only npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false, // Always start fresh for E2E tests
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120000, // 2 minutes timeout for server startup
  },

  // Test timeout (5 minutes)
  timeout: 300000,

  // Global timeout (10 minutes total)
  globalTimeout: 600000,

  // Expect timeout
  expect: {
    // Timeout for expect() calls
    timeout: 10000,
  },

  // Output directory for test results
  outputDir: 'test-results/',
});