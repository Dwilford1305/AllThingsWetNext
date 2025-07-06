const cheerio = require('cheerio');

async function analyzeBusinessDirectoryForm() {
  try {
    console.log('Analyzing the business directory form structure...');
    
    const response = await fetch('https://www.wetaskiwin.ca/businessdirectoryii.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Look for form fields more carefully
    console.log('\n=== All Form Fields ===');
    $('input, select, button').each((i, el) => {
      const tag = $(el)[0].tagName.toLowerCase();
      const name = $(el).attr('name') || '';
      const value = $(el).attr('value') || '';
      const type = $(el).attr('type') || '';
      const id = $(el).attr('id') || '';
      
      if (name || id) {
        console.log(`${tag}: name="${name}", id="${id}", type="${type}", value="${value}"`);
      }
    });
    
    // Look for __VIEWSTATE and other ASP.NET fields
    console.log('\n=== ASP.NET State Fields ===');
    const viewState = $('input[name="__VIEWSTATE"]').attr('value');
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').attr('value');
    const eventTarget = $('input[name="__EVENTTARGET"]').attr('value');
    const eventArgument = $('input[name="__EVENTARGUMENT"]').attr('value');
    
    console.log('__VIEWSTATE:', viewState ? viewState.substring(0, 50) + '...' : 'not found');
    console.log('__VIEWSTATEGENERATOR:', viewStateGenerator);
    console.log('__EVENTTARGET:', eventTarget);
    console.log('__EVENTARGUMENT:', eventArgument);
    
    // Check if there are links or buttons to show more/all
    console.log('\n=== Links and Buttons ===');
    $('a, button').each((i, el) => {
      const text = $(el).text().trim().toLowerCase();
      const href = $(el).attr('href') || '';
      const onclick = $(el).attr('onclick') || '';
      
      if (text.includes('all') || text.includes('more') || text.includes('next') || 
          href.includes('all') || onclick.includes('all')) {
        console.log(`${$(el)[0].tagName}: text="${text}", href="${href}", onclick="${onclick}"`);
      }
    });
    
    // Try to simulate clicking "all" link
    console.log('\n=== Trying to find "show all" mechanism ===');
    const allLink = $('a:contains("all")');
    if (allLink.length > 0) {
      console.log('Found "all" link:', allLink.attr('href'), allLink.text());
      
      // Check if it has an onclick handler
      const onclick = allLink.attr('onclick');
      if (onclick) {
        console.log('Onclick handler:', onclick);
      }
    }
    
    // Look for JavaScript that might handle the "show all" functionality
    console.log('\n=== JavaScript Analysis ===');
    $('script').each((i, el) => {
      const scriptContent = $(el).html() || '';
      if (scriptContent.includes('ShowAll') || scriptContent.includes('ysnShowAll') || 
          scriptContent.includes('business') || scriptContent.includes('directory')) {
        console.log(`Script ${i} (relevant):`);
        console.log(scriptContent.substring(0, 500) + '...');
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeBusinessDirectoryForm();
