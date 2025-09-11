import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  // Load test environment variables
  const testEnvPath = path.resolve(process.cwd(), '.env.test');
  dotenv.config({ path: testEnvPath });
  
  console.log('🚀 Starting E2E test suite...');
  
  // Setup required test environment variables with fallbacks
  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = 'test-secret-for-e2e-testing-only-not-for-production';
  }
  
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-for-e2e-testing-only-not-for-production-minimum-32-chars';
  }
  
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-e2e-testing-only-not-for-production';
  }
  
  // Set NODE_ENV to test mode
  process.env.NODE_ENV = 'test';
  
  console.log('✅ Test environment variables configured');

  // Check if dev server is running (skip browser check if browsers not installed)
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto('http://localhost:3000/api/health', { timeout: 30000 });
      console.log('✅ Dev server is responsive');
    } catch (error) {
      console.log('⚠️ Dev server health check failed, but continuing...');
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.log('⚠️ Browsers not installed, skipping browser health check...');
    console.log('✅ Global setup completed without browser validation');
  }
}

export default globalSetup;