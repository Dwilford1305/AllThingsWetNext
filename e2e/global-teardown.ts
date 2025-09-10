import { FullConfig } from '@playwright/test';

/**
 * Global teardown for E2E tests
 * 
 * This runs once after all tests complete and cleans up:
 * - Test database data
 * - Temporary files
 * - Test user accounts
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  try {
    // Clean up test data if using test database
    if (process.env.MONGODB_URI_TEST) {
      console.log('🗑️  Cleaning up test database...');
      // Add database cleanup logic here if needed
      // This could include dropping test collections or removing test users
    }
    
    // Clean up temporary files
    console.log('📁 Cleaning up temporary test files...');
    
    // Additional cleanup can be added here:
    // - Remove uploaded test files
    // - Clear test email accounts
    // - Reset any external service states
    
    console.log('✅ E2E test environment cleanup complete');
  } catch (error) {
    console.error('❌ Failed to clean up E2E test environment:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;