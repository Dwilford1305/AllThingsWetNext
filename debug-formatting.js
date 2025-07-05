const axios = require('axios');
const cheerio = require('cheerio');

async function debugWetaskiwinFormatting() {
  console.log('=== DEBUGGING EXACT CHARACTER FORMATTING ===\n');
  
  try {
    const calendarUrl = 'https://wetaskiwin.ca/calendar.aspx?CID=25,23&showPastEvents=false';
    const response = await axios.get(calendarUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    const $ = cheerio.load(response.data);
    let foundCount = 0;
    
    $('h3').each((index, element) => {
      const $heading = $(element);
      const $link = $heading.find('a[href*="Calendar.aspx"]');
      
      if ($link.length > 0 && foundCount < 3) {
        const title = $link.text().trim();
        console.log(`=== EVENT: ${title} ===`);
        
        let $current = $heading.next();
        let elementCount = 0;
        
        while ($current.length > 0 && $current.prop('tagName') !== 'H3' && elementCount < 5) {
          const text = $current.text().trim();
          
          if (text && text.includes('2025') && text.includes('AM') || text.includes('PM')) {
            console.log(`Raw text: "${text}"`);
            console.log(`Text length: ${text.length}`);
            
            // Check each character
            for (let i = 0; i < Math.min(text.length, 50); i++) {
              const char = text.charAt(i);
              const code = text.charCodeAt(i);
              console.log(`Char ${i}: "${char}" (${code})`);
            }
            
            // Test the working regex from our test
            const workingPattern = /([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}:\d{2} [AP]M).*?(?:@ (.+?))?$/;
            const match = text.match(workingPattern);
            
            console.log(`\nTesting working pattern: ${workingPattern.source}`);
            console.log(`Match result:`, match ? 'SUCCESS' : 'FAILED');
            
            if (match) {
              console.log(`  Date: "${match[1]}"`);
              console.log(`  Time: "${match[2]}"`); 
              console.log(`  Location: "${match[3] || 'N/A'}"`);
            }
            
            // Test current scraper patterns one by one
            const scraperPatterns = [
              /([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)(?:\s*-\s*\d{1,2}:\d{2} [AP]M)?\s*@?\s*(.+)?/,
              /([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)\s*-\s*[A-Za-z]+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/,
              /([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)/
            ];
            
            scraperPatterns.forEach((pattern, i) => {
              const scraperMatch = text.match(pattern);
              console.log(`\nScraper Pattern ${i + 1}: ${scraperMatch ? 'SUCCESS' : 'FAILED'}`);
              if (scraperMatch) {
                console.log(`  Date: "${scraperMatch[1]}"`);
                console.log(`  Time: "${scraperMatch[2]}"`);
                console.log(`  Location: "${scraperMatch[3] || 'N/A'}"`);
              }
            });
            
            console.log('\n' + '='.repeat(60) + '\n');
            break;
          }
          
          $current = $current.next();
          elementCount++;
        }
        
        foundCount++;
      }
    });
    
  } catch (error) {
    console.error('Error during debug:', error.message);
  }
}

debugWetaskiwinFormatting();
