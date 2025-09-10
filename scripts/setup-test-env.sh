#!/bin/bash

# Test environment setup script for E2E testing
echo "🚀 Setting up test environment for E2E testing..."

# Ensure node_modules are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Ensure Playwright browsers are installed
echo "🌐 Installing Playwright browsers..."
npx playwright install chromium

# Pre-download MongoDB Memory Server binaries
echo "🗄️ Pre-downloading MongoDB Memory Server binaries..."
node -e "
const { MongoMemoryServer } = require('mongodb-memory-server');
console.log('Downloading MongoDB binaries...');
MongoMemoryServer.create({
  binary: {
    downloadDir: './node_modules/.cache/mongodb-memory-server/mongodb-binaries',
  }
}).then(mongod => {
  console.log('✅ MongoDB binaries downloaded successfully');
  return mongod.stop();
}).catch(err => {
  console.error('❌ Failed to download MongoDB binaries:', err);
  process.exit(1);
});
"

echo "✅ Test environment setup completed!"
echo "🎯 You can now run: npm run test:e2e"