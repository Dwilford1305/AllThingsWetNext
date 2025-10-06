#!/usr/bin/env node

/**
 * Performance Testing Script
 * 
 * Tests API endpoints to measure response times and caching effectiveness
 * Run: node scripts/performance-test.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function measureEndpoint(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const start = performance.now();
  
  try {
    const response = await fetch(url, options);
    const end = performance.now();
    const duration = Math.round(end - start);
    
    return {
      success: response.ok,
      status: response.status,
      duration,
      cached: response.headers.get('x-cache') === 'HIT',
      cacheControl: response.headers.get('cache-control')
    };
  } catch (error) {
    const end = performance.now();
    return {
      success: false,
      error: error.message,
      duration: Math.round(end - start)
    };
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests\n');
  console.log(`Testing against: ${BASE_URL}\n`);
  
  const endpoints = [
    { name: 'Events API', path: '/api/events' },
    { name: 'News API', path: '/api/news' },
    { name: 'Businesses API', path: '/api/businesses' },
    { name: 'Jobs API', path: '/api/jobs' },
    { name: 'Marketplace API', path: '/api/marketplace' },
    { name: 'Health Check', path: '/api/health' },
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.name}`);
    
    // First request (cache miss expected)
    const firstRequest = await measureEndpoint(endpoint.path);
    console.log(`  First request:  ${firstRequest.duration}ms (${firstRequest.status || 'ERROR'})`);
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Second request (cache hit expected)
    const secondRequest = await measureEndpoint(endpoint.path);
    console.log(`  Second request: ${secondRequest.duration}ms (${secondRequest.status || 'ERROR'})`);
    
    // Third request (cache hit expected)
    const thirdRequest = await measureEndpoint(endpoint.path);
    console.log(`  Third request:  ${thirdRequest.duration}ms (${thirdRequest.status || 'ERROR'})`);
    
    const improvement = firstRequest.duration > 0 
      ? Math.round(((firstRequest.duration - secondRequest.duration) / firstRequest.duration) * 100)
      : 0;
    
    console.log(`  Performance improvement: ${improvement}%`);
    
    if (firstRequest.cacheControl) {
      console.log(`  Cache-Control: ${firstRequest.cacheControl}`);
    }
    
    console.log('');
    
    results.push({
      endpoint: endpoint.name,
      firstRequest: firstRequest.duration,
      cachedRequest: secondRequest.duration,
      improvement: improvement,
      status: firstRequest.success ? 'PASS' : 'FAIL'
    });
  }
  
  // Summary
  console.log('\n📊 Performance Summary\n');
  console.log('┌─────────────────────┬──────────────┬──────────────┬──────────────┬────────┐');
  console.log('│ Endpoint            │ First (ms)   │ Cached (ms)  │ Improvement  │ Status │');
  console.log('├─────────────────────┼──────────────┼──────────────┼──────────────┼────────┤');
  
  results.forEach(result => {
    const endpoint = result.endpoint.padEnd(19);
    const first = String(result.firstRequest).padStart(12);
    const cached = String(result.cachedRequest).padStart(12);
    const improvement = `${result.improvement}%`.padStart(12);
    const status = result.status.padEnd(6);
    
    console.log(`│ ${endpoint} │ ${first} │ ${cached} │ ${improvement} │ ${status} │`);
  });
  
  console.log('└─────────────────────┴──────────────┴──────────────┴──────────────┴────────┘');
  
  // Calculate overall stats
  const totalFirst = results.reduce((sum, r) => sum + r.firstRequest, 0);
  const totalCached = results.reduce((sum, r) => sum + r.cachedRequest, 0);
  const avgFirst = Math.round(totalFirst / results.length);
  const avgCached = Math.round(totalCached / results.length);
  const avgImprovement = Math.round(
    results.reduce((sum, r) => sum + r.improvement, 0) / results.length
  );
  const passRate = Math.round(
    (results.filter(r => r.status === 'PASS').length / results.length) * 100
  );
  
  console.log('\n📈 Overall Statistics:');
  console.log(`  Average first request:  ${avgFirst}ms`);
  console.log(`  Average cached request: ${avgCached}ms`);
  console.log(`  Average improvement:    ${avgImprovement}%`);
  console.log(`  Pass rate:              ${passRate}%`);
  
  // Performance goals check
  console.log('\n🎯 Performance Goals:');
  const goalMet = avgCached < 500;
  console.log(`  API Response Time < 500ms: ${goalMet ? '✅ PASS' : '❌ FAIL'} (${avgCached}ms)`);
  
  if (avgImprovement < 30) {
    console.log(`  ⚠️  Warning: Cache improvement is below 30% (${avgImprovement}%)`);
    console.log('     Consider increasing cache TTL or checking cache implementation');
  }
  
  console.log('\n✨ Performance test complete!\n');
}

// Run tests
runPerformanceTests().catch(error => {
  console.error('❌ Performance test failed:', error);
  process.exit(1);
});
