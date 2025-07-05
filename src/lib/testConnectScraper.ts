import { ConnectWetaskiwinScraper } from './scrapers'

async function testConnectWetaskiwinScraper() {
  console.log('=== TESTING CONNECT WETASKIWIN SCRAPER ===\n')
  
  try {
    const scraper = new ConnectWetaskiwinScraper()
    const events = await scraper.scrape()
    
    console.log(`\nFound ${events.length} events from Connect Wetaskiwin:`)
    
    events.forEach((event, i) => {
      console.log(`\n${i + 1}. ${event.title}`)
      console.log(`   Date: ${event.date.toDateString()} at ${event.time}`)
      console.log(`   Location: ${event.location}`)
      console.log(`   Category: ${event.category}`)
      console.log(`   Description: ${event.description.substring(0, 100)}...`)
      console.log(`   Source: ${event.sourceUrl}`)
      console.log(`   Website: ${event.website || 'N/A'}`)
    })
    
    if (events.length === 0) {
      console.log('\n❌ No events found - this suggests the scraper needs debugging')
    } else {
      console.log('\n✅ Connect Wetaskiwin scraper is working!')
    }
    
  } catch (error) {
    console.error('❌ Error testing Connect Wetaskiwin scraper:', error)
  }
}

testConnectWetaskiwinScraper()
