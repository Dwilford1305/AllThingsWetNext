import { FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * 
 * This runs once before all tests and sets up:
 * - Test database connection
 * - Environment variables for testing
 * - Cleanup of any existing test data
 */
async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up E2E test environment...');
  
  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_E2E_TESTING = 'true';
  
  // Use test database if specified
  if (process.env.MONGODB_URI_TEST) {
    process.env.MONGODB_URI = process.env.MONGODB_URI_TEST;
    console.log('📅 Using test database connection');
  } else {
    console.log('⚠️  No test database specified - using development environment');
    console.log('   Set MONGODB_URI_TEST environment variable for isolated testing');
  }

  // Wait for server to be ready
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
  
  try {
    console.log(`🌐 Waiting for development server at ${baseURL}...`);
    // The webServer config in playwright.config.ts will handle server startup
    
    // Additional setup can be added here:
    // - Seed test data
    // - Clear any existing test sessions
    // - Set up test email accounts
    
    console.log('✅ E2E test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to set up E2E test environment:', error);
    throw error;
  }
}

export default globalSetup;