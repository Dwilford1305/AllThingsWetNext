import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  try {
    // Try to set up real test database first, fall back to mock if unavailable
    let usingMockDatabase = false;
    
    try {
      // Attempt to set up MongoDB Memory Server for real database testing
      // This will fail gracefully in environments where external downloads are blocked
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const testDbUri = mongod.getUri();
      
      // Set environment variable for the test database
      process.env.MONGODB_URI = testDbUri;
      process.env.E2E_MONGOD_INSTANCE = 'true'; // Flag to track cleanup needed
      console.log('✅ Real test database configured with MongoDB Memory Server:', testDbUri);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ Real database setup failed, using mock configuration:', errorMessage);
      
      // Set up mock database configuration
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test_mock'; // Mock URI
      process.env.E2E_MOCK_DATABASE = 'true';
      usingMockDatabase = true;
    }
    
    // Set other required environment variables for testing
    process.env.JWT_SECRET = 'test-jwt-secret-for-e2e-testing-only';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-e2e-testing-only';
    process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-for-e2e-testing-only';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    
    // Optional environment variables (disable to avoid external dependencies)
    process.env.SMTP_HOST = '';
    process.env.SMTP_USER = '';
    process.env.SMTP_PASSWORD = '';
    process.env.ADMIN_EMAIL = 'test@admin.com';
    process.env.SUPER_ADMIN_SETUP_KEY = 'test-admin-setup-key';
    process.env.CRON_SECRET = 'test-cron-secret-for-e2e-testing';
    
    console.log('✅ Global test setup completed');
    if (usingMockDatabase) {
      console.log('📝 Using mock database configuration for testing');
    }
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
}

export default globalSetup;