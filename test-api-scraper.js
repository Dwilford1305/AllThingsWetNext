// Simple test that uses the compiled scraper service via API
async function testBusinessAPI() {
  try {
    console.log('Testing business scraping via API...');
    
    const response = await fetch('http://localhost:3000/api/scraper/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`API request failed: ${response.status}`);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }
    
    const result = await response.json();
    console.log('\nAPI Response:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error testing business API:', error);
    console.log('\nTip: Make sure the Next.js server is running with "npm run dev"');
  }
}

testBusinessAPI();
