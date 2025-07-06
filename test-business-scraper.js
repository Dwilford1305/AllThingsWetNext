const cheerio = require('cheerio');

async function testScraper() {
  try {
    console.log('Fetching business directory page...');
    const response = await fetch('https://www.wetaskiwin.ca/businessdirectoryii.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log('Failed to fetch page:', response.status);
      return;
    }

    const html = await response.text();
    console.log('Page fetched successfully, length:', html.length);
    
    const $ = cheerio.load(html);
    
    // Let's see what the page structure looks like
    console.log('\n=== Page Title ===');
    console.log($('title').text());
    
    console.log('\n=== Looking for business-related divs ===');
    $('div').each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes('business') || text.includes('directory') || text.includes('Wetaskiwin')) {
        const className = $(el).attr('class') || 'no-class';
        const id = $(el).attr('id') || 'no-id';
        console.log(`Div ${i}: class="${className}", id="${id}"`);
        console.log(`Text snippet: ${text.substring(0, 100)}...`);
        console.log('---');
      }
    });
    
    // Look for table structures
    console.log('\n=== Looking for tables ===');
    $('table').each((i, el) => {
      const rows = $(el).find('tr').length;
      const text = $(el).text().trim();
      if (text.length > 50 && text.includes('Wetaskiwin')) {
        console.log(`Table ${i}: ${rows} rows`);
        console.log(`Text snippet: ${text.substring(0, 200)}...`);
        console.log('---');
      }
    });
    
    // Look for specific business listing patterns
    console.log('\n=== Looking for business patterns ===');
    const businessPattern = /([A-Za-z].*?\d{4,5}.*?Street|Avenue|Ave|St|Road|Rd.*?Wetaskiwin.*?AB.*?T9A)/gi;
    const matches = html.match(businessPattern);
    if (matches) {
      console.log(`Found ${matches.length} potential business entries:`);
      matches.slice(0, 5).forEach((match, i) => {
        const clean = match.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`${i+1}. ${clean.substring(0, 150)}...`);
      });
    } else {
      console.log('No business patterns found');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testScraper();
