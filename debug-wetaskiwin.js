const cheerio = require('cheerio');
const axios = require('axios');

async function debugWetaskiwinScraper() {
  console.log('=== DEBUGGING WETASKIWIN.CA SCRAPER ===\n');
  
  try {
    const calendarUrl = 'https://wetaskiwin.ca/calendar.aspx?CID=25,23&showPastEvents=false';
    
    console.log('1. Fetching calendar page...');
    const response = await axios.get(calendarUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Content length: ${response.data.length}`);
    
    const $ = cheerio.load(response.data);
    
    console.log('\n2. Looking for H3 headings with Calendar.aspx links...');
    let foundCount = 0;
    
    $('h3').each((index, element) => {
      const $heading = $(element);
      const $link = $heading.find('a[href*="Calendar.aspx"]');
      
      if ($link.length > 0) {
        foundCount++;
        const title = $link.text().trim();
        const eventUrl = $link.attr('href');
        
        console.log(`\n--- Event ${foundCount}: ${title} ---`);
        console.log(`URL: ${eventUrl}`);
        
        // Look for content after the heading
        let $current = $heading.next();
        let stepCount = 0;
        
        while ($current.length > 0 && $current.prop('tagName') !== 'H3' && stepCount < 5) {
          stepCount++;
          const text = $current.text().trim();
          
          if (text) {
            console.log(`  Step ${stepCount}: "${text}"`);
            
            // Test our regex patterns
            const pattern1 = text.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)(?:\s*-\s*\d{1,2}:\d{2} [AP]M)?\s*(?:@\s*(.+))?/);
            const pattern2 = text.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)\s*-\s*[A-Za-z]+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/);
            const pattern3 = text.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)\s*-\s*[A-Za-z]+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M\s*(?:@\s*(.+))?/);
            
            if (pattern1) console.log(`    ✓ Pattern 1 matched: ${JSON.stringify(pattern1.slice(1))}`);
            if (pattern2) console.log(`    ✓ Pattern 2 matched: ${JSON.stringify(pattern2.slice(1))}`);
            if (pattern3) console.log(`    ✓ Pattern 3 matched: ${JSON.stringify(pattern3.slice(1))}`);
          }
          
          $current = $current.next();
        }
      }
    });
    
    console.log(`\n3. Total H3 headings with Calendar.aspx links found: ${foundCount}`);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugWetaskiwinScraper();
