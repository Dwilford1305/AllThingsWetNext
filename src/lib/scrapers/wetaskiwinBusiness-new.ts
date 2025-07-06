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
      
      const businesses = await this.scrapeBusinessDirectory(url)
      
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

      // Clean up the text first
      let cleanText = text
        .replace(/\[View Map[^\]]*\]/g, '') // Remove map links
        .replace(/View Map/g, '') // Remove "View Map" text
        .replace(/Opens in new window/g, '') // Remove "Opens in new window"
        .replace(/Link:.*?(?=Phone:|$)/g, '') // Remove website links
        .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
        .replace(/var\s+\w+\s*=.*?;/g, '') // Remove JavaScript variables
        .replace(/document\.write.*?;/g, '') // Remove document.write calls
        .replace(/Email:.*?<\/a>/g, '') // Remove email links
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()

      // Extract phone number first
      const phoneMatch = cleanText.match(/Phone:\s*(\d{3}[-.\s,]?\d{3}[-.\s,]?\d{4})/i)
      const phone = phoneMatch ? this.cleanPhoneNumber(phoneMatch[1]) : undefined
      
      // Remove phone info from text
      if (phoneMatch) {
        cleanText = cleanText.replace(/Phone:.*$/i, '').trim()
      }

      // Extract the address using improved pattern
      const addressMatch = this.extractAddress(cleanText)
      if (!addressMatch) {
        console.log(`No valid address found in: ${cleanText.substring(0, 100)}`)
        return null
      }
      
      const fullAddress = addressMatch.trim()
      
      // Remove address from text to get name + contact
      const nameContactText = cleanText.replace(fullAddress, '').trim()
      
      // Parse business name and contact person
      const { businessName, contact } = this.parseNameAndContact(nameContactText)
      
      // Validate business name
      if (!businessName || businessName.length < 2 || businessName.length > 100) {
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

  private extractAddress(text: string): string | null {
    // Look for various address patterns
    const patterns = [
      // Pattern 1: Suite/Unit + Street number + Street name + City + Province + Postal
      /(#?\w*[-,\s]*\d+[-,\s]*\d+.*?(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd|Way|Place|Pl|Crescent|Cres|Circle|Cir|Lane|Ln).*?Wetaskiwin.*?AB.*?T\d[A-Z]\s*\d[A-Z]\d)/i,
      // Pattern 2: Simple street number + street name + city
      /(\d+\s+\d+.*?(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd|Way|Place|Pl|Crescent|Cres|Circle|Cir|Lane|Ln).*?Wetaskiwin.*?AB.*?T\d[A-Z]\s*\d[A-Z]\d)/i,
      // Pattern 3: Any address with Wetaskiwin and postal code
      /(\d+.*?Wetaskiwin.*?AB.*?T\d[A-Z]\s*\d[A-Z]\d)/i
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    
    return null
  }

  private parseNameAndContact(nameContactText: string): { businessName: string; contact: string } {
    if (!nameContactText) {
      return { businessName: '', contact: '' }
    }

    const words = nameContactText.split(/\s+/)
    let businessName = ''
    let contact = ''
    
    // Look for patterns that indicate where business name ends and contact person begins
    let nameEndIndex = words.length
    
    // Strategy 1: Look for person name patterns (capitalized first and last names)
    for (let i = 0; i < words.length - 1; i++) {
      const current = words[i]
      const next = words[i + 1]
      
      // If we find what looks like a person's first and last name
      if (this.looksLikePersonName(current, next)) {
        nameEndIndex = i
        break
      }
    }
    
    // Strategy 2: Look for common business name endings
    if (nameEndIndex === words.length) {
      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        if (['Ltd', 'Inc', 'Corp', 'Co', 'LLC', 'Services', 'Service', 'Store', 'Shop'].some(suffix => 
          word.toLowerCase().includes(suffix.toLowerCase())
        )) {
          nameEndIndex = i + 1
          break
        }
      }
    }
    
    // Strategy 3: Fallback - if we have more than 6 words, assume last 2-3 might be contact
    if (nameEndIndex === words.length && words.length > 6) {
      nameEndIndex = words.length - 2
    }
    
    if (nameEndIndex < words.length) {
      businessName = words.slice(0, nameEndIndex).join(' ')
      contact = words.slice(nameEndIndex).join(' ')
    } else {
      businessName = nameContactText
    }
    
    // Clean up business name
    businessName = businessName
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add spaces between camelCase
      .replace(/\s+/g, ' ')
      .trim()
    
    return { businessName, contact: contact.trim() }
  }
  
  private looksLikePersonName(word1: string, word2: string): boolean {
    // Check if two words look like a person's name
    return word1.length >= 2 && 
           word2.length >= 2 && 
           /^[A-Z][a-z]+$/.test(word1) && 
           /^[A-Z][a-z]+$/.test(word2) &&
           !['Street', 'Avenue', 'Road', 'Drive', 'Boulevard', 'Wetaskiwin', 'Alberta', 'View', 'Map'].includes(word1) &&
           !['Street', 'Avenue', 'Road', 'Drive', 'Boulevard', 'Wetaskiwin', 'Alberta', 'View', 'Map'].includes(word2)
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
