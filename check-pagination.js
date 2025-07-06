const cheerio = require('cheerio');

async function checkFullBusinessDirectory() {
  try {
    console.log('Analyzing the full business directory structure...');
    
    const response = await fetch('https://www.wetaskiwin.ca/businessdirectoryii.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Check for pagination or "show all" controls
    console.log('\n=== Looking for pagination or "show all" controls ===');
    $('a, button, select, input').each((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href') || '';
      const value = $(el).attr('value') || '';
      
      if (text.includes('all') || text.includes('more') || text.includes('next') || 
          text.includes('page') || href.includes('page') || href.includes('all') ||
          value.includes('all')) {
        console.log(`Element: ${$(el)[0].tagName}, Text: "${text}", Href: "${href}", Value: "${value}"`);
      }
    });
    
    // Check main listing container
    const businessRows = $('.listItemsRow, .alt.listItemsRow');
    console.log(`\nFound ${businessRows.length} business listing rows in current view`);
    
    // Look for container info
    const mainContainer = $('.mainListing, .searchResults, .listItems');
    console.log(`Main container classes: ${mainContainer.attr('class')}`);
    
    // Check if there are scripts that might load more content
    console.log('\n=== Looking for scripts that might control pagination ===');
    $('script').each((i, el) => {
      const scriptContent = $(el).html() || '';
      if (scriptContent.includes('page') || scriptContent.includes('load') || 
          scriptContent.includes('ajax') || scriptContent.includes('business')) {
        console.log(`Script ${i}: ${scriptContent.substring(0, 200)}...`);
      }
    });
    
    // Let's also check the form structure to see if there are hidden controls
    console.log('\n=== Form elements ===');
    $('form').each((i, el) => {
      console.log(`Form ${i}:`);
      $(el).find('input, select').each((j, input) => {
        const name = $(input).attr('name') || '';
        const value = $(input).attr('value') || '';
        const type = $(input).attr('type') || '';
        console.log(`  ${type}: name="${name}", value="${value}"`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFullBusinessDirectory();
