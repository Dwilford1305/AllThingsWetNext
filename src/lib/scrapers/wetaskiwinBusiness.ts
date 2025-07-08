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
        sourceUrl: this.baseUrl + '/businessdirectoryii.aspx'
      }

    } catch (error) {
      console.error('Error parsing business entry:', error)
      return null
    }
  }

  private parseNameAndContactSimplified(nameContactText: string): { businessName: string; contact: string } {
    if (!nameContactText) {
      return { businessName: '', contact: '' }
    }

    // List of endings that usually mean the business name is over
    const businessEndings = [
      'Ltd', 'Inc', 'Corp', 'Co', 'LLC', 'Limited', 'Services', 'Service', 'Restaurant', 'Cafe', 'Centre', 'Center', 'Group', 'Club', 'Hotel', 'Inn', 'Bar', 'Grill', 'Kitchen', 'Market', 'Auto', 'Motors', 'Sales', 'Clinic', 'Hospital', 'Salon', 'Studio', 'Fitness', 'Gym', 'Pizza', 'Pasta', 'Liquor', 'Gas', 'Oil', 'Tire', 'Glass', 'Electric', 'Plumbing', 'Construction', 'Contracting', 'Cleaning', 'Pharmacy', 'Bank', 'Insurance', 'Travel', 'Agency', 'Consulting', 'Solutions', 'Systems', 'Tech', 'Communications', 'Media', 'Design', 'Graphics', 'Printing', 'Photography', 'Entertainment', 'Equipment', 'Supply', 'Supplies', 'Parts', 'Repair', 'Maintenance', 'Security', 'Safety', 'Training', 'Education', 'Academy', 'School', 'Institute', 'Foundation', 'Association', 'Society', 'Network', 'Taxi', 'Cab', 'Rental', 'Rentals', 'Finance', 'Financial', 'Investment', 'Holdings', 'Properties', 'Development', 'Management', 'Shop'
    ];

    // Insert a space after any business ending if glued to a capitalized word
    let businessName = nameContactText.trim();
    for (const ending of businessEndings) {
      const gluedPattern = new RegExp(`(${ending})([A-Z][a-z]+)`, 'g');
      businessName = businessName.replace(gluedPattern, '$1 $2');
    }
    // Insert a space before 'and' or '&' if glued to the business name
    businessName = businessName.replace(/([a-zA-Z])((and|&)\b)/g, '$1 $2');
    // Also insert a space before any capitalized word that follows a lowercase, symbol, or period
    businessName = businessName
      .replace(/([a-z0-9\)\]\.!?])([A-Z][a-z]+)/g, '$1 $2')
      .replace(/([a-z])([A-Z][A-Z]+)/g, '$1 $2')
      .replace(/([a-z])([A-Z])/g, '$1 $2');

    let contact = '';

    // Try to split by business ending
    for (const ending of businessEndings) {
      const pattern = new RegExp(`^(.+?\\b${ending}\\b\\.?)(?:\\s+|$)([A-Z][a-z]+(?:\\s+(?:Mc|Mac)?[A-Z][a-z]+){0,2})?$`, 'i');
      const match = businessName.match(pattern);
      if (match) {
        businessName = match[1].trim().replace(/[.,;:]+$/, '');
        contact = (match[2] || '').trim();
        return { businessName, contact };
      }
    }

    // If not found, try to extract the last 1-3 words as contact if they look like names or are 'and'/'&'
    const words = businessName.split(/\s+/);
    for (let n = 3; n >= 1; n--) {
      if (words.length > n) {
        const lastN = words.slice(-n);
        // Accept if all are capitalized, or are 'and'/'&', or look like names (including Mc/Mac)
        if (lastN.every(w => /^[A-Z][a-z]+$/.test(w) || /^Mc[A-Z][a-z]+$/.test(w) || /^Mac[A-Z][a-z]+$/.test(w) || w.toLowerCase() === 'and' || w === '&')) {
          // Don't treat as contact if the last word is a business ending
          if (!businessEndings.includes(lastN[lastN.length - 1])) {
            businessName = words.slice(0, -n).join(' ');
            contact = lastN.join(' ');
            return { businessName, contact };
          }
        }
      }
    }

    // Otherwise, treat the whole thing as business name
    return { businessName, contact };
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
