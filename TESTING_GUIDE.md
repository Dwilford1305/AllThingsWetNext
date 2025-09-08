# Testing Guide - AllThingsWetNext

## Overview
This guide provides comprehensive instructions for running, maintaining, and extending the test suite for AllThingsWetNext. It covers all types of testing from unit tests to integration tests and provides guidelines for adding new tests.

## 🚀 Quick Start

### Running All Tests
```bash
# Install dependencies (if not already done)
npm install

# Run the complete test suite
npm run test

# Run tests with verbose output
npm run test -- --verbose

# Run tests in watch mode during development
npm run test -- --watch
```

### Expected Output
```
Test Suites: 15 total
Tests:       147 total  
Time:        ~5-6 seconds
Status:      138 passing, 9 failing (in progress)
```

## 📁 Test Suite Structure

### Current Test Files
```
tests/
├── api-endpoints.test.ts           # API endpoint structure validation
├── business-ad-management.test.ts  # Business advertising features
├── business-duplicate-detection.test.ts # Duplicate detection logic
├── business-parsing-issues.test.ts # Business name/contact parsing
├── business-parsing.test.ts        # Core business parsing logic
├── business-scraper-integration.test.ts # Scraper integration tests
├── business-upload.test.ts         # Business data upload features
├── database-integration.test.ts    # Database model validation (new)
├── paypal-integration.test.ts      # PayPal payment integration
├── scheduling.test.ts              # Scheduling utilities
├── screenshot-scenarios.test.ts    # Screenshot parsing scenarios
├── subscription-transform.test.ts  # Subscription data transformation
├── super-admin-photo-upload.test.ts # Super admin photo features
├── super-admin-test-business.test.ts # Super admin test business
└── system-integration.test.ts      # System integration tests (new)
```

## 🧪 Test Categories

### Unit Tests
**Purpose**: Test individual functions and components in isolation

**Examples**:
- `business-parsing.test.ts` - Tests business name parsing logic
- `scheduling.test.ts` - Tests scheduling utility functions
- `subscription-transform.test.ts` - Tests subscription data transformation

**Best Practices**:
- Mock external dependencies
- Test edge cases and error conditions
- Keep tests focused and isolated
- Use descriptive test names

### Integration Tests
**Purpose**: Test how multiple components work together

**Examples**:
- `business-scraper-integration.test.ts` - Tests scraper with parsing logic
- `database-integration.test.ts` - Tests database models and relationships
- `system-integration.test.ts` - Tests core system components

**Best Practices**:
- Test realistic scenarios
- Validate data flow between components
- Test error propagation
- Use minimal mocking

### API Endpoint Tests
**Purpose**: Validate API structure and functionality

**Example**: `api-endpoints.test.ts`
- Validates API route file existence
- Checks proper HTTP method exports
- Verifies TypeScript typing
- Tests error handling structure

### Business Logic Tests
**Purpose**: Test core business rules and workflows

**Examples**:
- Business duplicate detection algorithms
- Subscription tier validation
- Payment processing logic
- Content parsing and validation

## 🔧 Jest Configuration

### Configuration File: `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
```

### Key Features
- **TypeScript Support**: Full TypeScript testing with ts-jest
- **Path Aliases**: Uses `@/` for src directory imports
- **Node Environment**: Tests run in Node.js environment
- **Fast Execution**: Optimized for quick test runs

## 📋 Running Specific Tests

### Single Test File
```bash
# Run specific test file
npm run test business-parsing.test.ts

# Run with pattern matching
npm run test -- --testNamePattern="business parsing"
```

### Test Categories
```bash
# Run all business-related tests
npm run test -- --testPathPattern="business"

# Run integration tests only
npm run test -- --testPathPattern="integration"

# Run API tests
npm run test api-endpoints.test.ts
```

### Debug Mode
```bash
# Run tests with detailed output
npm run test -- --verbose --no-coverage

# Run single test with debugging
npm run test -- --testNamePattern="specific test name" --verbose
```

## ✅ Writing New Tests

### Test File Template
```typescript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Specific Component', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });

    test('should handle error conditions', () => {
      expect(() => {
        functionUnderTest(null);
      }).toThrow('Expected error message');
    });
  });
});
```

### Best Practices for New Tests

#### 1. Follow AAA Pattern
```typescript
test('should calculate business score correctly', () => {
  // Arrange
  const business = { name: 'Test Business', category: 'retail' };
  
  // Act
  const score = calculateBusinessScore(business);
  
  // Assert
  expect(score).toBeGreaterThan(0);
});
```

#### 2. Use Descriptive Names
```typescript
// Good
test('should extract contact name when business name contains person name at end')

// Bad
test('should work correctly')
```

#### 3. Test Edge Cases
```typescript
test('should handle empty business name gracefully', () => {
  expect(() => parseBusinessName('')).not.toThrow();
});

test('should handle null input without crashing', () => {
  expect(parseBusinessName(null)).toBe('');
});
```

#### 4. Mock External Dependencies
```typescript
// Mock database calls
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(true)
}));

// Mock file system operations
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('mock file content')
}));
```

## 🔍 Test Debugging

### Common Issues and Solutions

#### 1. Module Import Errors
```bash
# Error: Cannot find module '@/lib/something'
# Solution: Check path alias configuration in jest.config.js
```

#### 2. Database Connection Errors
```typescript
// Instead of connecting to real database
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(true)
}));
```

#### 3. TypeScript Compilation Errors
```bash
# Run TypeScript check
npx tsc --noEmit

# Fix TypeScript issues before running tests
npm run test
```

### Debugging Test Failures

#### 1. Verbose Output
```bash
npm run test -- --verbose
```

#### 2. Specific Test Debugging
```bash
npm run test -- --testNamePattern="failing test name" --verbose
```

#### 3. Console Logging
```typescript
test('debug test', () => {
  const result = functionUnderTest();
  console.log('Debug result:', result); // Use for debugging
  expect(result).toBe(expected);
});
```

## 📊 Test Coverage Analysis

### Current Coverage Areas

#### ✅ Well Tested (80%+ coverage)
- Business parsing and validation logic
- Scraper integration and data processing
- Payment integration structure
- Database model validation
- API endpoint structure

#### 🟡 Partially Tested (40-79% coverage)
- Authentication workflows
- Content management features
- Admin dashboard functionality

#### 🔴 Needs Testing (<40% coverage)
- End-to-end user workflows
- Error handling scenarios
- Performance edge cases
- Security validation

### Adding Coverage for New Features

#### 1. API Endpoints
```typescript
test('new API endpoint structure', () => {
  const fs = require('fs');
  const endpointPath = '/src/app/api/new-feature/route.ts';
  
  expect(fs.existsSync(endpointPath)).toBe(true);
  
  const content = fs.readFileSync(endpointPath, 'utf8');
  expect(content).toMatch(/export\s+(const\s+)?(GET|POST)/);
});
```

#### 2. Database Models
```typescript
test('new model schema validation', () => {
  const { NewModel } = require('@/models/index');
  const schema = NewModel.schema;
  
  expect(schema.paths.requiredField).toBeDefined();
  expect(schema.paths.requiredField.isRequired).toBe(true);
});
```

#### 3. Business Logic
```typescript
test('new business logic function', () => {
  const { newFunction } = require('@/lib/newFeature');
  
  expect(typeof newFunction).toBe('function');
  expect(newFunction('test input')).toBe('expected output');
});
```

## 🚀 Advanced Testing

### Performance Testing
```typescript
test('function performance benchmark', () => {
  const start = Date.now();
  
  // Run function multiple times
  for (let i = 0; i < 1000; i++) {
    functionUnderTest();
  }
  
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(100); // Should complete in <100ms
});
```

### Error Scenario Testing
```typescript
test('handles network failure gracefully', async () => {
  // Mock network failure
  jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
  
  const result = await functionThatMakesNetworkCall();
  
  expect(result.success).toBe(false);
  expect(result.error).toContain('Network error');
});
```

### Data Validation Testing
```typescript
test('validates input data correctly', () => {
  const validData = { name: 'Valid', email: 'test@example.com' };
  const invalidData = { name: '', email: 'invalid-email' };
  
  expect(validateUserData(validData)).toBe(true);
  expect(validateUserData(invalidData)).toBe(false);
});
```

## 🔄 Continuous Integration

### GitHub Actions Integration
Tests run automatically on:
- Every push to main branch
- Every pull request
- Manual workflow dispatch

### Pre-commit Testing
```bash
# Set up pre-commit hook
npm run test && npm run lint && npm run build
```

### Test Reports
- Test results are logged in CI/CD pipeline
- Failing tests block deployment
- Coverage reports track test quality

## 📈 Testing Roadmap

### Phase 1: Foundation (Current)
- [x] Comprehensive unit test coverage
- [x] Integration test framework
- [x] API endpoint validation
- [ ] Fix failing database tests

### Phase 2: Enhancement (Next Sprint)
- [ ] End-to-end testing with Playwright
- [ ] Performance testing framework
- [ ] Security testing integration
- [ ] Test automation improvements

### Phase 3: Advanced (Future)
- [ ] Visual regression testing
- [ ] Accessibility testing
- [ ] Load testing integration
- [ ] Test reporting dashboard

## 🆘 Getting Help

### Common Commands Reference
```bash
# Basic test commands
npm run test                    # Run all tests
npm run test -- --watch       # Watch mode
npm run test filename.test.ts  # Single file

# Debug commands
npm run test -- --verbose     # Detailed output
npm run test -- --no-cache   # Clear cache
npm run lint                  # Check code quality
npm run build                 # Verify build works

# Development commands
npm run dev                   # Start dev server
npm run build && npm run start # Test production build
```

### Troubleshooting Checklist
1. ✅ Are dependencies installed? (`npm install`)
2. ✅ Is TypeScript compiling? (`npx tsc --noEmit`)
3. ✅ Are imports correct? (Check path aliases)
4. ✅ Are mocks properly configured?
5. ✅ Is the test environment set up correctly?

### Resources
- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **TypeScript Testing**: https://jestjs.io/docs/getting-started#using-typescript
- **Project Documentation**: See `FEATURE_MATRIX.md` and `DEVELOPMENT_STATE.md`

---

*Last Updated: Current*  
*Test Framework: Jest with TypeScript*  
*Total Tests: 147 across 15 suites*