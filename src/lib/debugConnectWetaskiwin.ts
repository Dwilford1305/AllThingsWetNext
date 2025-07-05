import { ConnectWetaskiwinScraper } from './scrapers'
import * as cheerio from 'cheerio'
import axios from 'axios'

async function debugConnectWetaskiwin() {
  console.log('=== DEBUGGING CONNECT WETASKIWIN SCRAPER ===\n')
  
  try {
    // First, let's fetch the page manually and see what we get
    console.log('1. Fetching page directly...')
    const response = await axios.get('https://www.connectwetaskiwin.com/calendar-of-events.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    })
    
    console.log(`Status: ${response.status}`)
    console.log(`Content length: ${response.data.length}`)
    
    // Parse with cheerio
    const $ = cheerio.load(response.data)
    
    console.log('\n2. Analyzing page structure...')
    
    // Check the page title
    console.log(`Page title: ${$('title').text()}`)
    
    // Look for any div or container elements
    console.log(`\nTotal div elements: ${$('div').length}`)
    console.log(`Total p elements: ${$('p').length}`)
    console.log(`Total span elements: ${$('span').length}`)
    console.log(`Total table elements: ${$('table').length}`)
    
    // Look for common calendar-related classes or IDs
    const calendarSelectors = [
      '.calendar',
      '.event',
      '.events',
      '#calendar',
      '#events',
      '[class*="calendar"]',
      '[class*="event"]',
      '[id*="calendar"]',
      '[id*="event"]'
    ]
    
    console.log('\n3. Looking for calendar-related elements...')
    calendarSelectors.forEach(selector => {
      const elements = $(selector)
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`)
        elements.each((i, el) => {
          const text = $(el).text().trim()
          if (text.length > 0 && text.length < 200) {
            console.log(`  - ${text.substring(0, 100)}...`)
          }
        })
      }
    })
    
    // Look for any text that contains date-like patterns
    console.log('\n4. Looking for date patterns...')
    const allText = $('body').text()
    const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}/gi
    const dates = allText.match(datePattern)
    if (dates) {
      console.log(`Found potential dates: ${dates.slice(0, 10).join(', ')}`)
    }
    
    // Look for any script tags that might load content dynamically
    console.log('\n5. Checking for JavaScript...')
    const scripts = $('script')
    console.log(`Found ${scripts.length} script tags`)
    
    scripts.each((i, script) => {
      const src = $(script).attr('src')
      const content = $(script).html()
      if (src) {
        console.log(`  Script src: ${src}`)
      }
      if (content && content.includes('calendar') || content && content.includes('event')) {
        console.log(`  Script mentions calendar/event: ${content.substring(0, 100)}...`)
      }
    })
    
    // Now let's try the actual scraper
    console.log('\n6. Running the actual scraper...')
    const scraper = new ConnectWetaskiwinScraper()
    const events = await scraper.scrape()
    
    console.log(`Scraper found ${events.length} events`)
    events.forEach((event, i) => {
      console.log(`  ${i + 1}. ${event.title} - ${event.date.toDateString()}`)
    })
    
    // Let's also check if there are any iframes
    console.log('\n7. Checking for iframes...')
    const iframes = $('iframe')
    console.log(`Found ${iframes.length} iframes`)
    iframes.each((i, iframe) => {
      const src = $(iframe).attr('src')
      console.log(`  Iframe src: ${src}`)
    })
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

// Export for use in API or direct execution
export { debugConnectWetaskiwin }

// If running directly
if (require.main === module) {
  debugConnectWetaskiwin()
}
