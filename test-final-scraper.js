const cheerio = require('cheerio');

class WetaskiwinBusinessScraperFinal {
  constructor() {
    this.baseUrl = 'https://www.wetaskiwin.ca';
  }

  async scrapeBusinessPage(url) {
    try {
      console.log(`Starting business scraping from Wetaskiwin directory...`);
      
      const businesses = await this.scrapeBusinessDirectory(url);
      
      console.log(`Successfully scraped ${businesses.length} businesses from directory`);
      return businesses;

    } catch (error) {
      console.error(`Error scraping business directory:`, error);
      throw error;
    }
  }

  async scrapeBusinessDirectory(url) {
    const businesses = [];
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch page: ${response.status}`);
        return businesses;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      console.log(`Page fetched successfully, analyzing structure...`);

      // Target the specific business listing rows
      const businessRows = $('.listItemsRow, .alt.listItemsRow');
      console.log(`Found ${businessRows.length} business listing rows`);
      
      businessRows.each((i, el) => {
        try {
          const text = $(el).text().trim();
          
          if (text.length > 20 && text.includes('Wetaskiwin')) {
            const business = this.parseBusinessEntry(text);
            if (business && business.name && business.address) {
              // Check for duplicates
              const isDuplicate = businesses.some(existing => 
                existing.name.toLowerCase().trim() === business.name.toLowerCase().trim() &&
                existing.address.toLowerCase().includes(business.address.toLowerCase().substring(0, 15))
              );
              
              if (!isDuplicate) {
                businesses.push(business);
              }
            }
          }
        } catch (error) {
          console.error(`Error parsing business row ${i}:`, error);
        }
      });

      return businesses;

    } catch (error) {
      console.error('Error in scrapeBusinessDirectory:', error);
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
        sourceUrl: this.baseUrl + '/businessdirectoryii.aspx',
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

async function testFinalScraper() {
  const scraper = new WetaskiwinBusinessScraperFinal();
  
  try {
    const businesses = await scraper.scrapeBusinessPage('https://www.wetaskiwin.ca/businessdirectoryii.aspx');
    
    console.log(`\n=== FINAL SCRAPING RESULTS ===`);
    console.log(`Total businesses found: ${businesses.length}`);
    
    if (businesses.length > 0) {
      console.log(`\n=== SAMPLE BUSINESSES ===`);
      businesses.slice(0, 15).forEach((business, i) => {
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
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFinalScraper();
