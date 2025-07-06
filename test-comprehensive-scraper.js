const cheerio = require('cheerio');

class ComprehensiveWetaskiwinScraper {
  constructor() {
    this.baseUrl = 'https://www.wetaskiwin.ca';
  }

  async scrapeAllBusinesses() {
    try {
      console.log('Starting comprehensive business scraping...');
      
      const allBusinesses = [];
      
      // Strategy 1: Try to get all businesses using "ALL" letter filter
      console.log('\n=== Trying ALL filter ===');
      const allBusinessesAtOnce = await this.scrapeByLetter('ALL');
      
      if (allBusinessesAtOnce.length > 50) {
        console.log(`ALL filter found ${allBusinessesAtOnce.length} businesses - using this approach`);
        return allBusinessesAtOnce;
      }
      
      // Strategy 2: Go through each letter of the alphabet
      console.log('\n=== Going through each letter ===');
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
                      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
      
      for (const letter of letters) {
        try {
          console.log(`\nScraping businesses starting with '${letter}'...`);
          const letterBusinesses = await this.scrapeByLetter(letter);
          
          // Filter out duplicates
          const newBusinesses = letterBusinesses.filter(business => 
            !allBusinesses.some(existing => 
              existing.name.toLowerCase().trim() === business.name.toLowerCase().trim() &&
              existing.address.toLowerCase().includes(business.address.toLowerCase().substring(0, 15))
            )
          );
          
          allBusinesses.push(...newBusinesses);
          console.log(`Letter '${letter}': Found ${letterBusinesses.length} businesses (${newBusinesses.length} new, total: ${allBusinesses.length})`);
          
          // Be respectful to the server
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Error scraping letter ${letter}:`, error);
        }
      }
      
      console.log(`\nTotal unique businesses found: ${allBusinesses.length}`);
      return allBusinesses;
      
    } catch (error) {
      console.error('Error in comprehensive scraping:', error);
      return [];
    }
  }

  async scrapeByLetter(letter) {
    try {
      // First, get the page to obtain the viewstate and other form data
      const initialResponse = await fetch('https://www.wetaskiwin.ca/businessdirectoryii.aspx', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const initialHtml = await initialResponse.text();
      const $ = cheerio.load(initialHtml);
      
      // Extract form data
      const viewState = $('input[name="__VIEWSTATE"]').attr('value');
      const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').attr('value');
      
      // Make POST request with letter filter
      const response = await fetch('https://www.wetaskiwin.ca/businessdirectoryii.aspx', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
        },
        body: new URLSearchParams({
          '__EVENTTARGET': '',
          '__EVENTARGUMENT': '',
          '__VIEWSTATE': viewState || '',
          '__VIEWSTATEGENERATOR': viewStateGenerator || '',
          'ysnNotifyMe': '',
          'strPage': '',
          'intArchMainCatID': '',
          'intArchMainItemID': '',
          'lngBusinessCategoryID': '',
          'txtBusinessName': '',
          'txtZipCode': '',
          'txtCity': '',
          'txtState': '',
          'txtAreaCode': '',
          'txtCustomField1': '',
          'txtCustomField2': '',
          'txtCustomField3': '',
          'txtCustomField4': '',
          'SearchString': '',
          'ysnShowAll': letter === 'ALL' ? '1' : '0',
          'lngNewPage': '0',
          'txtLetter': letter === 'ALL' ? '' : letter,
          'txtZipCode': '',
          'txtCity': '',
          'txtState': '',
          'txtBusinessName': '',
          'lngBusinessCategoryID': '',
          'txtCustomField1': '',
          'txtCustomField2': '',
          'txtCustomField3': '',
          'txtCustomField4': '',
          'txtAreaCode': ''
        })
      });

      if (!response.ok) {
        console.error(`Failed to fetch businesses for letter ${letter}: ${response.status}`);
        return [];
      }

      const html = await response.text();
      return this.extractBusinessesFromHTML(html);
      
    } catch (error) {
      console.error(`Error scraping letter ${letter}:`, error);
      return [];
    }
  }

  extractBusinessesFromHTML(html) {
    const businesses = [];
    
    try {
      const $ = cheerio.load(html);
      
      // Target the specific business listing rows
      const businessRows = $('.listItemsRow, .alt.listItemsRow');
      
      businessRows.each((i, el) => {
        try {
          const text = $(el).text().trim();
          
          if (text.length > 20 && text.includes('Wetaskiwin')) {
            const business = this.parseBusinessEntry(text);
            if (business && business.name && business.address) {
              businesses.push(business);
            }
          }
        } catch (error) {
          console.error(`Error parsing business row ${i}:`, error);
        }
      });

      return businesses;

    } catch (error) {
      console.error('Error in extractBusinessesFromHTML:', error);
      return businesses;
    }
  }

  parseBusinessEntry(text) {
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
        .replace(/Facebook:.*?$/gm, '') // Remove Facebook links
        .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

      // Extract phone number first
      const phoneMatch = cleanText.match(/Phone:\s*(\d{3}[-.\s,]?\d{3}[-.\s,]?\d{4})/i);
      const phone = phoneMatch ? this.cleanPhoneNumber(phoneMatch[1]) : undefined;
      
      // Remove phone info from text
      if (phoneMatch) {
        cleanText = cleanText.replace(/Phone:.*$/i, '').trim();
      }

      // Extract address - more aggressive pattern matching
      const addressPattern = /(#?\d+[-,\s]*\d+.*?(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd).*?Wetaskiwin.*?AB.*?T\d[A-Z]\s*\d[A-Z]\d)/i;
      const addressMatch = cleanText.match(addressPattern);
      
      if (!addressMatch) {
        return null;
      }
      
      const fullAddress = addressMatch[1].trim();
      
      // Remove address from text to get name + contact
      const nameContactText = cleanText.replace(fullAddress, '').trim();
      
      // Parse business name and contact person using improved logic
      const { businessName, contact } = this.parseNameAndContactImproved(nameContactText);
      
      // Validate business name
      if (!businessName || businessName.length < 2 || businessName.length > 100) {
        return null;
      }
      
      return {
        name: businessName,
        contact: contact,
        address: this.cleanAddress(fullAddress),
        phone: phone,
        sourceUrl: 'https://www.wetaskiwin.ca/businessdirectoryii.aspx',
        category: this.categorizeBusinessType(businessName)
      };

    } catch (error) {
      return null;
    }
  }

  parseNameAndContactImproved(nameContactText) {
    if (!nameContactText) {
      return { businessName: '', contact: '' };
    }

    let businessName = '';
    let contact = '';
    
    // Strategy 1: Look for obvious person name patterns at the end (First Last)
    const personNamePattern = /([A-Z][a-z]+\s+[A-Z][a-z]+)$/;
    const personMatch = nameContactText.match(personNamePattern);
    
    if (personMatch) {
      contact = personMatch[1];
      businessName = nameContactText.replace(personMatch[1], '').trim();
    } else {
      // Strategy 2: Look for single first names at the end
      const singleNamePattern = /([A-Z][a-z]{2,})$/;
      const singleMatch = nameContactText.match(singleNamePattern);
      
      if (singleMatch && singleMatch[1].length >= 3 && 
          !['Store', 'Shop', 'Services', 'Service', 'Restaurant', 'Cafe', 'Ltd', 'Inc', 'Corp'].includes(singleMatch[1])) {
        contact = singleMatch[1];
        businessName = nameContactText.replace(singleMatch[1], '').trim();
      } else {
        // Strategy 3: Look for "and" patterns (like "Shanina and Dan Poulin")
        const andPattern = /(.+?)\s+(and\s+.+)$/i;
        const andMatch = nameContactText.match(andPattern);
        
        if (andMatch) {
          const beforeAnd = andMatch[1].trim();
          const afterAnd = andMatch[2].trim();
          
          // Check if what's before "and" looks like a business name ending
          const businessEndPattern = /(Ltd|Inc|Corp|Co|LLC|Services|Service|Store|Shop|Restaurant|Cafe)$/i;
          if (businessEndPattern.test(beforeAnd)) {
            businessName = beforeAnd;
            contact = afterAnd;
          } else {
            // Check if what's after "and" looks more like person names
            if (afterAnd.split(' ').length >= 2) {
              businessName = beforeAnd;
              contact = afterAnd;
            } else {
              businessName = nameContactText;
            }
          }
        } else {
          // No clear person name found, treat whole thing as business name
          businessName = nameContactText;
        }
      }
    }
    
    // Clean up business name - add spaces where camelCase was concatenated
    businessName = businessName
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Fix consecutive capitals
      .replace(/\s+/g, ' ')
      .trim();
    
    return { businessName, contact: contact.trim() };
  }

  cleanPhoneNumber(phone) {
    return phone.replace(/[-.\s,]/g, '-');
  }

  cleanAddress(address) {
    return address
      .replace(/\?\?/g, ' ')
      .replace(/(Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd)Wetaskiwin/gi, '$1 Wetaskiwin')
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .trim();
  }

  categorizeBusinessType(businessName) {
    const name = businessName.toLowerCase();
    
    if (name.includes('pizza') || name.includes('restaurant') || name.includes('cafe') || 
        name.includes('coffee') || name.includes('bar') || name.includes('grill') ||
        name.includes('food') || name.includes('kitchen') || name.includes('deli') ||
        name.includes('a&w') || name.includes('tim hortons')) {
      return 'restaurant';
    }
    
    if (name.includes('store') || name.includes('shop') || name.includes('boutique') ||
        name.includes('clothing') || name.includes('fashion') || name.includes('market') ||
        name.includes('liquor') || name.includes('7-eleven')) {
      return 'retail';
    }
    
    if (name.includes('auto') || name.includes('car') || name.includes('garage') ||
        name.includes('tire') || name.includes('service') || name.includes('repair') ||
        name.includes('collision') || name.includes('mechanic')) {
      return 'automotive';
    }
    
    if (name.includes('clinic') || name.includes('medical') || name.includes('health') ||
        name.includes('dental') || name.includes('pharmacy') || name.includes('wellness') ||
        name.includes('doctor') || name.includes('therapy')) {
      return 'health';
    }
    
    if (name.includes('law') || name.includes('accounting') || name.includes('insurance') ||
        name.includes('real estate') || name.includes('financial') || name.includes('consulting') ||
        name.includes('lawyer') || name.includes('attorney')) {
      return 'professional';
    }
    
    if (name.includes('cleaning') || name.includes('plumbing') || name.includes('electrical') ||
        name.includes('construction') || name.includes('renovation') || name.includes('landscaping') ||
        name.includes('septic') || name.includes('home services')) {
      return 'home-services';
    }
    
    return 'other';
  }
}

async function testComprehensiveScraper() {
  const scraper = new ComprehensiveWetaskiwinScraper();
  
  try {
    const businesses = await scraper.scrapeAllBusinesses();
    
    console.log(`\n=== COMPREHENSIVE SCRAPING RESULTS ===`);
    console.log(`Total businesses found: ${businesses.length}`);
    
    if (businesses.length > 0) {
      console.log(`\n=== FIRST 25 BUSINESSES ===`);
      businesses.slice(0, 25).forEach((business, i) => {
        console.log(`\n${i + 1}. ${business.name}`);
        console.log(`   Contact: ${business.contact || 'N/A'}`);
        console.log(`   Address: ${business.address}`);
        console.log(`   Phone: ${business.phone || 'N/A'}`);
        console.log(`   Category: ${business.category}`);
      });
      
      // Show category statistics
      const categories = {};
      businesses.forEach(business => {
        const category = business.category;
        categories[category] = (categories[category] || 0) + 1;
      });
      
      console.log(`\n=== CATEGORIES BREAKDOWN ===`);
      Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          console.log(`${category}: ${count}`);
        });
        
      // Validation checks
      const withPhones = businesses.filter(b => b.phone).length;
      const withContacts = businesses.filter(b => b.contact).length;
      
      console.log(`\n=== QUALITY METRICS ===`);
      console.log(`Businesses with phone numbers: ${withPhones}/${businesses.length} (${Math.round(withPhones/businesses.length*100)}%)`);
      console.log(`Businesses with contact persons: ${withContacts}/${businesses.length} (${Math.round(withContacts/businesses.length*100)}%)`);
      
      // Show businesses by first letter
      console.log(`\n=== BUSINESSES BY FIRST LETTER ===`);
      const letterCounts = {};
      businesses.forEach(business => {
        const firstLetter = business.name.charAt(0).toUpperCase();
        letterCounts[firstLetter] = (letterCounts[firstLetter] || 0) + 1;
      });
      
      Object.keys(letterCounts)
        .sort()
        .forEach(letter => {
          console.log(`${letter}: ${letterCounts[letter]}`);
        });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testComprehensiveScraper();
