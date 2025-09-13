#!/usr/bin/env node

/**
 * Performance Testing Utility
 * Tests various performance metrics and validates optimization improvements
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 AllThingsWetNext Performance Testing Utility\n');

async function testBuildPerformance() {
  console.log('📦 Testing Build Performance...');
  
  const startTime = Date.now();
  
  try {
    // Clean build to test from scratch
    if (fs.existsSync('.next')) {
      execSync('rm -rf .next', { stdio: 'inherit' });
    }
    
    // Build and measure time
    execSync('npm run build', { stdio: 'inherit' });
    
    const buildTime = Date.now() - startTime;
    console.log(`✅ Build completed in ${buildTime}ms (${(buildTime / 1000).toFixed(1)}s)`);
    
    // Analyze bundle size
    const bundleInfo = analyzeBundleSize();
    
    return {
      buildTime,
      ...bundleInfo
    };
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    throw error;
  }
}

function analyzeBundleSize() {
  console.log('\n📊 Analyzing Bundle Size...');
  
  try {
    // Read build output to analyze bundle sizes
    const buildOutputPath = '.next';
    const staticPath = path.join(buildOutputPath, 'static');
    
    if (!fs.existsSync(staticPath)) {
      console.log('⚠️ Static files not found');
      return {};
    }
    
    // Calculate total bundle size
    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          totalSize += getDirectorySize(filePath);
        } else {
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    };
    
    const staticSize = getDirectorySize(staticPath);
    const staticSizeMB = (staticSize / (1024 * 1024)).toFixed(2);
    
    console.log(`📦 Static bundle size: ${staticSizeMB} MB`);
    
    // Check for large files that could be optimized
    const checkLargeFiles = (dirPath, threshold = 500 * 1024) => {
      const largeFiles = [];
      
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          largeFiles.push(...checkLargeFiles(filePath, threshold));
        } else {
          const stats = fs.statSync(filePath);
          if (stats.size > threshold) {
            largeFiles.push({
              path: filePath.replace(process.cwd(), ''),
              size: (stats.size / 1024).toFixed(1) + ' KB'
            });
          }
        }
      }
      
      return largeFiles;
    };
    
    const largeFiles = checkLargeFiles(staticPath);
    
    if (largeFiles.length > 0) {
      console.log('\n⚠️ Large files detected (>500KB):');
      largeFiles.forEach(file => {
        console.log(`  - ${file.path}: ${file.size}`);
      });
    } else {
      console.log('✅ No unusually large files detected');
    }
    
    return {
      staticSizeMB: parseFloat(staticSizeMB),
      largeFiles: largeFiles.length
    };
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    return {};
  }
}

async function testAPIPerformance() {
  console.log('\n🌐 Testing API Performance...');
  
  // Start dev server for testing
  console.log('Starting development server...');
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    const server = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });
    
    let serverReady = false;
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('localhost:3000') && !serverReady) {
        serverReady = true;
        
        // Give server a moment to fully start
        setTimeout(async () => {
          try {
            const results = await performAPITests();
            
            // Kill server
            server.kill();
            process.kill(-server.pid, 'SIGKILL');
            
            resolve(results);
          } catch (error) {
            server.kill();
            process.kill(-server.pid, 'SIGKILL');
            resolve({ error: error.message });
          }
        }, 2000);
      }
    });
    
    server.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('warn') && !output.includes('Warning')) {
        console.error('Server error:', output);
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        server.kill();
        process.kill(-server.pid, 'SIGKILL');
        resolve({ error: 'Server startup timeout' });
      }
    }, 30000);
  });
}

async function performAPITests() {
  const testEndpoints = [
    '/api/health',
    '/api/events',
    '/api/businesses',
    '/api/news'
  ];
  
  const results = {};
  
  for (const endpoint of testEndpoints) {
    console.log(`Testing ${endpoint}...`);
    
    const url = `http://localhost:3000${endpoint}`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      results[endpoint] = {
        status: response.status,
        responseTime,
        success: response.ok
      };
      
      // Check cache headers
      const cacheControl = response.headers.get('cache-control');
      if (cacheControl) {
        results[endpoint].cached = true;
        results[endpoint].cacheControl = cacheControl;
      }
      
      console.log(`  ✅ ${response.status} - ${responseTime}ms${cacheControl ? ' (cached)' : ''}`);
    } catch (error) {
      results[endpoint] = {
        error: error.message,
        success: false
      };
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  return results;
}

function generateReport(results) {
  console.log('\n📋 Performance Report');
  console.log('='.repeat(50));
  
  // Build Performance
  if (results.build) {
    console.log('\n📦 Build Performance:');
    console.log(`  Build Time: ${(results.build.buildTime / 1000).toFixed(1)}s`);
    console.log(`  Bundle Size: ${results.build.staticSizeMB || 'N/A'} MB`);
    console.log(`  Large Files: ${results.build.largeFiles || 0}`);
    
    // Performance targets
    const buildTimeTarget = 30000; // 30 seconds
    const bundleSizeTarget = 10; // 10 MB
    
    console.log('\n🎯 Build Targets:');
    console.log(`  Build Time: ${results.build.buildTime < buildTimeTarget ? '✅' : '❌'} ${results.build.buildTime < buildTimeTarget ? 'Met' : 'Exceeded'} (Target: <30s)`);
    console.log(`  Bundle Size: ${results.build.staticSizeMB < bundleSizeTarget ? '✅' : '❌'} ${results.build.staticSizeMB < bundleSizeTarget ? 'Met' : 'Exceeded'} (Target: <10MB)`);
  }
  
  // API Performance
  if (results.api && !results.api.error) {
    console.log('\n🌐 API Performance:');
    
    let totalResponseTime = 0;
    let successfulRequests = 0;
    let cachedEndpoints = 0;
    
    Object.entries(results.api).forEach(([endpoint, data]) => {
      if (data.success) {
        totalResponseTime += data.responseTime;
        successfulRequests++;
        
        if (data.cached) {
          cachedEndpoints++;
        }
        
        console.log(`  ${endpoint}: ${data.responseTime}ms ${data.cached ? '(cached)' : ''}`);
      } else {
        console.log(`  ${endpoint}: ❌ ${data.error || 'Failed'}`);
      }
    });
    
    if (successfulRequests > 0) {
      const avgResponseTime = totalResponseTime / successfulRequests;
      console.log(`\n  Average Response Time: ${avgResponseTime.toFixed(1)}ms`);
      console.log(`  Cached Endpoints: ${cachedEndpoints}/${Object.keys(results.api).length}`);
      
      // Performance targets
      const responseTimeTarget = 500; // 500ms
      
      console.log('\n🎯 API Targets:');
      console.log(`  Response Time: ${avgResponseTime < responseTimeTarget ? '✅' : '❌'} ${avgResponseTime < responseTimeTarget ? 'Met' : 'Exceeded'} (Target: <500ms)`);
      console.log(`  Caching: ${cachedEndpoints > 0 ? '✅' : '❌'} ${cachedEndpoints > 0 ? 'Implemented' : 'Missing'}`);
    }
  } else if (results.api?.error) {
    console.log(`\n❌ API Testing Failed: ${results.api.error}`);
  }
  
  console.log('\n' + '='.repeat(50));
}

// Main execution
async function main() {
  try {
    const results = {};
    
    // Test build performance
    results.build = await testBuildPerformance();
    
    // Test API performance
    results.api = await testAPIPerformance();
    
    // Generate report
    generateReport(results);
    
    // Save results to file
    const reportPath = 'performance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('\n❌ Performance testing failed:', error.message);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  testBuildPerformance,
  testAPIPerformance,
  generateReport
};