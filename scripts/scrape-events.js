#!/usr/bin/env node

const { ScraperService } = require('../src/lib/scraperService')

async function runScrapers() {
  console.log('Starting event scrapers...')
  
  try {
    const scraperService = new ScraperService()
    
    // Clear seed data
    console.log('Clearing seed data...')
    const clearedCount = await scraperService.clearSeedData()
    console.log(`Cleared ${clearedCount} seed events`)
    
    // Run scrapers
    console.log('Running scrapers...')
    const results = await scraperService.scrapeAllEvents()
    
    console.log('\n=== SCRAPING RESULTS ===')
    console.log(`Total events found: ${results.total}`)
    console.log(`New events: ${results.new}`)
    console.log(`Updated events: ${results.updated}`)
    console.log(`Errors: ${results.errors.length}`)
    
    if (results.errors.length > 0) {
      console.log('\nErrors:')
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }
    
    console.log('\nScraping completed successfully!')
    process.exit(0)
    
  } catch (error) {
    console.error('Failed to run scrapers:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  runScrapers()
}

module.exports = { runScrapers }
