// Global teardown for Jest tests
// This ensures all async operations and database connections are properly closed

module.exports = async () => {
  // Close mongoose connections if any are still open
  const mongoose = require('mongoose')
  
  try {
    // Close all connections
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(true) // force close
    }
    
    // Disconnect all mongoose connections
    await mongoose.disconnect()
    
    console.log('✅ All database connections closed')
  } catch (error) {
    console.warn('⚠️ Error closing database connections:', error.message)
  }
  
  // Give Jest time to clean up
}
