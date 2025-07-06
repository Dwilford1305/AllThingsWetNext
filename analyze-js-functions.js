const cheerio = require('cheerio');

async function analyzeJavaScriptFunctions() {
  try {
    const response = await fetch('https://www.wetaskiwin.ca/businessdirectoryii.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();
    
    // Find the JavaScript functions
    const callLetterMatch = html.match(/function callLetter\([\s\S]*?\n\s*\}/);
    const changePageMatch = html.match(/function ChangePage\([\s\S]*?\n\s*\}/);
    
    console.log('=== callLetter Function ===');
    if (callLetterMatch) {
      console.log(callLetterMatch[0]);
    }
    
    console.log('\n=== ChangePage Function ===');
    if (changePageMatch) {
      console.log(changePageMatch[0]);
    }
    
    // Look for form references
    const formRegex = /document\.forms?\[?\w*\]?|document\.\w+Form/g;
    const formMatches = html.match(formRegex);
    if (formMatches) {
      console.log('\n=== Form References ===');
      [...new Set(formMatches)].forEach(match => console.log(match));
    }
    
    // Try to find the actual form name
    const formNameMatch = html.match(/name=['"]([^'"]*form[^'"]*?)['"]|id=['"]([^'"]*form[^'"]*?)['"]|var\s+(\w*[Ff]orm\w*)/gi);
    if (formNameMatch) {
      console.log('\n=== Form Names/IDs ===');
      formNameMatch.forEach(match => console.log(match));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeJavaScriptFunctions();
