// Test the full business scraper service
const { BusinessScraperService } = require('./src/lib/businessScraperService.js');

async function testBusinessScraperService() {
  console.log('Testing full business scraper service...');
  
  try {
    const service = new BusinessScraperService();
    const result = await service.scrapeBusinesses();
    
    console.log('\nScraping Results:');
    console.log(`Total businesses: ${result.total}`);
    console.log(`New businesses: ${result.new}`);
    console.log(`Updated businesses: ${result.updated}`);
    console.log(`Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Test fetching businesses
    console.log('\nTesting business fetch...');
    const businesses = await service.getBusinesses({ limit: 5 });
    console.log(`Fetched ${businesses.length} businesses from database`);
    
    if (businesses.length > 0) {
      console.log('\nFirst few businesses from database:');
      businesses.forEach((business, index) => {
        console.log(`\n${index + 1}. ${business.name}`);
        console.log(`   Category: ${business.category}`);
        console.log(`   Address: ${business.address}`);
        console.log(`   Phone: ${business.phone || 'N/A'}`);
        console.log(`   Subscription: ${business.subscriptionTier}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing business scraper service:', error);
  }
}

testBusinessScraperService();
