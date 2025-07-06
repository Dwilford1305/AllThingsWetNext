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
    console.log('\nAPI Response structure:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error testing fetch businesses API:', error);
  }
}

testFetchBusinesses();
