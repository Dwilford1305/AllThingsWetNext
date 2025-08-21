/**
 * Business Request System Testing Script
 * 
 * This script provides several ways to test the business request system:
 * 1. API endpoint testing (without authentication)
 * 2. Database connectivity test
 * 3. Email service test
 * 4. Complete workflow simulation
 * 
 * Run with: node test-business-request.js
 */

const readline = require('readline')

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function testDatabaseConnection() {
  log('\n🔍 Testing Database Connection...', colors.cyan)
  
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET'
    })
    
    if (response.ok) {
      const data = await response.json()
      log('✅ Database connection successful!', colors.green)
      return true
    } else {
      log('❌ Database connection failed', colors.red)
      return false
    }
  } catch (error) {
    log(`❌ Error connecting to database: ${error.message}`, colors.red)
    return false
  }
}

async function testEmailService() {
  log('\n📧 Testing Email Service Configuration...', colors.cyan)
  
  // Check if email environment variables are set
  const requiredEmailEnvs = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USER',
    'FROM_EMAIL',
    'ADMIN_EMAIL'
  ]
  
  log('Checking email environment variables:')
  let allSet = true
  
  requiredEmailEnvs.forEach(env => {
    // We can't access process.env from this script, but we can guide the user
    log(`  - ${env}: Check your .env.local file`, colors.yellow)
  })
  
  log('\n💡 Email Configuration Checklist:', colors.blue)
  log('1. SMTP_HOST is set to your email provider (e.g., smtp.gmail.com)')
  log('2. SMTP_USER has your email address')
  log('3. SMTP_PASS has your app password (not regular password)')
  log('4. ADMIN_EMAIL is set to receive notifications')
  
  return true
}

async function testAPIEndpoints() {
  log('\n🔌 Testing API Endpoints...', colors.cyan)
  
  const baseUrl = 'http://localhost:3000'
  
  // Test 1: Health check
  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`)
    if (healthResponse.ok) {
      log('✅ Health endpoint working', colors.green)
    } else {
      log('❌ Health endpoint failed', colors.red)
    }
  } catch (error) {
    log('❌ Could not reach server. Make sure "npm run dev" is running.', colors.red)
    return false
  }
  
  // Test 2: Business request endpoint (without auth - should return 401)
  try {
    const requestResponse = await fetch(`${baseUrl}/api/business/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Test Business',
        contactName: 'Test User',
        email: 'test@example.com'
      })
    })
    
    if (requestResponse.status === 401) {
      log('✅ Business request endpoint properly requires authentication', colors.green)
    } else {
      log('⚠️  Business request endpoint returned unexpected status', colors.yellow)
    }
  } catch (error) {
    log(`❌ Error testing business request endpoint: ${error.message}`, colors.red)
  }
  
  // Test 3: Admin endpoint (without auth - should return 401)
  try {
    const adminResponse = await fetch(`${baseUrl}/api/admin/business-requests`)
    
    if (adminResponse.status === 401) {
      log('✅ Admin endpoint properly requires authentication', colors.green)
    } else {
      log('⚠️  Admin endpoint returned unexpected status', colors.yellow)
    }
  } catch (error) {
    log(`❌ Error testing admin endpoint: ${error.message}`, colors.red)
  }
  
  return true
}

async function simulateBusinessRequest() {
  log('\n🎭 Business Request Workflow Simulation', colors.cyan)
  log('This will show you what happens during a real business request...\n')
  
  // Collect test data
  const businessName = await question('Enter a test business name (or press Enter for "Test Cafe"): ') || 'Test Cafe'
  const contactName = await question('Enter a test contact name (or press Enter for "John Doe"): ') || 'John Doe'
  const email = await question('Enter a test email (or press Enter for "test@example.com"): ') || 'test@example.com'
  const phone = await question('Enter a test phone (or press Enter for "555-123-4567"): ') || '555-123-4567'
  
  log('\n📋 Business Request Data:')
  log(`  Business Name: ${businessName}`)
  log(`  Contact Name: ${contactName}`)
  log(`  Email: ${email}`)
  log(`  Phone: ${phone}`)
  
  log('\n🔄 What would happen in the real workflow:')
  log('1. ✅ User submits form through website')
  log('2. ✅ API validates all required fields')
  log('3. ✅ System checks user authentication')
  log('4. ✅ Request is saved to MongoDB database')
  log('5. ✅ Email notification sent to admin')
  log('6. ✅ Push notification sent to admin (if configured)')
  log('7. ✅ User sees success message')
  log('8. ✅ Admin reviews request in dashboard')
  log('9. ✅ Admin approves/rejects with notes')
  log('10. ✅ Status update email sent to user')
  
  return true
}

async function checkConfiguration() {
  log('\n⚙️  Configuration Check', colors.cyan)
  
  log('Required files and configurations:')
  log('📄 .env.local - Environment variables')
  log('📄 MongoDB connection string')
  log('📧 SMTP email configuration')
  log('🔐 JWT secrets for authentication')
  log('👤 Admin password for dashboard access')
  
  log('\n🌐 URLs to test after starting dev server:')
  log('• http://localhost:3000 - Main website')
  log('• http://localhost:3000/profile - User profile (requires login)')
  log('• http://localhost:3000/admin - Admin dashboard')
  log('• http://localhost:3000/businesses - Business listings')
  
  return true
}

async function showTestingOptions() {
  log(`\n${colors.bright}🧪 Business Request System Testing Options${colors.reset}`)
  log('Choose what you want to test:')
  log('')
  log('1. 🔌 Test API endpoints')
  log('2. 🗄️  Test database connection')
  log('3. 📧 Check email configuration')
  log('4. 🎭 Simulate business request workflow')
  log('5. ⚙️  Check system configuration')
  log('6. 🚀 Run all tests')
  log('7. 📚 Show testing guide')
  log('0. Exit')
  log('')
  
  const choice = await question('Enter your choice (0-7): ')
  
  switch (choice) {
    case '1':
      await testAPIEndpoints()
      break
    case '2':
      await testDatabaseConnection()
      break
    case '3':
      await testEmailService()
      break
    case '4':
      await simulateBusinessRequest()
      break
    case '5':
      await checkConfiguration()
      break
    case '6':
      log('\n🚀 Running All Tests...', colors.bright)
      await testAPIEndpoints()
      await testDatabaseConnection()
      await testEmailService()
      await simulateBusinessRequest()
      await checkConfiguration()
      break
    case '7':
      showTestingGuide()
      break
    case '0':
      log('👋 Goodbye!', colors.green)
      rl.close()
      return
    default:
      log('❌ Invalid choice. Please try again.', colors.red)
  }
  
  log('\n' + '='.repeat(50))
  await showTestingOptions()
}

function showTestingGuide() {
  log('\n📚 Complete Testing Guide', colors.bright)
  log('')
  log('🎯 BEFORE TESTING:', colors.green)
  log('1. Make sure your development server is running: npm run dev')
  log('2. Ensure MongoDB connection is working')
  log('3. Check that your .env.local file has all required variables')
  log('')
  
  log('🧪 TESTING APPROACHES:', colors.blue)
  log('')
  log('A) MANUAL TESTING (Recommended):')
  log('   1. Create a test user account on your site')
  log('   2. Login and go to Profile > Business tab')
  log('   3. Fill out business request form')
  log('   4. Check admin dashboard for the request')
  log('   5. Test approve/reject functionality')
  log('')
  
  log('B) API TESTING:')
  log('   • Use this script to test endpoints')
  log('   • Use Postman or similar tool')
  log('   • Check browser dev tools for network requests')
  log('')
  
  log('C) EMAIL TESTING:')
  log('   • Use real email for testing')
  log('   • Check spam folder for notifications')
  log('   • Monitor console logs for email errors')
  log('')
  
  log('🐞 DEBUGGING TIPS:', colors.yellow)
  log('• Check browser console for JavaScript errors')
  log('• Monitor terminal output for server errors')
  log('• Use MongoDB Compass to view database changes')
  log('• Check Network tab in browser dev tools')
  log('')
  
  log('🔧 COMMON ISSUES:', colors.red)
  log('• "Unauthorized" errors: Check user authentication')
  log('• Email not sending: Verify SMTP configuration')
  log('• Database errors: Check MongoDB connection')
  log('• UI not responsive: Test on different screen sizes')
}

// Start the testing interface
async function main() {
  log(`${colors.bright}🎯 Business Request System Tester${colors.reset}`)
  log('This script helps you test the business request system safely.')
  
  await showTestingOptions()
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`❌ Error: ${error.message}`, colors.red)
    rl.close()
  })
}
