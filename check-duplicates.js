// Script to check for duplicate businesses in the database
const { connectDB } = require('./src/lib/mongodb')
const { Business } = require('./src/models')

async function checkDuplicates() {
  try {
    await connectDB()
    
    console.log('Checking for duplicate businesses...')
    
    // Get all businesses and group by name
    const allBusinesses = await Business.find({}).select('id name address')
    console.log(`Total businesses in database: ${allBusinesses.length}`)
    
    // Check for duplicates by name
    const nameGroups = {}
    allBusinesses.forEach(business => {
      const key = business.name.toLowerCase().trim()
      if (!nameGroups[key]) {
        nameGroups[key] = []
      }
      nameGroups[key].push(business)
    })
    
    // Find duplicates
    const duplicates = Object.entries(nameGroups).filter(([name, businesses]) => businesses.length > 1)
    
    console.log(`Found ${duplicates.length} business names with duplicates:`)
    duplicates.slice(0, 10).forEach(([name, businesses]) => {
      console.log(`\n"${name}" (${businesses.length} entries):`)
      businesses.forEach(b => console.log(`  - ${b.id}: ${b.address}`))
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkDuplicates()
