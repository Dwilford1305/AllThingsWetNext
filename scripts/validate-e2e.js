#!/usr/bin/env node

/**
 * E2E Framework Validation Script
 * 
 * This script validates that all E2E test infrastructure is properly configured
 * without requiring Playwright browser downloads. It checks:
 * 
 * - Test fixtures and imports
 * - Database helper functions
 * - Test configuration files
 * - Mock data structures
 * - File system structure
 */

const fs = require('fs');
const path = require('path');

const E2E_DIR = path.join(__dirname, '..', 'tests', 'e2e');
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function success(message) {
  log(`✅ ${message}`, COLORS.GREEN);
}

function error(message) {
  log(`❌ ${message}`, COLORS.RED);
}

function info(message) {
  log(`ℹ️  ${message}`, COLORS.BLUE);
}

function warning(message) {
  log(`⚠️  ${message}`, COLORS.YELLOW);
}

async function validateFileExists(filePath, description) {
  try {
    await fs.promises.access(filePath);
    success(`${description} exists: ${path.relative(process.cwd(), filePath)}`);
    return true;
  } catch (err) {
    error(`${description} missing: ${path.relative(process.cwd(), filePath)}`);
    return false;
  }
}

async function validateTestFixtures() {
  info('Validating test fixtures...');
  
  const fixturesPath = path.join(E2E_DIR, 'fixtures', 'test-fixtures.ts');
  if (!await validateFileExists(fixturesPath, 'Test fixtures file')) {
    return false;
  }
  
  try {
    const fixturesContent = await fs.promises.readFile(fixturesPath, 'utf-8');
    
    // Check for required exports
    const requiredExports = [
      'TEST_USERS',
      'TEST_BUSINESS', 
      'TEST_MARKETPLACE_ITEM',
      'TEST_EVENT',
      'test',
      'expect',
      'TestHelpers'
    ];
    
    for (const exportName of requiredExports) {
      if (fixturesContent.includes(`export const ${exportName}`) || 
          fixturesContent.includes(`export class ${exportName}`) ||
          fixturesContent.includes(`export { ${exportName}`)) {
        success(`Export '${exportName}' found in fixtures`);
      } else {
        error(`Export '${exportName}' missing from fixtures`);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    error(`Failed to read test fixtures: ${err.message}`);
    return false;
  }
}

async function validateDatabaseHelper() {
  info('Validating database helper...');
  
  const helperPath = path.join(E2E_DIR, 'helpers', 'database-helper.ts');
  if (!await validateFileExists(helperPath, 'Database helper file')) {
    return false;
  }
  
  try {
    const helperContent = await fs.promises.readFile(helperPath, 'utf-8');
    
    const requiredFunctions = [
      'connectToTestDatabase',
      'clearTestDatabase',
      'disconnectFromTestDatabase',
      'seedTestData',
      'createTestUser',
      'cleanupTestUser'
    ];
    
    for (const functionName of requiredFunctions) {
      if (helperContent.includes(`export async function ${functionName}`) ||
          helperContent.includes(`export function ${functionName}`)) {
        success(`Function '${functionName}' found in database helper`);
      } else {
        error(`Function '${functionName}' missing from database helper`);
        return false;
      }
    }
    
    // Check for mock mode support
    if (helperContent.includes('mockMode')) {
      success('Mock mode support detected in database helper');
    } else {
      warning('Mock mode support not found - may cause issues in restricted environments');
    }
    
    return true;
  } catch (err) {
    error(`Failed to read database helper: ${err.message}`);
    return false;
  }
}

async function validateTestFiles() {
  info('Validating E2E test files...');
  
  const expectedTestFiles = [
    '00-framework-validation.spec.ts',
    '01-homepage-navigation.spec.ts',
    '02-user-authentication.spec.ts',
    '03-business-workflows.spec.ts',
    '04-content-creation.spec.ts',
    '05-admin-dashboard.spec.ts',
    '06-payment-subscription.spec.ts',
    '07-visual-regression.spec.ts',
    '08-cross-browser-mobile.spec.ts'
  ];
  
  let allFilesValid = true;
  
  for (const testFile of expectedTestFiles) {
    const testFilePath = path.join(E2E_DIR, testFile);
    if (await validateFileExists(testFilePath, `Test file '${testFile}'`)) {
      
      // Check if the file imports from fixtures correctly
      try {
        const content = await fs.promises.readFile(testFilePath, 'utf-8');
        if (content.includes("from '../fixtures/test-fixtures'") ||
            content.includes("from '@playwright/test'")) {
          success(`Import statement found in ${testFile}`);
        } else {
          warning(`No fixture import found in ${testFile}`);
        }
      } catch (err) {
        warning(`Could not read ${testFile}: ${err.message}`);
      }
    } else {
      allFilesValid = false;
    }
  }
  
  return allFilesValid;
}

async function validatePlaywrightConfig() {
  info('Validating Playwright configuration...');
  
  const configs = [
    'playwright.config.ts',
    'playwright.mock.config.ts'
  ];
  
  let hasValidConfig = false;
  
  for (const configFile of configs) {
    const configPath = path.join(process.cwd(), configFile);
    if (await validateFileExists(configPath, `Playwright config '${configFile}'`)) {
      hasValidConfig = true;
      
      try {
        const configContent = await fs.promises.readFile(configPath, 'utf-8');
        if (configContent.includes('testDir:')) {
          success(`Test directory configured in ${configFile}`);
        }
        if (configContent.includes('reporter:')) {
          success(`Reporter configured in ${configFile}`);
        }
      } catch (err) {
        warning(`Could not read ${configFile}: ${err.message}`);
      }
    }
  }
  
  return hasValidConfig;
}

async function validatePackageJson() {
  info('Validating package.json E2E scripts...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!await validateFileExists(packageJsonPath, 'package.json')) {
    return false;
  }
  
  try {
    const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
    const scripts = packageJson.scripts || {};
    
    const expectedScripts = [
      'test:e2e',
      'test:e2e:validate',
      'test:e2e:chrome',
      'test:e2e:firefox',
      'test:e2e:mobile'
    ];
    
    for (const script of expectedScripts) {
      if (scripts[script]) {
        success(`npm script '${script}' found`);
      } else {
        error(`npm script '${script}' missing`);
        return false;
      }
    }
    
    // Check dependencies
    const devDeps = packageJson.devDependencies || {};
    if (devDeps['@playwright/test']) {
      success(`@playwright/test dependency found (${devDeps['@playwright/test']})`);
    } else {
      error('@playwright/test dependency missing');
      return false;
    }
    
    if (devDeps['mongodb-memory-server']) {
      success(`mongodb-memory-server dependency found (${devDeps['mongodb-memory-server']})`);
    } else {
      warning('mongodb-memory-server dependency missing');
    }
    
    return true;
  } catch (err) {
    error(`Failed to read package.json: ${err.message}`);
    return false;
  }
}

async function validateEnvironment() {
  info('Validating environment compatibility...');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1));
  if (majorVersion >= 16) {
    success(`Node.js version compatible: ${nodeVersion}`);
  } else {
    error(`Node.js version too old: ${nodeVersion} (requires >= 16)`);
    return false;
  }
  
  // Check if we can import Playwright (without running it)
  try {
    require.resolve('@playwright/test');
    success('@playwright/test package is resolvable');
  } catch (err) {
    error('@playwright/test package not found - run npm install');
    return false;
  }
  
  // Check MongoDB Memory Server
  try {
    require.resolve('mongodb-memory-server');
    success('mongodb-memory-server package is resolvable');
  } catch (err) {
    warning('mongodb-memory-server package not found - some tests may use mock mode');
  }
  
  return true;
}

async function runValidation() {
  console.log('\n🎭 E2E Framework Validation Report\n');
  console.log('=' .repeat(50));
  
  const results = await Promise.all([
    validateEnvironment(),
    validatePackageJson(),
    validatePlaywrightConfig(),
    validateTestFixtures(),
    validateDatabaseHelper(),
    validateTestFiles()
  ]);
  
  console.log('\n' + '='.repeat(50));
  
  const allPassed = results.every(Boolean);
  
  if (allPassed) {
    success('🎉 All E2E framework validations passed!');
    info('✨ Framework is ready for testing');
    info('💡 Run "npm run test:e2e:validate" for framework testing without browser downloads');
    info('🚀 Run "npm run test:e2e" for full browser testing (requires browser installation)');
  } else {
    error('💥 Some E2E framework validations failed!');
    info('🔧 Fix the issues above before running E2E tests');
  }
  
  console.log('');
  return allPassed;
}

if (require.main === module) {
  runValidation().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runValidation };