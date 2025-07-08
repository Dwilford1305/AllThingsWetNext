const { default: fetch } = require('node-fetch');
const cheerio = require('cheerio');

async function debugBusinessParser() {
  console.log('Debugging business parser...');
  
  try {
    const url = 'https://www.wetaskiwin.ca/businessdirectoryii.aspx?ysnShowAll=1';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const businessRows = $('.listItemsRow, .alt.listItemsRow');
    console.log(`Found ${businessRows.length} business listing rows`);
    
    // Show first 3 raw entries
    businessRows.slice(0, 3).each((i, el) => {
      const text = $(el).text().trim();
      console.log(`\n=== RAW BUSINESS ENTRY ${i + 1} ===`);
      console.log(text);
      console.log(`Length: ${text.length}`);
      console.log(`Contains Wetaskiwin: ${text.includes('Wetaskiwin')}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugBusinessParser();
