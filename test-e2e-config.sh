#!/bin/bash

# Test E2E setup without browser downloads
# This script validates the E2E test configuration

echo "🔧 Testing E2E configuration..."

# Check if test files parse correctly
echo "📝 Checking test file syntax..."
npx playwright test --dry-run --reporter=list 2>&1 | head -20

echo ""
echo "📊 Test file summary:"
find e2e -name "*.spec.ts" -exec echo "  - {}" \;

echo ""
echo "⚙️ Configuration check complete"