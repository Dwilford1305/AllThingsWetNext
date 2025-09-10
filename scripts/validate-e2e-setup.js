#!/usr/bin/env node

/**
 * E2E Test Validation Script
 * 
 * This script validates the E2E test setup and structure without running the actual tests.
 * It's useful for environments where Playwright browsers cannot be installed.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const e2eDir = path.join(projectRoot, 'e2e');

console.log('🧪 E2E Test Setup Validation\n');

// Check if E2E directory exists
if (!fs.existsSync(e2eDir)) {
  console.error('❌ E2E test directory not found');
  process.exit(1);
}

console.log('✅ E2E test directory exists');

// Check for Playwright config
const playwrightConfig = path.join(projectRoot, 'playwright.config.ts');
if (fs.existsSync(playwrightConfig)) {
  console.log('✅ Playwright configuration found');
} else {
  console.error('❌ Playwright configuration missing');
  process.exit(1);
}

// Check for test files
const expectedTestFiles = [
  'smoke.spec.ts',
  'auth.spec.ts',
  'business.spec.ts',
  'content.spec.ts',
  'admin.spec.ts',
  'payment.spec.ts',
  'visual.spec.ts',
  'mobile.spec.ts'
];

let testFilesFound = 0;
let missingFiles = [];

expectedTestFiles.forEach(file => {
  const filePath = path.join(e2eDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} found`);
    testFilesFound++;
    
    // Basic validation of test file structure
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes("import { test, expect } from '@playwright/test'")) {
      console.log(`   - Proper Playwright imports ✓`);
    }
    if (content.includes('test.describe(')) {
      console.log(`   - Test organization ✓`);
    }
    
  } else {
    console.error(`❌ ${file} missing`);
    missingFiles.push(file);
  }
});

console.log(`\n📊 Test Files Summary:`);
console.log(`   Found: ${testFilesFound}/${expectedTestFiles.length}`);

// Check package.json for E2E scripts
const packageJson = path.join(projectRoot, 'package.json');
if (fs.existsSync(packageJson)) {
  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  
  console.log('\n📜 Package.json Scripts:');
  const expectedScripts = [
    'test:e2e',
    'test:e2e:ui',
    'test:e2e:debug',
    'test:e2e:report',
    'test:e2e:headed',
    'test:e2e:mobile',
    'test:e2e:visual'
  ];
  
  expectedScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      console.log(`✅ ${script}: ${pkg.scripts[script]}`);
    } else {
      console.error(`❌ ${script} script missing`);
    }
  });
}

// Check for CI/CD workflow
const workflowFile = path.join(projectRoot, '.github', 'workflows', 'e2e-tests.yml');
if (fs.existsSync(workflowFile)) {
  console.log('\n✅ GitHub Actions E2E workflow found');
} else {
  console.log('\n⚠️  GitHub Actions E2E workflow not found');
}

// Check for documentation
const docsFile = path.join(projectRoot, 'E2E_TESTING_GUIDE.md');
if (fs.existsSync(docsFile)) {
  console.log('✅ E2E testing documentation found');
} else {
  console.log('⚠️  E2E testing documentation not found');
}

// Final summary
console.log('\n🎯 E2E Test Setup Summary:');
console.log(`   Test files: ${testFilesFound}/${expectedTestFiles.length}`);
console.log(`   Configuration: ${fs.existsSync(playwrightConfig) ? 'Complete' : 'Missing'}`);
console.log(`   CI/CD: ${fs.existsSync(workflowFile) ? 'Configured' : 'Needs setup'}`);
console.log(`   Documentation: ${fs.existsSync(docsFile) ? 'Available' : 'Needs creation'}`);

if (testFilesFound === expectedTestFiles.length && fs.existsSync(playwrightConfig)) {
  console.log('\n🎉 E2E test setup is complete!');
  console.log('\nNext steps:');
  console.log('1. Install Playwright browsers: npx playwright install');
  console.log('2. Run E2E tests: npm run test:e2e');
  console.log('3. View test reports: npm run test:e2e:report');
  process.exit(0);
} else {
  console.log('\n⚠️  E2E test setup needs attention');
  if (missingFiles.length > 0) {
    console.log(`Missing files: ${missingFiles.join(', ')}`);
  }
  process.exit(1);
}