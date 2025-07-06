const cheerio = require('cheerio');

async function tryAlternativeApproaches() {
  console.log('Trying alternative approaches to get all businesses...');
  
  // Try different URL patterns that might show all businesses
  const urlsToTry = [
    'https://www.wetaskiwin.ca/businessdirectoryii.aspx',
    'https://www.wetaskiwin.ca/businessdirectoryii.aspx?all=true',
    'https://www.wetaskiwin.ca/businessdirectoryii.aspx?showall=1',
    'https://www.wetaskiwin.ca/businessdirectoryii.aspx?txtLetter=ALL',
    'https://www.wetaskiwin.ca/businessdirectoryii.aspx?ysnShowAll=1',
    'https://www.wetaskiwin.ca/businessdirectory.aspx',
    'https://www.wetaskiwin.ca/businessdirectory2.aspx'
  ];
  
  for (const url of urlsToTry) {
    try {
      console.log(`\nTrying URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const businessRows = $('.listItemsRow, .alt.listItemsRow');
        console.log(`Found ${businessRows.length} business rows`);
        
        if (businessRows.length > 0) {
          businessRows.each((i, el) => {
            if (i < 5) { // Show first 5
              const text = $(el).text().trim();
              console.log(`  ${i + 1}. ${text.substring(0, 80)}...`);
            }
          });
        }
        
        // Also check for any "next" or "more" buttons
        const nextButtons = $('a, button').filter((i, el) => {
          const text = $(el).text().toLowerCase();
          return text.includes('next') || text.includes('more') || text.includes('>>');
        });
        
        if (nextButtons.length > 0) {
          console.log(`  Found ${nextButtons.length} navigation buttons`);
        }
        
      } else {
        console.log(`  Failed: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
  
  // Try the manual approach - using the letter by letter approach
  // But with a proper ASP.NET form submission
  console.log('\n=== Trying proper ASP.NET form submission ===');
  
  try {
    // Get initial page to get viewstate
    const response = await fetch('https://www.wetaskiwin.ca/businessdirectoryii.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract all form fields
    const formData = {};
    $('input[type="hidden"]').each((i, el) => {
      const name = $(el).attr('name');
      const value = $(el).attr('value') || '';
      if (name) {
        formData[name] = value;
      }
    });
    
    console.log('Form data extracted:');
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      console.log(`  ${key}: ${value.length > 50 ? value.substring(0, 50) + '...' : value}`);
    });
    
    // Try to submit for letter 'B' to see if we get different results
    formData['txtLetter'] = 'B';
    formData['ysnShowAll'] = '0';
    formData['lngNewPage'] = '0';
    
    const postResponse = await fetch('https://www.wetaskiwin.ca/businessdirectoryii.aspx', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
      },
      body: new URLSearchParams(formData)
    });
    
    if (postResponse.ok) {
      const postHtml = await postResponse.text();
      const $post = cheerio.load(postHtml);
      
      const postBusinessRows = $post('.listItemsRow, .alt.listItemsRow');
      console.log(`\nPOST request for letter 'B' found ${postBusinessRows.length} business rows`);
      
      if (postBusinessRows.length > 0) {
        postBusinessRows.each((i, el) => {
          if (i < 3) {
            const text = $post(el).text().trim();
            console.log(`  ${i + 1}. ${text.substring(0, 80)}...`);
          }
        });
      }
    }
    
  } catch (error) {
    console.log('Error with form submission:', error.message);
  }
}

tryAlternativeApproaches();
