# End-to-End Testing Guide

## Overview

This guide covers the comprehensive end-to-end (E2E) testing automation system implemented for the All Things Wetaskiwin platform. The E2E testing framework uses Playwright to test critical user workflows across multiple browsers and devices.

## 📋 Test Coverage

### Critical User Workflows Tested

1. **Homepage and Navigation** - Basic site functionality and navigation
2. **User Authentication** - Login, registration, profile management
3. **Business Workflows** - Business registration, claiming, management
4. **Content Creation** - Marketplace listings, events, news interaction
5. **Admin Dashboard** - Administrative functions and moderation
6. **Payment & Subscriptions** - PayPal integration and subscription flows
7. **Visual Regression** - UI consistency and appearance
8. **Cross-Browser & Mobile** - Compatibility across devices and browsers

## 🛠️ Framework Setup

### Prerequisites

- Node.js 18+ (tested with 20.19.4)
- npm 10+
- Playwright browsers (automatically installed)

### Installation

The E2E testing framework is already configured. To set it up:

```bash
# Install all dependencies (including Playwright)
npm install

# Install Playwright browsers
npx playwright install

# Install specific browsers only
npx playwright install chromium firefox webkit
```

## 🚀 Running Tests

### Available Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with browser UI visible
npm run test:e2e:headed

# Run tests with interactive UI
npm run test:e2e:ui

# Debug tests step by step
npm run test:e2e:debug

# View HTML test report
npm run test:e2e:report

# Run tests on specific browsers
npm run test:e2e:chrome    # Chromium only
npm run test:e2e:firefox   # Firefox only
npm run test:e2e:safari    # WebKit (Safari) only

# Run mobile tests only
npm run test:e2e:mobile

# Run all tests (unit + E2E)
npm run test:all
```

### Running Individual Test Suites

```bash
# Run specific test file
npx playwright test tests/e2e/01-homepage-navigation.spec.ts

# Run specific test suite with pattern
npx playwright test --grep "authentication"

# Run tests for specific browser
npx playwright test --project=chromium
```

## 📂 Project Structure

```
tests/e2e/
├── fixtures/
│   └── test-fixtures.ts          # Shared test utilities and data
├── helpers/
│   └── database-helper.ts        # Database test helpers
├── screenshots/                  # Test screenshots (auto-generated)
│   ├── baseline/                # Visual regression baselines
│   ├── current/                 # Current test run screenshots
│   └── diffs/                   # Visual difference images
├── 01-homepage-navigation.spec.ts     # Homepage and basic navigation
├── 02-user-authentication.spec.ts    # Authentication flows
├── 03-business-workflows.spec.ts     # Business management
├── 04-content-creation.spec.ts       # Content creation and interaction
├── 05-admin-dashboard.spec.ts        # Admin functionality
├── 06-payment-subscription.spec.ts   # Payment and subscription flows
├── 07-visual-regression.spec.ts      # Visual consistency testing
└── 08-cross-browser-mobile.spec.ts   # Cross-browser and mobile testing
```

## 🎯 Test Configurations

### Browser Matrix

- **Chromium** - Chrome-based browsers
- **Firefox** - Mozilla Firefox
- **WebKit** - Safari and Safari-based browsers

### Device Matrix

- **Desktop** - 1920x1080 standard desktop
- **Tablet** - iPad, iPad Air, iPad Pro viewports
- **Mobile** - iPhone SE, iPhone 12, Pixel 5, Galaxy S20

### Test Environments

- **Development** - `http://localhost:3000`
- **Staging** - Configurable via `BASE_URL` env var
- **Production** - CI/CD environment testing

## 🔧 Configuration Files

### playwright.config.ts

Main Playwright configuration:

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 📊 Test Data Management

### Test Fixtures

Located in `tests/e2e/fixtures/test-fixtures.ts`:

```typescript
export const TEST_USERS = {
  admin: { email: 'admin@e2e-test.com', password: 'TestPass123!', role: 'super_admin' },
  user: { email: 'user@e2e-test.com', password: 'TestPass123!', role: 'user' },
  businessOwner: { email: 'business@e2e-test.com', password: 'TestPass123!', role: 'business_owner' },
};

export const TEST_BUSINESS = {
  name: 'E2E Test Restaurant',
  address: '123 Test Avenue, Wetaskiwin, AB T9A 0A1',
  phone: '780-555-0123',
  email: 'info@e2etest.ca',
  // ... more test data
};
```

### Database Helpers

Database testing utilities in `tests/e2e/helpers/database-helper.ts`:

- `connectToTestDatabase()` - MongoDB Memory Server setup
- `clearTestDatabase()` - Clean test data
- `seedTestData()` - Create test fixtures
- `createTestUser()` - User creation helpers
- `disconnectFromTestDatabase()` - Cleanup

## 🖼️ Visual Regression Testing

### Baseline Screenshots

Visual regression testing captures baseline screenshots for:

- All major pages (homepage, businesses, marketplace, etc.)
- Key components (navigation, footer, forms)
- Mobile and tablet viewports
- Different browser renderings

### Managing Visual Tests

```bash
# Update baseline screenshots
npx playwright test --update-snapshots

# Run only visual tests
npx playwright test tests/e2e/07-visual-regression.spec.ts

# Compare visual differences
npm run test:e2e:report
```

### Visual Test Configuration

```typescript
await expect(page).toHaveScreenshot('homepage-baseline.png', {
  fullPage: true,
  animations: 'disabled',
  threshold: 0.2, // Allow 20% pixel difference
});
```

## 📱 Mobile and Responsive Testing

### Mobile Viewports Tested

1. **iPhone SE** - 375x667px
2. **iPhone 12** - 390x844px  
3. **Pixel 5** - 412x915px
4. **Galaxy S20** - 360x800px

### Tablet Viewports Tested

1. **iPad** - 768x1024px
2. **iPad Air** - 820x1180px
3. **iPad Pro** - 1024x1366px

### Touch and Gesture Testing

- Touch tap interactions
- Swipe gestures for carousels
- Pinch zoom functionality
- Scroll behavior validation

## 🔐 Security and Authentication Testing

### Security Validations

- HTTPS enforcement for payment pages
- Secure cookie attributes validation
- No sensitive data exposure in frontend
- PCI compliance checks for payment forms
- CSRF protection validation

### Authentication Flows

- User registration with email verification
- Login/logout functionality
- Password reset workflows
- Session management
- Role-based access control (admin, business_owner, user)

## ⚡ Performance Testing

### Metrics Monitored

- Page load times across different network conditions
- JavaScript execution time
- First Contentful Paint (FCP)
- Time to Interactive (TTI)
- Core Web Vitals compliance

### Network Conditions Tested

- Fast 3G simulation
- Slow 3G simulation
- Offline scenarios
- Intermittent connectivity

## 🤖 CI/CD Integration

### GitHub Actions Workflow

Located in `.github/workflows/e2e-tests.yml`:

- **Triggers**: Push to main/develop, PR creation, scheduled daily runs
- **Matrix Testing**: All browsers and mobile configurations
- **Artifact Upload**: Screenshots, reports, test results
- **PR Comments**: Automated test result summaries

### Workflow Jobs

1. **e2e-tests** - Main browser testing matrix
2. **mobile-e2e-tests** - Mobile-specific testing
3. **visual-regression-tests** - Screenshot comparison
4. **performance-tests** - Performance benchmarking
5. **test-summary** - Results aggregation and reporting

## 🚨 Troubleshooting

### Common Issues

#### Browser Installation
```bash
# If browsers fail to install
npx playwright install --force

# Install system dependencies
npx playwright install-deps
```

#### Test Failures
```bash
# Run with debug info
DEBUG=pw:api npx playwright test

# Run single test with verbose output
npx playwright test tests/e2e/01-homepage-navigation.spec.ts --reporter=line
```

#### Screenshot Differences
```bash
# Update all screenshots
npx playwright test --update-snapshots

# Update specific test screenshots
npx playwright test tests/e2e/07-visual-regression.spec.ts --update-snapshots
```

### Debugging Tips

1. **Use headed mode** for visual debugging: `npm run test:e2e:headed`
2. **Enable trace viewer** for detailed execution traces
3. **Check screenshots** in `tests/e2e/screenshots/` for visual issues
4. **Review HTML reports** with `npm run test:e2e:report`
5. **Use browser dev tools** with `--debug` flag

## 📈 Test Execution Times

### Performance Targets

- **Individual test suite**: < 2 minutes
- **Full E2E test run**: < 10 minutes
- **Visual regression tests**: < 5 minutes
- **Mobile tests**: < 3 minutes

### Optimization Strategies

- Parallel test execution
- Browser reuse where possible
- Selective test runs based on changes
- Optimized wait strategies
- Efficient screenshot comparisons

## 📝 Test Maintenance

### Regular Maintenance Tasks

1. **Update test data** when application features change
2. **Refresh baseline screenshots** after UI updates
3. **Review and update selectors** if DOM structure changes
4. **Monitor test execution times** and optimize slow tests
5. **Update browser versions** regularly

### Best Practices

1. **Use stable selectors** - data-testid attributes preferred
2. **Implement proper waits** - avoid arbitrary timeouts
3. **Keep tests independent** - each test should be self-contained
4. **Use page object patterns** for complex interactions
5. **Regular cleanup** of test artifacts and screenshots

## 🎯 Success Criteria

The E2E testing system successfully validates:

✅ **Critical user workflows** function correctly end-to-end  
✅ **Cross-browser compatibility** across Chrome, Firefox, Safari  
✅ **Mobile responsiveness** on phone and tablet viewports  
✅ **Visual consistency** with automated regression detection  
✅ **Authentication security** and authorization flows  
✅ **Payment processing** integration and security  
✅ **Admin functionality** and content moderation  
✅ **Performance standards** across different network conditions  
✅ **Accessibility compliance** with keyboard navigation  
✅ **Error handling** and graceful degradation  

## 🔗 Related Documentation

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Overall testing strategy
- [TEST_COVERAGE_REPORT.md](./TEST_COVERAGE_REPORT.md) - Current test coverage
- [DEVELOPMENT_STATE.md](./DEVELOPMENT_STATE.md) - Development priorities
- [USER_JOURNEYS_ANALYSIS.md](./USER_JOURNEYS_ANALYSIS.md) - User workflow documentation

---

*Last Updated: Current*  
*Framework Version: Playwright v1.44+*  
*Node Version: 20.19.4+*