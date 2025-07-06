const cheerio = require('cheerio');

async function testRefinedParsing() {
  try {
    const response = await fetch('https://www.wetaskiwin.ca/businessdirectoryii.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const businessRows = $('.listItemsRow, .alt.listItemsRow');
    console.log(`Found ${businessRows.length} business rows\n`);
    
    businessRows.each((i, el) => {
      const text = $(el).text().trim();
      console.log(`=== Business ${i + 1} ===`);
      console.log('Raw text:', text);
      
      const parsed = parseBusinessEntryRefined(text);
      if (parsed) {
        console.log('Parsed result:', JSON.stringify(parsed, null, 2));
      } else {
        console.log('Failed to parse');
      }
      console.log('');
      
      if (i >= 9) return false; // Only first 10
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

function parseBusinessEntryRefined(text) {
  try {
    if (text.length < 10) return null;

    // Clean up the text thoroughly
    let cleanText = text
      .replace(/\[View Map[^\]]*\]/g, '') // Remove map links
      .replace(/View Map/g, '') // Remove "View Map" text
      .replace(/Opens in new window/g, '') // Remove "Opens in new window"
      .replace(/Link:.*?(?=Phone:|$)/g, '') // Remove website links
      .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
      .replace(/var\s+[^;]+;/g, '') // Remove JavaScript variables
      .replace(/document\.write[^;]+;/g, '') // Remove document.write calls
      .replace(/Email:.*?<\/a>/g, '') // Remove email links
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    console.log('  Cleaned text:', cleanText);

    // Extract phone number first
    const phoneMatch = cleanText.match(/Phone:\s*(\d{3}[-.\s,]?\d{3}[-.\s,]?\d{4})/i);
    const phone = phoneMatch ? phoneMatch[1].replace(/[-.\s,]/g, '-') : undefined;
    
    // Remove phone info from text
    if (phoneMatch) {
      cleanText = cleanText.replace(/Phone:.*$/i, '').trim();
    }

    console.log('  After phone removal:', cleanText);

    // Extract address - more aggressive pattern matching
    const addressPattern = /(#?\d+[-,\s]*\d+.*?(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd).*?Wetaskiwin.*?AB.*?T\d[A-Z]\s*\d[A-Z]\d)/i;
    const addressMatch = cleanText.match(addressPattern);
    
    if (!addressMatch) {
      console.log('  No address found');
      return null;
    }
    
    const fullAddress = addressMatch[1].trim();
    console.log('  Extracted address:', fullAddress);
    
    // Remove address from text to get name + contact
    const nameContactText = cleanText.replace(fullAddress, '').trim();
    console.log('  Name + Contact text:', nameContactText);
    
    // Now the tricky part - separate business name from contact person
    // The pattern seems to be: BusinessNameContactPerson
    // We need to detect where the business name ends and contact begins
    
    let businessName = '';
    let contact = '';
    
    // Strategy: Split on capital letters that indicate person names
    // Look for patterns like "BusinessNameJohn Smith" or "BusinessNameJ Smith"
    
    // First, try to find obvious person name patterns
    const personNamePattern = /([A-Z][a-z]+\s+[A-Z][a-z]+)$/;
    const personMatch = nameContactText.match(personNamePattern);
    
    if (personMatch) {
      contact = personMatch[1];
      businessName = nameContactText.replace(personMatch[1], '').trim();
    } else {
      // Look for single first names at the end
      const singleNamePattern = /([A-Z][a-z]+)$/;
      const singleMatch = nameContactText.match(singleNamePattern);
      
      if (singleMatch && singleMatch[1].length >= 3) {
        contact = singleMatch[1];
        businessName = nameContactText.replace(singleMatch[1], '').trim();
      } else {
        // No clear person name found, treat whole thing as business name
        businessName = nameContactText;
      }
    }
    
    // Clean up business name - add spaces where camelCase was concatenated
    businessName = businessName
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Fix consecutive capitals
      .replace(/\s+/g, ' ')
      .trim();
      
    console.log('  Business name:', businessName);
    console.log('  Contact:', contact);
    
    if (!businessName || businessName.length < 2) {
      return null;
    }
    
    return {
      name: businessName,
      contact: contact,
      address: cleanAddress(fullAddress),
      phone: phone,
      sourceUrl: 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
    };

  } catch (error) {
    console.log('  Error parsing:', error.message);
    return null;
  }
}

function cleanAddress(address) {
  return address
    .replace(/\?\?/g, ' ')
    .replace(/(Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd)Wetaskiwin/gi, '$1 Wetaskiwin')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim();
}

testRefinedParsing();
