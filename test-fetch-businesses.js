// Test fetching businesses from the API
async function testFetchBusinesses() {
  try {
    console.log('Testing business fetch API...');
    
    const response = await fetch('http://localhost:3000/api/businesses');
    
    if (!response.ok) {
      console.error(`API request failed: ${response.status}`);
      return;
    }
    
    const result = await response.json();
    console.log(`\nFetched ${result.data.length} businesses from database`);
    
    if (result.data.length > 0) {
      console.log('\nFirst 5 businesses:');
      result.data.slice(0, 5).forEach((business, index) => {
        console.log(`\n${index + 1}. ${business.name}`);
        console.log(`   Category: ${business.category}`);
        console.log(`   Address: ${business.address}`);
        console.log(`   Phone: ${business.phone || 'N/A'}`);
        console.log(`   Contact: ${business.contact || 'N/A'}`);
        console.log(`   Subscription: ${business.subscriptionTier}`);
        console.log(`   Views: ${business.views}`);
      });
      
      // Show category distribution
      const categories = {};
      result.data.forEach(business => {
        categories[business.category] = (categories[business.category] || 0) + 1;
      });
      
      console.log('\nCategory distribution:');
      Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing fetch businesses API:', error);
  }
}

testFetchBusinesses();
