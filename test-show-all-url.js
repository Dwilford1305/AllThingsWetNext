import * as cheerio from 'cheerio'

// Test function to validate the show all URL approach
async function testShowAllUrl() {
  console.log('Testing show all URL approach...')
  
  const baseUrl = 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
  const showAllUrl = baseUrl + '?ysnShowAll=1'
  
  try {
    const response = await fetch(showAllUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch: ${response.status}`)
      return
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Count business listing rows
    const businessRows = $('.listItemsRow, .alt.listItemsRow')
    console.log(`Found ${businessRows.length} business listing rows`)
    
    if (businessRows.length > 0) {
      console.log('\nFirst few business entries:')
      businessRows.slice(0, 5).each((i, el) => {
        const text = $(el).text().trim()
        if (text.length > 20 && text.includes('Wetaskiwin')) {
          console.log(`\n${i + 1}. ${text.substring(0, 100)}...`)
        }
      })
    }
    
    // Check if we got all businesses (should be around 600)
    if (businessRows.length > 500) {
      console.log('\n✅ Successfully retrieved all businesses!')
    } else if (businessRows.length > 50) {
      console.log('\n⚠️ Got some businesses but possibly not all')
    } else {
      console.log('\n❌ Got very few businesses, something might be wrong')
    }
    
  } catch (error) {
    console.error('Error testing show all URL:', error)
  }
}

testShowAllUrl()
