/* eslint-disable */
// Backup of original business scraper implementation
// This file is kept for reference only and may contain lint errors
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

  private async scrapeWithPagination(baseUrl: string): Promise<ScrapedBusiness[]> {
    const allBusinesses: ScrapedBusiness[] = []
    
    // Try the "ALL" approach first
    try {
      console.log('Trying to get all businesses at once...')
      const allUrl = `${baseUrl}?all=true`
      const businesses = await this.scrapeSinglePage(allUrl)
      if (businesses.length > 50) {
        return businesses
      }
    } catch (error) {
      console.log('All-at-once approach failed, trying pagination...')
    }

    // Try pagination approach
    for (let page = 1; page <= 60; page++) {
      try {
        const pageUrl = page === 1 ? baseUrl : `${baseUrl}?page=${page}`
        const pageBusinesses = await this.scrapeSinglePage(pageUrl)
        
        if (pageBusinesses.length === 0) {
          console.log(`No more businesses found at page ${page}`)
          break
        }
        
        allBusinesses.push(...pageBusinesses)
        console.log(`Page ${page}: Found ${pageBusinesses.length} businesses (total: ${allBusinesses.length})`)
        
        if (pageBusinesses.length < 10) break // Likely last page
        
        await new Promise(resolve => setTimeout(resolve, 1000)) // Be respectful
        
      } catch (error) {
        console.error(`Error on page ${page}:`, error)
        break
      }
    }

    return allBusinesses
  }

  private async scrapeAllAtOnce(baseUrl: string): Promise<ScrapedBusiness[]> {
    // Try different URL patterns that might show all businesses
    const urlsToTry = [
      baseUrl,
      `${baseUrl}?all`,
      `${baseUrl}?show=all`,
      `${baseUrl}?view=all`,
      `${baseUrl}?limit=1000`
    ]

    for (const url of urlsToTry) {
      try {
        console.log(`Trying URL: ${url}`)
        const businesses = await this.scrapeSinglePage(url)
        if (businesses.length > 10) {
          console.log(`Found ${businesses.length} businesses with URL: ${url}`)
          return businesses
        }
      } catch (error) {
        console.log(`Failed with URL ${url}:`, error)
      }
    }

    return []
  }

  async scrapeSinglePage(url: string): Promise<ScrapedBusiness[]> {
    const businesses: ScrapedBusiness[] = []
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (!response.ok) {
        return businesses
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Extract business entries using improved pattern matching
      const businessBlocks = this.extractBusinessBlocks(html, $)
      
      businessBlocks.forEach((block) => {
        try {
          const business = this.parseBusinessEntry(block)
          if (business && business.name && business.address) {
            // Check for duplicates
            const isDuplicate = businesses.some(existing => 
              existing.name.toLowerCase() === business.name.toLowerCase() &&
              existing.address.toLowerCase().includes(business.address.toLowerCase().substring(0, 20))
            )
            
            if (!isDuplicate) {
              businesses.push(business)
            }
          }
        } catch (error) {
          // Silently continue - parsing errors are expected
        }
      })

      return businesses

    } catch (error) {
      return businesses
    }
  }

  private extractBusinessBlocks(html: string, $: any): string[] {
    const blocks: string[] = []
    
    // Method 1: Look for the specific business listing container
    const businessListings = $('.ResourceDirectorySearchResults, .ResourceDirectoryItems, .business-listing, .directory-item')
    if (businessListings.length > 0) {
      businessListings.each((_i: number, el: any) => {
        const text = $(el).text().trim()
        if (text.length > 20 && text.includes('Wetaskiwin')) {
          blocks.push(text)
        }
      })
    }
    
    // Method 2: Look for text blocks containing business patterns
    if (blocks.length < 5) {
      $('div, p, td, li').each((_i: number, el: any) => {
        const text = $(el).text().trim()
        
        // Look for business pattern: has Wetaskiwin and an address-like pattern
        if (text.includes('Wetaskiwin') && 
            /\d{4,5}\s+\d+.*(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd)/.test(text) &&
            text.length > 30 && 
            text.length < 1000) {
          blocks.push(text)
        }
      })
    }

    // Method 3: Regex search for business entries in raw HTML
    if (blocks.length < 5) {
      console.log('Falling back to regex extraction...')
      const businessPatterns = [
        // Pattern for business entries with full info
        /([^<>\n]{20,}?(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd)[^<>\n]{5,}?Wetaskiwin[^<>\n]{5,}?AB[^<>\n]{5,})/gi,
        // Pattern for simpler business entries
        /([A-Za-z][^<>\n]{10,}?Wetaskiwin[^<>\n]{10,})/gi
      ]
      
      for (const pattern of businessPatterns) {
        const matches = html.match(pattern)
        if (matches) {
          matches.forEach(match => {
            const cleanMatch = match
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
            if (cleanMatch.length > 30 && cleanMatch.length < 500) {
              blocks.push(cleanMatch)
            }
          })
        }
        if (blocks.length >= 5) break
      }
    }
    
    console.log(`Extracted ${blocks.length} business blocks`)
    if (blocks.length > 0) {
      console.log('Sample block:', blocks[0].substring(0, 100) + '...')
    }

    return [...new Set(blocks)] // Remove duplicates
  }

  private parseBusinessEntry(text: string): ScrapedBusiness | null {
    try {
      if (text.length < 10) return null

      // Clean up the text first
      let cleanText = text
        .replace(/\[View Map[^\]]*\]/g, '') // Remove map links
        .replace(/Opens in new window/g, '') // Remove "Opens in new window"
        .replace(/Link:.*?(?=Phone:|$)/g, '') // Remove website links
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()

      // Extract phone number first
      const phoneMatch = cleanText.match(/Phone:\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i)
      const phone = phoneMatch ? phoneMatch[1].replace(/[-.\s]/g, '-') : undefined
      
      // Remove phone info from text
      if (phoneMatch) {
        cleanText = cleanText.replace(/Phone:.*$/i, '').trim()
      }

      // Now we should have: "BusinessNameContactPersonAddress"
      // Simple approach: find the street address by looking for street numbers and Wetaskiwin
      
      let addressMatch = null
      let fullAddress = ''
      
      // Method 1: Look for 4-digit street numbers (like 4502, 5116, etc)
      const streetNumberMatches = cleanText.match(/\d{4,5}/g)
      if (streetNumberMatches) {
        for (const streetNum of streetNumberMatches) {
          // Find the index of this street number
          const index = cleanText.indexOf(streetNum)
          
          // Extract everything from this street number to the end that might be an address
          const restOfText = cleanText.substring(index)
          
          // Look for Wetaskiwin and AB in this segment
          if (restOfText.includes('Wetaskiwin') && restOfText.includes('AB')) {
            // Find the end of the address (before "View Map" or other non-address text)
            let addressEnd = restOfText.indexOf('View Map')
            if (addressEnd === -1) addressEnd = restOfText.indexOf('Phone:')
            if (addressEnd === -1) addressEnd = restOfText.indexOf('Link:')
            if (addressEnd === -1) addressEnd = restOfText.length
            
            fullAddress = restOfText.substring(0, addressEnd).trim()
            
            // Basic validation - should contain street type and city
            if (fullAddress.includes('Street') || fullAddress.includes('Avenue')) {
              addressMatch = [null, fullAddress] // Simulate regex match format
              break
            }
          }
        }
      }
      
      if (!addressMatch || !addressMatch[1]) {
        // If still no address found, log and skip
        console.log('No address found for:', cleanText.substring(0, 100))
        return null
      }
      
      fullAddress = addressMatch[1].trim()
      
      // Clean up the address
      fullAddress = fullAddress
        .replace(/\?\?/g, ' ') // Replace ?? with space
        .replace(/(Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd)Wetaskiwin/gi, '$1 Wetaskiwin') // Add space between street type and city
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/,\s*,/g, ',') // Fix double commas
        .trim()
      
      // Remove the address from the text to get business name + contact
      let nameContactText = cleanText.replace(fullAddress, '').trim()
      
      // Parse business name and contact from the remaining text
      // The pattern is usually "Business NameContact Person" or "Business Name Contact Person"
      
      let businessName = ''
      let contact = ''
      
      // Try to identify where business name ends and contact person begins
      // Look for patterns like capital letter followed by lowercase (person names)
      const words = nameContactText.split(/\s+/)
      let nameEndIndex = words.length
      
      // Look for person name patterns (capitalized words that look like names)
      for (let i = 1; i < words.length - 1; i++) {
        const current = words[i]
        const next = words[i + 1]
        
        // If we find what looks like a person name pattern
        if (this.looksLikePersonName(current, next)) {
          nameEndIndex = i
          break
        }
      }
      
      // Split business name and contact
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
      
      // Validate business name
      if (!businessName || businessName.length < 2 || businessName.length > 100) {
        return null
      }
      
      // Clean up address
      const cleanAddress = fullAddress

      return {
        name: businessName,
        contact: contact.trim(),
        address: cleanAddress,
        phone: phone,
        sourceUrl: this.baseUrl + '/businessdirectoryii.aspx'
      }

    } catch (error) {
      console.error('Error parsing business entry:', error)
      return null
    }
  }
  
  private looksLikePersonName(word1: string, word2: string): boolean {
    // Check if two words look like a person's name
    return word1.length >= 2 && 
           word2.length >= 2 && 
           /^[A-Z][a-z]+$/.test(word1) && 
           /^[A-Z][a-z]+$/.test(word2) &&
           !['Street', 'Avenue', 'Road', 'Drive', 'Boulevard', 'Wetaskiwin', 'Alberta'].includes(word1) &&
           !['Street', 'Avenue', 'Road', 'Drive', 'Boulevard', 'Wetaskiwin', 'Alberta'].includes(word2)
  }

  private extractBusinessName(text: string): string {
    const cleanText = text.replace(/\s+/g, ' ').trim()
    
    // Try to find business name before contact person name
    // Look for patterns like "Business NameContact Person5123 Address"
    const patterns = [
      // Pattern 1: Business name followed by contact person and address
      /^([^0-9]+?)([A-Z][a-z]+\s+[A-Z][a-z]+)?(\d{4,5}\s+\d+)/,
      // Pattern 2: Business name until we hit an address number
      /^([^0-9]+?)(\d{4,5})/,
      // Pattern 3: Take everything before "Phone:" or contact info
      /^([^0-9]+?)(?:Phone:|tel:|Contact:)/i
    ]
    
    for (const pattern of patterns) {
      const match = cleanText.match(pattern)
      if (match && match[1]) {
        let businessName = match[1].trim()
        
        // Clean up the business name
        businessName = businessName
          .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
          .replace(/\s+/g, ' ') // Normalize spaces
          .replace(/\s+(Ltd|Inc|Corp|Co)\b/gi, ' $1') // Fix company suffixes
          .trim()
        
        if (businessName.length > 3 && businessName.length < 100) {
          return businessName
        }
      }
    }
    
    // Fallback: take first few words that look like a business name
    const words = cleanText.split(' ')
    const businessWords = []
    
    for (let i = 0; i < words.length && i < 8; i++) {
      const word = words[i]
      
      // Stop if we hit obvious address markers
      if (/^\d{4,5}$/.test(word) || word.includes('Wetaskiwin') || word.includes('Phone')) {
        break
      }
      
      businessWords.push(word)
    }
    
    let result = businessWords.join(' ').trim()
    
    // If still too messy, take a conservative approach
    if (result.length > 50 || !result) {
      result = words.slice(0, Math.min(3, words.length)).join(' ')
    }
    
    return result || 'Unknown Business'
  }

  private isLikelyPersonName(word1: string, word2: string): boolean {
    return word1.length >= 2 && 
           word2.length >= 2 && 
           /^[A-Z][a-z]+$/.test(word1) && 
           /^[A-Z][a-z]+$/.test(word2) &&
           !word1.includes('&') &&
           !word2.includes('&')
  }

  private extractContactFromText(text: string, businessName: string): string {
    // Remove the business name from the text to find contact person
    let remaining = text.replace(businessName, '').trim()
    
    // Look for contact name patterns between business name and address
    const contactPatterns = [
      // Two capitalized words together (likely person name)
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/,
      // Three words for full names
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+)\b/
    ]
    
    for (const pattern of contactPatterns) {
      const match = remaining.match(pattern)
      if (match) {
        const potentialName = match[1]
        // Make sure it's not part of an address or business name
        if (!potentialName.includes('Street') && 
            !potentialName.includes('Avenue') && 
            !potentialName.includes('Wetaskiwin') &&
            potentialName.length < 30) {
          return potentialName
        }
      }
    }
    
    return ''
  }

  private extractPhoneFromText(text: string): string | undefined {
    const patterns = [
      /Phone:\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i,
      /tel:(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i,
      /(\d{3}[-.\s]\d{3}[-.\s]\d{4})/
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1].replace(/[-.\s]/g, '-')
      }
    }

    return undefined
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
        name.includes('food') || name.includes('kitchen') || name.includes('deli')) {
      return 'restaurant'
    }
    
    if (name.includes('store') || name.includes('shop') || name.includes('boutique') ||
        name.includes('clothing') || name.includes('fashion') || name.includes('market')) {
      return 'retail'
    }
    
    if (name.includes('auto') || name.includes('car') || name.includes('garage') ||
        name.includes('tire') || name.includes('service') || name.includes('repair')) {
      return 'automotive'
    }
    
    if (name.includes('clinic') || name.includes('medical') || name.includes('health') ||
        name.includes('dental') || name.includes('pharmacy') || name.includes('wellness')) {
      return 'health'
    }
    
    if (name.includes('law') || name.includes('accounting') || name.includes('insurance') ||
        name.includes('real estate') || name.includes('financial') || name.includes('consulting')) {
      return 'professional'
    }
    
    if (name.includes('cleaning') || name.includes('plumbing') || name.includes('electrical') ||
        name.includes('construction') || name.includes('renovation') || name.includes('landscaping')) {
      return 'home-services'
    }
    
    return 'other'
  }
}
