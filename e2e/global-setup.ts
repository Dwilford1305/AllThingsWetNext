import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Start dev server is handled by webServer config
  // This is for any additional global setup needed
  console.log('🚀 Starting E2E test suite...');
  
  // Setup test environment variables if needed
  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = 'test-secret-for-e2e-only';
  }

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