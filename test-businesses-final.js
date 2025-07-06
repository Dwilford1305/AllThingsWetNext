// Test fetching businesses from the API with correct data path
async function testFetchBusinesses() {
  try {
    console.log('Testing business fetch API...');
    
    const response = await fetch('http://localhost:3000/api/businesses');
    
    if (!response.ok) {
      console.error(`API request failed: ${response.status}`);
      return;
    }
    
    const result = await response.json();
    const businesses = result.data.businesses;
    const pagination = result.data.pagination;
    
    console.log(`\nFetched ${businesses.length} businesses from database`);
    console.log(`Total businesses in database: ${pagination.totalCount}`);
    console.log(`Page ${pagination.currentPage} of ${pagination.totalPages}`);
    
    if (businesses.length > 0) {
      console.log('\nFirst 5 businesses:');
      businesses.slice(0, 5).forEach((business, index) => {
        console.log(`\n${index + 1}. ${business.name}`);
        console.log(`   Category: ${business.category}`);
        console.log(`   Address: ${business.address}`);
        console.log(`   Phone: ${business.phone || 'N/A'}`);
        console.log(`   Contact: ${business.contact || 'N/A'}`);
        console.log(`   Subscription: ${business.subscriptionTier}`);
        console.log(`   ID: ${business.id}`);
      });
      
      // Show category distribution for this page
      const categories = {};
      businesses.forEach(business => {
        categories[business.category] = (categories[business.category] || 0) + 1;
      });
      
      console.log('\nCategory distribution (current page):');
      Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
      });
      
      // Test fetching by category
      console.log('\n--- Testing category filtering ---');
      const restaurantResponse = await fetch('http://localhost:3000/api/businesses?category=restaurant');
      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json();
        console.log(`\nRestaurants found: ${restaurantData.data.businesses.length}`);
        restaurantData.data.businesses.slice(0, 3).forEach((restaurant, index) => {
          console.log(`${index + 1}. ${restaurant.name} - ${restaurant.contact || 'No contact'}`);
        });
      }
      
      const automotiveResponse = await fetch('http://localhost:3000/api/businesses?category=automotive');
      if (automotiveResponse.ok) {
        const automotiveData = await automotiveResponse.json();
        console.log(`\nAutomotive businesses found: ${automotiveData.data.businesses.length}`);
        automotiveData.data.businesses.slice(0, 3).forEach((auto, index) => {
          console.log(`${index + 1}. ${auto.name} - ${auto.contact || 'No contact'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error testing fetch businesses API:', error);
  }
}

testFetchBusinesses();
