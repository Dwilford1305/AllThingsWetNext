# End-to-End Testing Guide

## Overview
This guide provides comprehensive instructions for running, maintaining, and extending the end-to-end (E2E) test suite for AllThingsWetNext using Playwright.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm installed
- Repository dependencies installed (`npm install`)

### Installing Playwright Browsers
```bash
# Install all browsers (recommended)
npm run test:e2e:setup

# Quick browser-only install
npm run test:e2e:install

# Install system dependencies
npm run test:e2e:install-deps

# Or install specific browsers manually
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

⚠️ **Important**: Visual regression tests will automatically skip if browsers aren't installed, providing helpful guidance messages. The test suite can run framework validation and API tests without browser installation.

### Running E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run tests with browser visible (headed mode)
npm run test:e2e:headed

# Debug tests interactively
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run both unit and E2E tests
npm run test:all
```

## 📁 Test Structure

### Directory Layout
```
e2e/
├── auth/                           # Authentication workflow tests
│   └── authentication.spec.ts
├── business/                       # Business management tests
│   └── business-workflows.spec.ts
├── content/                        # Content management tests
│   └── content-workflows.spec.ts
├── admin/                          # Admin dashboard tests
│   └── admin-workflows.spec.ts
├── payment/                        # Payment & subscription tests
│   └── payment-workflows.spec.ts
├── utils/                          # Test utilities and helpers
│   └── test-helpers.ts
├── basic-navigation.spec.ts        # Basic navigation tests
├── mobile-responsive.spec.ts       # Mobile & responsive tests
├── visual-regression.spec.ts       # Visual regression tests
├── global-setup.ts                 # Global test setup
└── global-teardown.ts              # Global test cleanup
```

## 🧪 Test Categories

### 1. Basic Navigation Tests
**File**: `basic-navigation.spec.ts`

Tests core navigation functionality:
- Homepage loading
- Main page navigation
- Navigation menu functionality
- 404 page handling

### 2. Authentication Workflows
**File**: `auth/authentication.spec.ts`

Tests authentication features:
- Auth page accessibility
- Login/registration form interactions
- Password reset workflows
- Logout functionality
- Authentication API endpoints

### 3. Business Management Workflows
**File**: `business/business-workflows.spec.ts`

Tests business-related features:
- Business directory display
- Business search functionality
- Business registration forms
- Business claiming workflows
- Photo upload interfaces
- Category filtering

### 4. Content Management Workflows
**File**: `content/content-workflows.spec.ts`

Tests content features across:
- **Events**: Event listings, search, API endpoints
- **News**: News articles, display, API endpoints
- **Jobs**: Job listings, search functionality
- **Marketplace**: Listings, creation, categories

### 5. Admin Dashboard Workflows
**File**: `admin/admin-workflows.spec.ts`

Tests admin functionality:
- Admin page access and authentication
- Business management interface
- User management interface
- Statistics and reporting
- Scraper management
- Email system management

### 6. Payment & Subscription Workflows
**File**: `payment/payment-workflows.spec.ts`

Tests payment features:
- PayPal API endpoints
- Subscription interfaces
- Upgrade demo page
- Offer code validation
- Invoice generation
- Payment analytics

### 7. Mobile Responsive Testing
**File**: `mobile-responsive.spec.ts`

Tests mobile experience:
- Mobile navigation
- Tablet responsive design
- Touch interactions
- Mobile form interactions
- Content layout on mobile
- Performance on mobile connections
- Mobile accessibility

### 8. Visual Regression Testing
**File**: `visual-regression.spec.ts`

Tests visual consistency:
- Homepage screenshots
- Page layout screenshots
- Cross-browser visual testing
- Different viewport screenshots
- Form element consistency
- Loading state captures
- Error state screenshots

## 🔧 Configuration

### Playwright Configuration (`playwright.config.ts`)

Key configuration features:
- **Multi-browser testing**: Chrome, Firefox, Safari, Edge
- **Mobile testing**: iPhone and Android device simulation
- **Parallel execution**: Tests run in parallel for speed
- **Automatic retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Video recording**: On failure
- **Trace collection**: On retry for debugging

### Browser Projects
- `chromium`: Desktop Chrome
- `firefox`: Desktop Firefox  
- `webkit`: Desktop Safari
- `Mobile Chrome`: Pixel 5 simulation
- `Mobile Safari`: iPhone 12 simulation
- `Microsoft Edge`: Desktop Edge
- `Google Chrome`: Desktop Chrome

### Test Environment
- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Dev Server**: Automatically started before tests
- **Timeout**: 5 minutes per test, 10 minutes global
- **Environment Variables**: Test-specific auth secrets

## 🛠️ Test Utilities

### Helper Functions (`utils/test-helpers.ts`)

The test utilities provide reusable functions for common operations:

#### Navigation Helpers
```typescript
const helpers = createHelpers(page);
await helpers.nav.goHome();
await helpers.nav.goToBusinesses();
await helpers.nav.goToEvents();
```

#### Page Validators
```typescript
await helpers.validate.validateHomePage();
await helpers.validate.validateBusinessesPage();
await helpers.validate.validateAuthPage();
```

#### Form Helpers
```typescript
await helpers.forms.fillForm({
  email: 'test@example.com',
  password: 'password123'
});
await helpers.forms.submitForm('Login');
```

#### Wait Helpers
```typescript
await helpers.wait.waitForLoadingComplete();
await helpers.wait.waitForApiResponse('/api/businesses');
```

#### Authentication Helpers
```typescript
const isLoggedIn = await helpers.auth.isLoggedIn();
await helpers.auth.logout();
```

#### Error Helpers
```typescript
await helpers.errors.checkForErrors();
await helpers.errors.waitForNoErrors();
```

### Test Data Generators
```typescript
const email = generateTestEmail();        // test.1234567890@example.com
const username = generateTestUsername();  // testuser_1234567890
const business = generateTestBusinessName(); // Test Business 1234567890
```

## 📋 Running Specific Tests

### Single Test File
```bash
# Run specific test file
npx playwright test basic-navigation.spec.ts

# Run specific test suite
npx playwright test auth/

# Run by test name pattern
npx playwright test --grep "should load homepage"
```

### Browser-Specific Testing
```bash
# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run mobile tests only
npx playwright test --project="Mobile Chrome"
```

### Debug Mode
```bash
# Debug specific test
npx playwright test --debug basic-navigation.spec.ts

# Debug with headed browser
npx playwright test --headed --timeout=0 auth/authentication.spec.ts
```

## 🎯 Test Development Guidelines

### Writing New E2E Tests

#### 1. Use Descriptive Test Names
```typescript
test('should display business directory with search functionality', async ({ page }) => {
  // Test implementation
});
```

#### 2. Use Helper Functions
```typescript
test('should navigate to events page', async ({ page }) => {
  const helpers = createHelpers(page);
  await helpers.nav.goToEvents();
  await helpers.validate.validateEventsPage();
});
```

#### 3. Handle Async Operations
```typescript
test('should wait for API responses', async ({ page }) => {
  const helpers = createHelpers(page);
  await helpers.nav.goToBusinesses();
  await helpers.wait.waitForApiResponse('/api/businesses');
});
```

#### 4. Test Both Success and Error States
```typescript
test('should handle search with results', async ({ page }) => {
  // Test successful search
});

test('should handle search with no results', async ({ page }) => {
  // Test empty state
});
```

#### 5. Use Proper Assertions
```typescript
// Good
await expect(page.locator('h1')).toBeVisible();
await expect(page).toHaveTitle(/Expected Title/);

// Avoid
expect(await page.locator('h1').isVisible()).toBeTruthy();
```

### Best Practices

#### 1. Test Independence
- Each test should be independent
- Don't rely on test execution order
- Clean up after tests if needed

#### 2. Wait Strategies
```typescript
// Wait for element to be visible
await page.waitForSelector('.loading', { state: 'hidden' });

// Wait for network response
await page.waitForResponse(response => response.url().includes('/api/'));

// Wait for page load
await page.waitForLoadState('networkidle');
```

#### 3. Error Handling
```typescript
test('should handle network errors gracefully', async ({ page }) => {
  // Simulate network failure
  await page.route('**/api/**', route => route.abort());
  
  await page.goto('/businesses');
  await helpers.errors.checkForErrors();
});
```

#### 4. Mobile Testing
```typescript
test('should work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // Test mobile-specific functionality
});
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The E2E tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

### Workflow Features
- **Basic E2E Tests**: Run on every PR/push (15 minute timeout)
- **Cross-Browser Tests**: Run on main branch only (20 minute timeout)
- **Artifact Upload**: Test reports and screenshots preserved
- **Parallel Execution**: Tests run efficiently
- **Browser Matrix**: Tests across Chrome, Firefox, Safari

### Environment Variables in CI
```yaml
env:
  NEXTAUTH_URL: http://localhost:3000
  NEXTAUTH_SECRET: test-secret-for-ci
  JWT_SECRET: test-jwt-secret-for-ci
  JWT_REFRESH_SECRET: test-jwt-refresh-secret-for-ci
```

## 📊 Test Reports and Debugging

### HTML Report
```bash
# Generate and view HTML report
npm run test:e2e:report
```

The HTML report includes:
- Test results with pass/fail status
- Screenshots of failures
- Test execution timeline
- Browser information
- Error details and stack traces

### Screenshots and Videos
- Screenshots taken on test failure
- Videos recorded for failed tests
- Stored in `test-results/` directory
- Uploaded as CI artifacts

### Debugging Failed Tests
1. **Check HTML report** for error details
2. **View screenshots** to see UI state at failure
3. **Run with `--headed`** to see browser in action
4. **Use `--debug`** for step-by-step debugging
5. **Check network tab** for API failures

## 🚦 Performance Guidelines

### Test Execution Time Goals
- **Single test**: < 30 seconds
- **Full suite**: < 10 minutes
- **CI execution**: < 15 minutes

### Optimization Strategies
1. **Parallel execution**: Tests run in parallel by default
2. **Selective browser testing**: Mobile tests only on key workflows
3. **Smart waiting**: Use specific waits instead of arbitrary delays
4. **Minimal setup**: Global setup handles common initialization
5. **Efficient selectors**: Use data-testid attributes when possible

## 🔧 Troubleshooting

### Common Issues

#### 1. Tests Timing Out
```bash
# Increase timeout for specific test
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // Test implementation
});
```

#### 2. Element Not Found
```typescript
// Use multiple selectors as fallback
const button = page.locator('button:has-text("Submit"), input[type="submit"]');
```

#### 3. Network Issues
```typescript
// Wait for network to be idle
await page.goto('/', { waitUntil: 'networkidle' });
```

#### 4. Browser Installation Issues
```bash
# Reinstall browsers
npx playwright install --force
```

### Environment Setup
- Ensure Node.js 18+ is installed
- Verify npm dependencies are installed
- Check that dev server can start successfully
- Ensure required environment variables are set

## 📈 Maintenance

### Regular Maintenance Tasks
1. **Update screenshots**: When UI changes, update visual regression baselines
2. **Review failing tests**: Address flaky tests promptly
3. **Update selectors**: Maintain selectors when UI structure changes
4. **Performance monitoring**: Monitor test execution times
5. **Browser updates**: Keep Playwright browsers updated

### Updating Visual Baselines
```bash
# Update all screenshots
npx playwright test visual-regression.spec.ts --update-snapshots

# Update specific screenshot
npx playwright test --update-snapshots --grep "homepage screenshot"
```

## 🆘 Getting Help

### Resources
- **Playwright Documentation**: https://playwright.dev/docs/intro
- **Project Testing Guide**: `TESTING_GUIDE.md`
- **Feature Documentation**: `FEATURE_MATRIX.md`

### Common Commands Reference
```bash
# Development
npm run dev                    # Start dev server
npm run test:e2e              # Run E2E tests
npm run test:e2e:headed       # Run with visible browser
npm run test:e2e:debug        # Interactive debugging

# CI/Production
npm run build                 # Build application
npm run test:all              # Run all tests
npm run test:e2e:report       # View test report

# Maintenance
npx playwright install        # Install browsers
npx playwright --version      # Check version
npx playwright codegen        # Generate test code
```

---

*Last Updated: Current*  
*Framework: Playwright*  
*Test Coverage: 8 test suites covering critical user workflows*