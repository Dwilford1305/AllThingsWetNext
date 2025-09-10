# End-to-End Testing Guide - AllThingsWetNext

This guide covers the comprehensive end-to-end (E2E) testing framework implemented for AllThingsWetNext using Playwright.

## Overview

The E2E testing framework covers critical user workflows including:
- User authentication (registration, login, logout, password reset)
- Business management (directory browsing, claiming, registration, subscriptions)
- Content management (news, events, jobs, marketplace)
- Admin dashboard functionality
- Navigation and UI components
- Cross-browser compatibility
- Mobile responsiveness

## Setup and Installation

### Prerequisites
- Node.js 18+ 
- npm 10+
- Playwright browsers (installed automatically)

### Installation
```bash
# Install E2E testing dependencies (already included in package.json)
npm install

# Install Playwright browsers
npx playwright install

# For CI environments, install with system dependencies
npx playwright install --with-deps
```

## Test Structure

### Directory Organization
```
e2e/
├── fixtures/           # Test fixtures and base setup
│   └── base.ts        # Extended Playwright test with custom fixtures
├── tests/             # Test specifications
│   ├── auth.spec.ts   # Authentication workflows
│   ├── business.spec.ts # Business management workflows
│   ├── content.spec.ts # Content management workflows
│   ├── admin.spec.ts  # Admin dashboard workflows
│   └── navigation.spec.ts # Navigation and UI tests
├── utils/             # Test utilities and helpers
│   └── test-helpers.ts # Common test functions and data generators
├── global-setup.ts    # Global test setup
└── global-teardown.ts # Global test cleanup
```

### Configuration Files
- `playwright.config.ts` - Main Playwright configuration
- `.github/workflows/e2e-tests.yml` - CI/CD integration

## Running Tests

### Local Development
```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# Run specific browser tests
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run mobile tests only
npm run test:e2e:mobile

# Run all tests (unit + E2E)
npm run test:all
```

### Specific Test Files
```bash
# Run specific test file
npx playwright test e2e/tests/auth.spec.ts

# Run specific test by name
npx playwright test --grep "should login existing user"

# Run tests matching pattern
npx playwright test --grep "authentication"
```

## Test Database Configuration

### Development Testing
For development testing without a dedicated test database:
- Tests will run against the development environment
- The application gracefully handles missing database connections
- Some tests may be skipped if database functionality is unavailable

### Production Testing Setup
For comprehensive testing with database access:

1. **Set up test database**:
   ```bash
   # Add to .env.local
   MONGODB_URI_TEST=mongodb+srv://username:password@cluster/testdb
   ```

2. **Configure test environment**:
   ```bash
   # Required environment variables for testing
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-test-secret
   JWT_SECRET=your-test-jwt-secret
   JWT_REFRESH_SECRET=your-test-refresh-secret
   ```

3. **Optional email testing**:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=test@example.com
   SMTP_PASSWORD=test-app-password
   ```

## Test Categories

### 1. Authentication Tests (`auth.spec.ts`)
- User registration workflow
- Email verification (when implemented)
- User login and logout
- Password reset functionality
- Invalid credentials handling
- Navigation between auth states

### 2. Business Management Tests (`business.spec.ts`)
- Business directory browsing
- Search and filtering functionality
- Business detail view
- Business claiming workflow
- Business registration
- Subscription upgrade flow
- Business management dashboard

### 3. Content Management Tests (`content.spec.ts`)
- News page display and interaction
- Events listing and filtering
- Jobs browsing and searching
- Marketplace item management
- Content creation (when authenticated)
- Pagination and sorting
- Content detail views

### 4. Admin Dashboard Tests (`admin.spec.ts`)
- Admin access control
- Admin authentication
- User management features
- Business administration
- Content moderation
- System statistics and reporting
- Configuration management

### 5. Navigation and UI Tests (`navigation.spec.ts`)
- Homepage layout and functionality
- Navigation between main sections
- Responsive design testing
- Mobile menu functionality
- Search functionality
- Footer and breadcrumb navigation
- Error page handling
- Loading states
- Accessibility features
- Multi-screen size testing

## Browser and Device Coverage

### Desktop Browsers
- **Chromium** (Chrome/Edge equivalent)
- **Firefox**
- **WebKit** (Safari equivalent)

### Mobile Devices
- **Mobile Chrome** (Pixel 5 simulation)
- **Mobile Safari** (iPhone 12 simulation)

### Screen Sizes Tested
- Mobile: 375x667 (iPhone SE)
- Tablet: 768x1024 (iPad)
- Desktop: 1280x720 (Standard laptop)
- Large Desktop: 1920x1080 (Full HD)

## Fixtures and Test Helpers

### Available Fixtures
- `authHelper` - Authentication workflow helpers
- `navHelper` - Navigation utilities
- `formHelper` - Form interaction helpers
- `waitHelper` - Loading and wait utilities
- `screenshotHelper` - Visual testing utilities
- `testUser` - Generated test user data
- `testBusiness` - Generated test business data
- `authenticatedUser` - Pre-authenticated user for tests

### Test Data Generation
```typescript
// Generate unique test data
const user = TestDataGenerator.generateTestUser('business_owner');
const business = TestDataGenerator.generateTestBusiness();
```

### Common Test Patterns
```typescript
// Authentication flow
await authHelper.register(testUser);
await authHelper.login(testUser);
expect(await authHelper.isLoggedIn()).toBe(true);

// Form submission
await formHelper.fillForm({ name: 'Test', email: 'test@example.com' });
await formHelper.submitForm();

// Navigation and waiting
await navHelper.goToBusinesses();
await waitHelper.waitForPageLoad();

// Visual testing
await screenshotHelper.takeFullPageScreenshot('page-name');
```

## CI/CD Integration

### GitHub Actions Workflow
The E2E tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

### Test Execution Strategy
- **Parallel Execution**: Tests run across multiple browsers simultaneously
- **Fail-Fast Disabled**: All browser tests complete even if one fails
- **Retry Logic**: Tests retry 2 times on CI for flaky test handling
- **Timeout**: 20-minute maximum execution time

### Artifacts and Reporting
- HTML test reports
- JSON and JUnit results for integration
- Screenshots on test failures
- Video recordings for debugging
- 30-day retention for test artifacts

## Performance Targets

### Execution Time Goals
- **Total E2E Suite**: < 10 minutes
- **Individual Test**: < 30 seconds
- **Test Setup**: < 2 minutes
- **Browser Launch**: < 30 seconds

### Current Metrics
- **Test Pass Rate Target**: 100%
- **Coverage**: 80%+ of critical user workflows
- **Browser Compatibility**: Chrome, Firefox, Safari
- **Mobile Coverage**: iOS and Android simulation

## Maintenance and Best Practices

### Test Stability
- Use reliable selectors (data-testid preferred)
- Implement proper wait strategies
- Handle async operations correctly
- Use page.waitForLoadState('networkidle') for SPA navigation

### Test Data Management
- Generate unique test data to avoid conflicts
- Clean up test data in teardown when possible
- Use test-specific email addresses and business names
- Avoid hard-coded test data that could conflict

### Visual Regression Testing
- Take screenshots at key points for comparison
- Use consistent viewport sizes
- Test across different screen resolutions
- Compare critical UI components

### Debugging Failed Tests
```bash
# Run single test in debug mode
npx playwright test auth.spec.ts --debug

# Run with headed browser to see what's happening
npx playwright test --headed

# Generate and view test report
npx playwright show-report
```

## Troubleshooting

### Common Issues

1. **Browser Installation Failures**:
   ```bash
   # Reinstall browsers
   npx playwright install --force
   ```

2. **Test Timeouts**:
   - Increase timeout in playwright.config.ts
   - Check for slow loading pages
   - Verify database connectivity

3. **Flaky Tests**:
   - Add proper wait conditions
   - Use waitForLoadState instead of fixed timeouts
   - Check for race conditions

4. **CI/CD Failures**:
   - Verify environment variables are set
   - Check browser installation in CI
   - Review GitHub Actions logs

### Environment-Specific Considerations

#### Development Environment
- Tests run against local dev server
- Database may not be available (graceful degradation)
- Some admin tests may be skipped without proper credentials

#### CI/CD Environment
- Uses test environment variables
- All browsers installed with system dependencies
- Artifacts uploaded for debugging

#### Production Testing
- Requires dedicated test database
- Full admin credentials needed for complete coverage
- Email testing requires SMTP configuration

## Future Enhancements

### Planned Improvements
1. **Visual Regression Testing**: Automated screenshot comparison
2. **Performance Testing**: Integration with Lighthouse
3. **Accessibility Testing**: WCAG compliance automation
4. **API Contract Testing**: Backend API validation
5. **Security Testing**: Authentication bypass detection

### Integration Opportunities
- **Test Database Seeding**: Automated test data setup
- **Email Testing**: Integration with email testing services
- **Payment Testing**: PayPal sandbox automation
- **Real Device Testing**: BrowserStack integration

## Documentation Updates

This E2E testing framework addresses the critical gap identified in the Test Coverage Report. It provides:

- ✅ **E2E testing framework configured and operational**
- ✅ **All critical user workflows covered by E2E tests**
- ✅ **Tests run across multiple browsers (Chrome, Firefox, Safari)**
- ✅ **Mobile E2E tests implemented**
- ✅ **Basic visual regression testing for UI changes**
- ✅ **E2E tests integrated into CI/CD pipeline**
- ✅ **E2E test execution time < 10 minutes target**
- ✅ **E2E test documentation and maintenance guide**

The framework is ready for immediate use and can be expanded as the application evolves.