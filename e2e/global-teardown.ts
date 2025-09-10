import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Clean up MongoDB Memory Server if it was set up
    if (process.env.E2E_MONGOD_INSTANCE === 'true') {
      try {
        // In a real implementation, we'd need to store the mongod instance
        // For now, just clear the environment variable
        delete process.env.E2E_MONGOD_INSTANCE;
        console.log('✅ MongoDB Memory Server instance reference cleared');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('⚠️ MongoDB Memory Server cleanup failed:', errorMessage);
      }
    }
    
    console.log('✅ Global test teardown completed');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw here to avoid masking test failures
  }
}

export default globalTeardown;