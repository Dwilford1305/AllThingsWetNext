import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET(_request: NextRequest) {
  try {
    console.log('=== ANALYZING WETASKIWIN BUSINESS DIRECTORY HTML STRUCTURE ===')
    
    const url = 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    console.log(`Content length: ${html.length}`)
    
    // Look for pagination info
    const bodyText = $('body').text()
    const paginationMatch = bodyText.match(/(\d+)\s*-\s*(\d+)\s*of\s*(\d+)\s*Listings/i)
    
    // Find table structures
    const tables: any[] = []
    $('table').each((index, table) => {
      const $table = $(table)
      const rows = $table.find('tr')
      if (rows.length > 1) {
        const tableInfo = {
          index: index + 1,
          rows: rows.length,
          sampleRows: [] as string[]
        }
        
        // Get first few rows
        rows.slice(0, 3).each((rowIndex, row) => {
          const $row = $(row)
          const cellTexts = $row.find('td').map((i, cell) => $(cell).text().trim()).get()
          if (cellTexts.length > 0 && cellTexts.some(cell => cell.length > 10)) {
            tableInfo.sampleRows.push(cellTexts.join(' | '))
          }
        })
        
        if (tableInfo.sampleRows.length > 0) {
          tables.push(tableInfo)
        }
      }
    })
    
    // Look for business patterns in raw text
    const businessPatterns = [
      // Pattern for business entries with phone and address
      /([A-Za-z0-9\s&'-]+?)([A-Z][a-z]+\s+[A-Z][a-z]+)?(\d{4,5}\s+\d+[^,]*(?:Street|Avenue|Ave|St|Road|Rd)[^,]*Wetaskiwin[^,]*AB[^,]*T\d[A-Z]\d\s*[A-Z0-9]\d)/g,
      // Simpler pattern
      /([^<>\n]{20,}?)(\d{4,5}\s+\d+[^,]*(?:Street|Avenue)[^,]*Wetaskiwin)/g
    ]
    
    const matches: string[] = []
    for (const pattern of businessPatterns) {
      const found = html.match(pattern)
      if (found && found.length > 0) {
        matches.push(...found.slice(0, 5))
        break
      }
    }
    
    // Look for specific div containers that might contain listings
    const potentialContainers: string[] = []
    $('div, td, p').each((index, element) => {
      const $el = $(element)
      const text = $el.text().trim()
      
      // Look for business-like content
      if (text.includes('Wetaskiwin') && 
          text.includes('AB') && 
          (text.includes('Street') || text.includes('Avenue')) &&
          text.length > 50 && 
          text.length < 500) {
        potentialContainers.push(text.substring(0, 200))
      }
    })
    
    // Look for navigation links
    const navLinks: any[] = []
    $('a').each((index, link) => {
      const $link = $(link)
      const href = $link.attr('href')
      const text = $link.text().trim().toLowerCase()
      
      if ((text.includes('next') || text.includes('previous') || text.match(/\d+/) || href?.includes('page')) && href) {
        navLinks.push({
          text: $link.text().trim(),
          href: href
        })
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        contentLength: html.length,
        pagination: paginationMatch ? {
          start: paginationMatch[1],
          end: paginationMatch[2],
          total: paginationMatch[3]
        } : null,
        tables: tables,
        businessMatches: matches,
        potentialContainers: potentialContainers.slice(0, 5),
        navigationLinks: navLinks.slice(0, 10),
        // Raw HTML sample (first 2000 chars)
        htmlSample: html.substring(0, 2000)
      }
    })
  } catch (error) {
    console.error('HTML Analysis error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to analyze HTML',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
