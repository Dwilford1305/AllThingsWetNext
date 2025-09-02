import * as cheerio from 'cheerio'

export interface ScrapedBusiness {
  name: string
  contact: string
  address: string
  phone?: string
  website?: string
  category?: string
  sourceUrl: string
}

export interface BusinessScrapingResult {
  total: number
  new: number
  updated: number
  errors: string[]
}

export class WetaskiwinBusinessScraper {
  private baseUrl = 'https://www.wetaskiwin.ca'

  async scrapeBusinessPage(url: string): Promise<ScrapedBusiness[]> {
    try {
      console.log(`Starting business scraping from Wetaskiwin directory...`)
      
      // Use the show all URL parameter to get all businesses in one request
      const showAllUrl = url.includes('?') 
        ? url + '&ysnShowAll=1' 
        : url + '?ysnShowAll=1'
      
      console.log(`Fetching all businesses with URL: ${showAllUrl}`)
      const businesses = await this.scrapeBusinessDirectory(showAllUrl)
      
      console.log(`Successfully scraped ${businesses.length} businesses from directory`)
      return businesses

    } catch (error) {
      console.error(`Error scraping business directory:`, error)
      throw error
    }
  }

  private async scrapeBusinessDirectory(url: string): Promise<ScrapedBusiness[]> {
    const businesses: ScrapedBusiness[] = []
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })

      if (!response.ok) {
        console.error(`Failed to fetch page: ${response.status}`)
        return businesses
      }

      const html = await response.text()
      const $ = cheerio.load(html)
      
      console.log(`Page fetched successfully, analyzing structure...`)

      // Target the specific business listing rows
      const businessRows = $('.listItemsRow, .alt.listItemsRow')
      console.log(`Found ${businessRows.length} business listing rows`)
      
      businessRows.each((i, el) => {
        try {
          const text = $(el).text().trim()
          
          if (text.length > 20 && text.includes('Wetaskiwin')) {
            const business = this.parseBusinessEntry(text)
            if (business && business.name && business.address) {
              // Check for duplicates
              const isDuplicate = businesses.some(existing => 
                existing.name.toLowerCase().trim() === business.name.toLowerCase().trim() &&
                existing.address.toLowerCase().includes(business.address.toLowerCase().substring(0, 15))
              )
              
              if (!isDuplicate) {
                businesses.push(business)
              }
            }
          }
        } catch (error) {
          console.error(`Error parsing business row ${i}:`, error)
        }
      })

      return businesses

    } catch (error) {
      console.error('Error in scrapeBusinessDirectory:', error)
      return businesses
    }
  }

  private parseBusinessEntry(text: string): ScrapedBusiness | null {
    try {
      if (text.length < 10) return null

      // Extract website URL BEFORE cleaning the text
      const website = this.extractWebsite(text)

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
        .trim()

      // Extract phone number first
      const phoneMatch = cleanText.match(/Phone:\s*(\d{3}[-.\s,]?\d{3}[-.\s,]?\d{4})/i)
      const phone = phoneMatch ? this.cleanPhoneNumber(phoneMatch[1]) : undefined
      
      // Remove phone info from text
      if (phoneMatch) {
        cleanText = cleanText.replace(/Phone:.*$/i, '').trim()
      }

      // Enhanced address extraction with more flexible patterns
      let addressMatch = null
      let fullAddress = ''
      
      // Pattern 1: Most common format - number + street + Wetaskiwin + AB + postal code
      const fullAddressPattern = /(#?\d+[A-Za-z]?[-,\s]*[A-Za-z0-9\s,.-]*?(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd|Crescent|Cres|Close|Court|Ct|Way|Lane|Place|Pl).*?Wetaskiwin.*?AB.*?T\d[A-Z]\s*\d[A-Z]\d)/i
      addressMatch = cleanText.match(fullAddressPattern)
      
      if (!addressMatch) {
        // Pattern 2: Address without postal code
        const simpleAddressPattern = /(#?\d+[A-Za-z]?[-,\s]*[A-Za-z0-9\s,.-]*?(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd|Crescent|Cres|Close|Court|Ct|Way|Lane|Place|Pl).*?Wetaskiwin.*?AB)/i
        addressMatch = cleanText.match(simpleAddressPattern)
      }
      
      if (!addressMatch) {
        // Pattern 3: Street number pattern - more flexible to catch concatenated addresses
        const basicAddressPattern = /(\d{3,5}[A-Za-z]?\s*\d+[A-Za-z]?\s*(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd|Crescent|Cres|Close|Court|Ct|Way|Lane|Place|Pl).*?Wetaskiwin.*?AB.*?T\d[A-Z]\s*\d[A-Z]\d)/i
        addressMatch = cleanText.match(basicAddressPattern)
      }
      
      if (!addressMatch) {
        // Pattern 4: Box numbers
        const boxPattern = /((?:Box|P\.?O\.?\s*Box)\s*\d+[^,]*?Wetaskiwin[^,]*?AB[^,]*?T\d[A-Z]\s*\d[A-Z]\d)/i
        addressMatch = cleanText.match(boxPattern)
      }
      
      if (!addressMatch) {
        // Pattern 5: RR (Rural Route) addresses
        const rrPattern = /(RR\s*\d+[^,]*?Wetaskiwin[^,]*?AB[^,]*?T\d[A-Z]\s*\d[A-Z]\d)/i
        addressMatch = cleanText.match(rrPattern)
      }
      
      if (!addressMatch) {
        // Pattern 6: More flexible fallback - anything with Wetaskiwin, AB and postal code
        const fallbackPattern = /([^,]*?Wetaskiwin[^,]*?AB[^,]*?T\d[A-Z]\s*\d[A-Z]\d)/i
        addressMatch = cleanText.match(fallbackPattern)
      }
      
      if (!addressMatch) {
        // Pattern 7: Ultra-flexible fallback - just Wetaskiwin and AB
        const ultraFallbackPattern = /([^,]*?Wetaskiwin[^,]*?AB)/i
        addressMatch = cleanText.match(ultraFallbackPattern)
      }
      
      if (!addressMatch) {
        console.log(`No valid address found in: ${cleanText.substring(0, 100)}`)
        return null
      }
      
      fullAddress = addressMatch[1].trim()
      
      // Remove address from text to get name + contact
      const nameContactText = cleanText.replace(fullAddress, '').trim()
      
      // Parse business name and contact person using simplified logic
      const { businessName, contact } = this.parseNameAndContactSimplified(nameContactText)
      
      // More lenient validation for business names
      if (!businessName || 
          businessName.length < 2 || 
          businessName.length > 150 ||
          /^[^a-zA-Z]*$/.test(businessName) || // Only numbers/symbols
          businessName.includes('Phone:') ||
          businessName.startsWith('www.') ||
          businessName.includes('@') ||
          businessName.match(/^\d{3}-\d{3}-\d{4}$/) || // Just a phone number
          businessName.toLowerCase().trim() === 'wetaskiwin' || // Generic city name
          businessName.toLowerCase().trim() === 'pizza' || // Generic food type
          businessName.toLowerCase().trim().length < 3) { // Too short/generic
        console.log(`Invalid business name: "${businessName}"`)
        return null
      }
      
      return {
        name: businessName,
        contact: contact,
        address: this.cleanAddress(fullAddress),
        phone: phone,
        website: website,
        sourceUrl: this.baseUrl + '/businessdirectoryii.aspx'
      }

    } catch (error) {
      console.error('Error parsing business entry:', error)
      return null
    }
  }

  private extractWebsite(text: string): string | undefined {
    // Extract website URL before it gets removed from cleaning
    const websitePatterns = [
      /Link:\s*(https?:\/\/[^\s]+)/i,
      /Link:\s*(www\.[^\s]+)/i,
      /(https?:\/\/[^\s]+)/i,
      /(www\.[^\s]+)/i
    ];
    
    for (const pattern of websitePatterns) {
      const match = text.match(pattern);
      if (match) {
        let website = match[1];
        // Ensure proper protocol
        if (!website.startsWith('http')) {
          website = 'https://' + website;
        }
        return website;
      }
    }
    return undefined;
  }

  private parseNameAndContactSimplified(nameContactText: string): { businessName: string; contact: string } {
    if (!nameContactText) {
      return { businessName: '', contact: '' }
    }

    // Clean up the text first and fix concatenated words
    let text = nameContactText.trim();
    
    // List of endings that usually mean the business name is over
    const businessEndings = [
      'Ltd', 'Inc', 'Corp', 'Co', 'LLC', 'Limited', 'Services', 'Service', 'Restaurant', 'Cafe', 'Centre', 'Center', 'Group', 'Club', 'Hotel', 'Inn', 'Bar', 'Grill', 'Kitchen', 'Market', 'Auto', 'Motors', 'Sales', 'Clinic', 'Hospital', 'Salon', 'Studio', 'Fitness', 'Gym', 'Pizza', 'Pasta', 'Liquor', 'Gas', 'Oil', 'Tire', 'Glass', 'Electric', 'Plumbing', 'Construction', 'Contracting', 'Cleaning', 'Pharmacy', 'Bank', 'Insurance', 'Travel', 'Agency', 'Consulting', 'Solutions', 'Systems', 'Tech', 'Communications', 'Media', 'Design', 'Graphics', 'Printing', 'Photography', 'Entertainment', 'Equipment', 'Supply', 'Supplies', 'Parts', 'Repair', 'Maintenance', 'Security', 'Safety', 'Training', 'Education', 'Academy', 'School', 'Institute', 'Foundation', 'Association', 'Society', 'Network', 'Taxi', 'Cab', 'Rental', 'Rentals', 'Finance', 'Financial', 'Investment', 'Holdings', 'Properties', 'Development', 'Management', 'Shop', 'Office'
    ];

    // Fix concatenated words by adding spaces before capital letters that follow business endings
    for (const ending of businessEndings) {
      const pattern = new RegExp(`(${ending})([A-Z][a-z]+)`, 'g');
      text = text.replace(pattern, '$1 $2');
    }
    
    // Add space before capital letters that seem to start contact names
    text = text.replace(/([a-z])([A-Z][a-z]+\s+[A-Z][a-z]+)$/g, '$1 $2'); // "ServiceGary Johnson" -> "Service Gary Johnson"

    let businessName = text;
    let contact = '';

    // First try to match business ending patterns with contact names
    for (const ending of businessEndings) {
      const pattern = new RegExp(`^(.+?\\b${ending}\\b\\.?)\\s+([A-Z][a-z]+(?:\\s+(?:Mc|Mac)?[A-Z][a-z]+){0,2})\\s*$`, 'i');
      const match = text.match(pattern);
      if (match) {
        const potentialContact = match[2].trim();
        // Check if the potential contact is also a business ending - if so, keep as business name
        const contactIsBusinessEnding = businessEndings.some(ending => 
          ending.toLowerCase() === potentialContact.toLowerCase()
        );
        if (!contactIsBusinessEnding) {
          businessName = match[1].trim().replace(/[.,;:]+$/, '');
          contact = potentialContact;
          return { businessName, contact };
        }
      }
    }

    // If no contact name found but text ends with business ending, keep the whole thing as business name
    for (const ending of businessEndings) {
      const pattern = new RegExp(`\\b${ending}\\b\\.?\\s*$`, 'i');
      if (pattern.test(text)) {
        return { businessName: text, contact: '' };
      }
    }

    // If no business ending found, look for pattern where last 1-2 words are capitalized names
    const words = text.split(/\s+/);
    if (words.length >= 3) {
      // Try extracting last 2 words as contact name if they look like proper names
      const lastTwoWords = words.slice(-2);
      if (lastTwoWords.length === 2 && 
          lastTwoWords.every(w => /^[A-Z][a-z]+$/.test(w))) {
        // Check that these aren't business endings or common business words
        const isBusinessEnding = businessEndings.some(ending => 
          ending.toLowerCase() === lastTwoWords[lastTwoWords.length - 1].toLowerCase()
        );
        // Additional check for common business words that aren't in the endings list
        const commonBusinessWords = ['store', 'shop', 'company', 'services', 'center', 'centre'];
        const isCommonBusinessWord = commonBusinessWords.some(word => 
          lastTwoWords.some(w => w.toLowerCase() === word)
        );
        
        if (!isBusinessEnding && !isCommonBusinessWord) {
          businessName = words.slice(0, -2).join(' ');
          contact = lastTwoWords.join(' ');
          return { businessName, contact };
        }
      }
      
      // Try extracting last word as contact name if it's a proper name
      const lastWord = words[words.length - 1];
      if (/^[A-Z][a-z]{2,}$/.test(lastWord)) { // At least 3 characters to avoid short words
        const isBusinessEnding = businessEndings.some(ending => 
          ending.toLowerCase() === lastWord.toLowerCase()
        );
        // Additional common business words check
        const commonBusinessWords = ['store', 'shop', 'company', 'services', 'center', 'centre'];
        const isCommonBusinessWord = commonBusinessWords.some(word => 
          lastWord.toLowerCase() === word
        );
        
        if (!isBusinessEnding && !isCommonBusinessWord) {
          businessName = words.slice(0, -1).join(' ');
          contact = lastWord;
          return { businessName, contact };
        }
      }
    }

    // Otherwise, treat the whole thing as business name
    return { businessName, contact: '' };
  }

  private cleanPhoneNumber(phone: string): string {
    return phone.replace(/[-.\s,]/g, '-')
  }

  private cleanAddress(address: string): string {
    return address
      .replace(/\?\?/g, ' ') // Replace ?? with space
      .replace(/(Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd)Wetaskiwin/gi, '$1 Wetaskiwin') // Add space between street type and city
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/,\s*,/g, ',') // Fix double commas
      .trim()
  }

  categorizeBusinesses(businesses: ScrapedBusiness[]): ScrapedBusiness[] {
    return businesses.map(business => ({
      ...business,
      category: this.categorizeBusinessType(business.name)
    }))
  }

  private categorizeBusinessType(businessName: string): string {
    const name = businessName.toLowerCase()
    
    if (name.includes('pizza') || name.includes('restaurant') || name.includes('cafe') || 
        name.includes('coffee') || name.includes('bar') || name.includes('grill') ||
        name.includes('food') || name.includes('kitchen') || name.includes('deli') ||
        name.includes('a&w') || name.includes('tim hortons')) {
      return 'restaurant'
    }
    
    if (name.includes('store') || name.includes('shop') || name.includes('boutique') ||
        name.includes('clothing') || name.includes('fashion') || name.includes('market') ||
        name.includes('liquor') || name.includes('7-eleven')) {
      return 'retail'
    }
    
    if (name.includes('auto') || name.includes('car') || name.includes('garage') ||
        name.includes('tire') || name.includes('service') || name.includes('repair') ||
        name.includes('collision') || name.includes('mechanic')) {
      return 'automotive'
    }
    
    if (name.includes('clinic') || name.includes('medical') || name.includes('health') ||
        name.includes('dental') || name.includes('pharmacy') || name.includes('wellness') ||
        name.includes('doctor') || name.includes('therapy')) {
      return 'health'
    }
    
    if (name.includes('law') || name.includes('accounting') || name.includes('insurance') ||
        name.includes('real estate') || name.includes('financial') || name.includes('consulting') ||
        name.includes('lawyer') || name.includes('attorney')) {
      return 'professional'
    }
    
    if (name.includes('cleaning') || name.includes('plumbing') || name.includes('electrical') ||
        name.includes('construction') || name.includes('renovation') || name.includes('landscaping') ||
        name.includes('septic') || name.includes('home services')) {
      return 'home-services'
    }
    
    return 'other'
  }
}
