import { NextRequest, NextResponse } from 'next/server'
import { WetaskiwinBusinessScraper } from '@/lib/scrapers/wetaskiwinBusiness'
import * as cheerio from 'cheerio'

export async function GET(_request: NextRequest) {
  try {
    const scraper = new WetaskiwinBusinessScraper()
    const businesses = await scraper.scrapeBusinessPage('https://www.wetaskiwin.ca/businessdirectoryii.aspx')
    
    // Get raw extracted blocks for debugging
    const response = await fetch('https://www.wetaskiwin.ca/businessdirectoryii.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Extract raw business blocks for debugging
    const blocks: string[] = []
    $('div, p, td, li').each((_i: number, el) => {
      const text = $(el).text().trim()
      
      if (text.includes('Wetaskiwin') && 
          /\d{4,5}\s+\d+.*(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd)/.test(text) &&
          text.length > 30 && 
          text.length < 1000) {
        blocks.push(text)
      }
    })
    
    // Test parsing on first few blocks
    const parseTest = blocks.slice(0, 3).map(block => {
      try {
        // Simulate the parsing logic
        let cleanText = block
          .replace(/\[View Map[^\]]*\]/g, '')
          .replace(/Opens in new window/g, '')
          .replace(/Link:.*?(?=Phone:|$)/g, '')
          .replace(/\s+/g, ' ')
          .trim()

        // Extract phone
        const phoneMatch = cleanText.match(/Phone:\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i)
        const phone = phoneMatch ? phoneMatch[1] : 'NO_PHONE'
        
        // Remove phone from text
        if (phoneMatch) {
          cleanText = cleanText.replace(/Phone:.*$/i, '').trim()
        }

        // Look for address
        const addressPattern = /(#?\d+[^,]*,?\s*\d{4,5}\s+[^,]*(?:Street|Avenue|Ave|St|Road|Rd|Drive|Dr|Boulevard|Blvd)[^,]*,?\s*Wetaskiwin[^,]*AB[^,]*[T]?\d?[A-Z]?\d?[A-Z]?\d?)/i
        const addressMatch = cleanText.match(addressPattern)
        const address = addressMatch ? addressMatch[1] : 'NO_ADDRESS'
        
        return {
          original: block.substring(0, 200),
          cleaned: cleanText.substring(0, 200),
          phone: phone,
          address: address.substring(0, 100),
          hasAddress: !!addressMatch
        }
      } catch (error) {
        return {
          original: block.substring(0, 200),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        scrapedCount: businesses.length,
        totalBlocks: blocks.length,
        sampleBlocks: blocks.slice(0, 3).map(b => b.substring(0, 150)),
        parseTest
      }
    })
  } catch (error) {
    console.error('Debug parse error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to debug parse',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
