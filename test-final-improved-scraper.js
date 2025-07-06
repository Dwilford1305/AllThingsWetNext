const { WetaskiwinBusinessScraper } = require('./src/lib/scrapers/wetaskiwinBusiness.js')

async function testImprovedScraper() {
  console.log('Testing improved business scraper...')
  
  const scraper = new WetaskiwinBusinessScraper()
  const businesses = await scraper.scrapeBusinessPage('https://www.wetaskiwin.ca/businessdirectoryii.aspx')
  
  console.log(`\nTotal businesses scraped: ${businesses.length}`)
  
  if (businesses.length > 0) {
    console.log('\nFirst 5 businesses:')
    businesses.slice(0, 5).forEach((business, index) => {
      console.log(`\n${index + 1}. ${business.name}`)
      console.log(`   Contact: ${business.contact}`)
      console.log(`   Address: ${business.address}`)
      console.log(`   Phone: ${business.phone || 'N/A'}`)
      console.log(`   Category: ${business.category || 'N/A'}`)
    })
    
    console.log('\nCategories distribution:')
    const categories = {}
    businesses.forEach(business => {
      const cat = business.category || 'uncategorized'
      categories[cat] = (categories[cat] || 0) + 1
    })
    
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`)
    })
    
    // Check for duplicates
    const names = businesses.map(b => b.name.toLowerCase().trim())
    const uniqueNames = new Set(names)
    console.log(`\nDuplicate check: ${names.length} total, ${uniqueNames.size} unique`)
    if (names.length !== uniqueNames.size) {
      console.log(`Found ${names.length - uniqueNames.size} potential duplicates`)
    }
  }
}

testImprovedScraper().catch(console.error)
