import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Clean up test database if it was set up
    if (process.env.E2E_MOCK_DATABASE !== 'true') {
      try {
        const { teardownTestDB } = await import('./setup/test-db');
        await teardownTestDB();
        console.log('✅ Test database cleaned up');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('⚠️ Test database cleanup failed:', errorMessage);
      }
    }
    
    console.log('✅ Global test teardown completed');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw here to avoid masking test failures
  }
}

export default globalTeardown;