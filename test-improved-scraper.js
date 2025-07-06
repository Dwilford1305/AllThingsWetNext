const cheerio = require('cheerio');

async function testImprovedScraper() {
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
    
    // Target the business listing rows specifically
    const businessRows = $('.listItemsRow, .alt.listItemsRow');
    console.log(`Found ${businessRows.length} business rows`);
    
    const businesses = [];
    
    businessRows.each((i, el) => {
      const text = $(el).text().trim();
      console.log(`\n=== Business ${i + 1} ===`);
      console.log('Raw text:', text.substring(0, 200));
      
      // Parse this business entry
      const business = parseBusinessEntry(text);
      if (business) {
        businesses.push(business);
        console.log('Parsed:', JSON.stringify(business, null, 2));
      } else {
        console.log('Failed to parse this entry');
      }
      
      if (i >= 5) return false; // Only show first 6 for testing
    });
    
    console.log(`\n=== Summary ===`);
    console.log(`Successfully parsed ${businesses.length} out of ${Math.min(6, businessRows.length)} businesses`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

function parseBusinessEntry(text) {
  try {
    // Clean up the text
    let cleanText = text
      .replace(/\[View Map[^\]]*\]/g, '') // Remove map links
      .replace(/Opens in new window/g, '') // Remove "Opens in new window"
      .replace(/Link:.*?(?=Phone:|$)/g, '') // Remove website links
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    console.log('Cleaned text:', cleanText);

    // Extract phone number first
    const phoneMatch = cleanText.match(/Phone:\s*(\d{3}[-.\s,]?\d{3}[-.\s,]?\d{4})/i);
    const phone = phoneMatch ? phoneMatch[1].replace(/[-.\s,]/g, '-') : undefined;
    
    // Remove phone info from text
    if (phoneMatch) {
      cleanText = cleanText.replace(/Phone:.*$/i, '').trim();
    }

    console.log('After phone removal:', cleanText);

    // Now parse the remaining text which should be: BusinessNameContactPersonAddress
    // Look for address pattern - starts with numbers and contains street indicators
    const addressPattern = /(#?\d+[-,\s]*\d*\s+\d+.*?(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd).*?Wetaskiwin.*?AB.*?T\d[A-Z]\s*\d[A-Z]\d)/i;
    const addressMatch = cleanText.match(addressPattern);
    
    if (!addressMatch) {
      console.log('No address pattern found');
      return null;
    }
    
    const fullAddress = addressMatch[1].trim();
    console.log('Extracted address:', fullAddress);
    
    // Remove address from text to get name + contact
    const nameContactText = cleanText.replace(fullAddress, '').trim();
    console.log('Name + Contact text:', nameContactText);
    
    // Parse business name and contact
    // Look for where the business name ends and contact person begins
    const words = nameContactText.split(/\s+/);
    
    let businessName = '';
    let contact = '';
    
    // Strategy: Look for patterns that indicate a person's name
    // Usually capital letter followed by another capital letter (first + last name)
    let nameEndIndex = words.length;
    
    for (let i = 1; i < words.length - 1; i++) {
      const current = words[i];
      const next = words[i + 1];
      
      // If we find what looks like a person name pattern (two capitalized words)
      if (current.length >= 2 && next.length >= 2 && 
          /^[A-Z][a-z]+$/.test(current) && /^[A-Z][a-z]+$/.test(next) &&
          !['Street', 'Avenue', 'Road', 'Drive', 'Boulevard', 'Wetaskiwin', 'Alberta'].includes(current) &&
          !['Street', 'Avenue', 'Road', 'Drive', 'Boulevard', 'Wetaskiwin', 'Alberta'].includes(next)) {
        nameEndIndex = i;
        break;
      }
    }
    
    if (nameEndIndex < words.length) {
      businessName = words.slice(0, nameEndIndex).join(' ');
      contact = words.slice(nameEndIndex).join(' ');
    } else {
      // Fallback: if no clear person name found, take most of it as business name
      businessName = nameContactText;
    }
    
    // Clean up business name - add spaces between camelCase
    businessName = businessName
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!businessName || businessName.length < 2) {
      return null;
    }
    
    return {
      name: businessName,
      contact: contact.trim(),
      address: fullAddress,
      phone: phone,
      sourceUrl: 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
    };

  } catch (error) {
    console.log('Error parsing business entry:', error);
    return null;
  }
}

testImprovedScraper();
