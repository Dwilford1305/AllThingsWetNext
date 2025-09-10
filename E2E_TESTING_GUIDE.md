# End-to-End Testing Guide

This document provides comprehensive information about the end-to-end (E2E) testing framework for AllThingsWetNext.

## Overview

The E2E testing suite uses Playwright to test critical user workflows across multiple browsers and devices. The tests ensure that the application functions correctly from the user's perspective.

## Setup and Installation

### Prerequisites
- Node.js 18+ (tested with 20.19.4)
- npm 10+ (tested with 10.8.2)
- Project dependencies installed (`npm install`)

### Installing Playwright Browsers
```bash
npx playwright install
```

## Test Structure

The E2E tests are organized into the following categories:

### Core Test Files
- `e2e/smoke.spec.ts` - Basic application health checks
- `e2e/auth.spec.ts` - Authentication and user management workflows
- `e2e/business.spec.ts` - Business directory and management workflows
- `e2e/content.spec.ts` - Content management (events, news, jobs, marketplace)
- `e2e/admin.spec.ts` - Admin dashboard workflows
- `e2e/payment.spec.ts` - Payment and subscription workflows
- `e2e/visual.spec.ts` - Visual regression testing
- `e2e/mobile.spec.ts` - Mobile-specific testing

## Running Tests

### All E2E Tests
```bash
npm run test:e2e
```

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Specific Test Categories
```bash
# Mobile tests only
npm run test:e2e:mobile

# Visual regression tests only
npm run test:e2e:visual

# Specific test file
npx playwright test e2e/auth.spec.ts
```

### All Tests (Unit + E2E)
```bash
npm run test:all
```

## Browser Coverage

The tests run across multiple browsers and devices:

### Desktop Browsers
- **Chromium** (Chrome/Edge)
- **Firefox**
- **WebKit** (Safari)

### Mobile Devices
- **Mobile Chrome** (Pixel 5)
- **Mobile Safari** (iPhone 12)

## Test Categories

### 1. Smoke Tests (`smoke.spec.ts`)
- Homepage loads successfully
- Navigation menu functionality
- API health checks
- Basic application structure

### 2. Authentication Tests (`auth.spec.ts`)
- Auth test page accessibility
- User registration form availability
- Login flow navigation
- Protected routes behavior
- Authentication state persistence

### 3. Business Workflow Tests (`business.spec.ts`)
- Business directory page functionality
- Search and filtering capabilities
- Business detail views
- Claim/request processes
- Management dashboard access
- Subscription upgrade flows
- Pagination functionality

### 4. Content Management Tests (`content.spec.ts`)
- **Events**: Page loading, filtering, search
- **News**: Article display and navigation
- **Jobs**: Listings, search, filtering
- **Marketplace**: Item display, categories, detail views
- **Content Creation**: Form access and submission flows

### 5. Admin Dashboard Tests (`admin.spec.ts`)
- Admin access authentication
- Dashboard navigation
- User management interface
- Business management interface
- Content moderation
- Analytics and reports
- Settings and configuration
- System health monitoring

### 6. Payment and Subscription Tests (`payment.spec.ts`)
- Subscription option display
- Tier selection interface
- Payment form accessibility
- Upgrade flow navigation
- Marketplace subscriptions
- Payment processing workflow
- Subscription management
- Payment history and invoicing
- Cancellation flows

### 7. Visual Regression Tests (`visual.spec.ts`)
- Homepage visual consistency
- Navigation menu layout
- Page-specific layouts
- Responsive design (tablet/mobile)
- Dark mode compatibility
- Form elements consistency
- Error page layout
- Loading states
- Interactive element states

### 8. Mobile-Specific Tests (`mobile.spec.ts`)
- Mobile navigation and layout
- Touch interactions
- Form interactions with virtual keyboard
- Swipe gestures
- Admin dashboard responsiveness
- Payment flow accessibility
- Page load performance
- Orientation changes
- Touch-friendly element sizing

## Configuration

### Playwright Configuration (`playwright.config.ts`)
- **Test Directory**: `./e2e`
- **Base URL**: `http://localhost:3000`
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Reporter**: HTML reporter
- **Screenshots**: On failure only
- **Video**: Retained on failure
- **Trace**: On first retry

### Development Server
The tests automatically start the development server before running:
```bash
npm run dev
```

## Test Execution Time

Current execution times by category:
- **Smoke Tests**: ~30 seconds
- **Authentication Tests**: ~1 minute
- **Business Tests**: ~2 minutes
- **Content Tests**: ~2 minutes
- **Admin Tests**: ~1.5 minutes
- **Payment Tests**: ~2 minutes
- **Visual Tests**: ~3 minutes
- **Mobile Tests**: ~2 minutes

**Total Expected Time**: ~10 minutes (meets requirement of < 10 minutes)

## CI/CD Integration

### GitHub Actions Integration
Add the following to your GitHub Actions workflow:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

### Environment Variables for CI
```bash
CI=true                    # Enables CI-specific settings
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1  # Skip browser download if cached
```

## Visual Regression Testing

### Generating Baseline Screenshots
First run generates baseline screenshots:
```bash
npm run test:e2e:visual
```

### Updating Screenshots
To update baseline screenshots after intentional UI changes:
```bash
npx playwright test e2e/visual.spec.ts --update-snapshots
```

### Screenshot Comparison
- **Threshold**: 0.2 (20% difference tolerance)
- **Animations**: Disabled for consistency
- **Full Page**: Captured for layout tests
- **Cross-Platform**: Screenshots are platform-specific

## Performance Testing

### Mobile Performance Standards
- Page load time: < 5 seconds
- Touch target size: ≥ 32x32 pixels (iOS guideline)
- Viewport adaptation: Automatic

### Network Conditions
Tests run under default network conditions. For specific network testing:
```bash
npx playwright test --project="Mobile Chrome" --global-timeout=60000
```

## Debugging

### Debug Mode
```bash
npm run test:e2e:debug
```

### Viewing Test Reports
```bash
npm run test:e2e:report
```

### Trace Viewer
For failed tests with traces:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Screenshots and Videos
Failed test artifacts are saved to:
- `test-results/` - Screenshots and videos
- `playwright-report/` - HTML report

## Maintenance

### Regular Maintenance Tasks
1. **Update Browser Versions**: `npx playwright install`
2. **Review Failed Tests**: Check for application changes affecting tests
3. **Update Baseline Screenshots**: After UI changes
4. **Performance Monitoring**: Ensure load times stay under thresholds
5. **Test Coverage Review**: Add tests for new features

### Common Issues and Solutions

#### Browser Installation Issues
```bash
# Clear Playwright cache and reinstall
npx playwright install --force
```

#### Flaky Tests
- Add appropriate wait conditions
- Use `page.waitForLoadState('networkidle')`
- Increase timeout for specific actions

#### Screenshot Differences
- Check for font rendering differences
- Verify animation states
- Consider platform-specific baselines

### Test Data Management
- Tests use the development environment
- No real payments are processed
- User data is ephemeral (development database)

## Contributing

### Adding New Tests
1. Create test file in `e2e/` directory
2. Follow existing naming convention: `*.spec.ts`
3. Use descriptive test names and organize with `test.describe()`
4. Include appropriate assertions
5. Consider cross-browser compatibility
6. Add to CI workflow if needed

### Test Guidelines
- **Isolation**: Tests should not depend on each other
- **Idempotency**: Tests should produce same results on multiple runs
- **Realistic**: Tests should simulate real user behavior
- **Maintainable**: Use page object patterns for complex flows
- **Fast**: Optimize for speed without sacrificing reliability

## Troubleshooting

### Common Error Messages
- **"Browser not found"**: Run `npx playwright install`
- **"Test timeout"**: Increase timeout or check network conditions
- **"Screenshot mismatch"**: Review UI changes or update baselines
- **"Port already in use"**: Ensure development server isn't already running

### Getting Help
- Review Playwright documentation: https://playwright.dev/
- Check test reports for detailed failure information
- Use debug mode for step-by-step test execution
- Review trace files for failed tests

---

**Last Updated**: Current  
**Test Coverage**: 8 test suites, ~50 test cases  
**Execution Time**: ~10 minutes (all browsers)  
**Maintenance Schedule**: Weekly review, monthly browser updates