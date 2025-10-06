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
  
  // Stop cache cleanup interval to prevent open handles
  try {
    const { stopCacheCleanup } = require('../src/lib/cache')
    stopCacheCleanup()
    console.log('✅ Cache cleanup interval stopped')
  } catch (error) {
    console.warn('⚠️ Error stopping cache cleanup:', error.message)
  }
  
  // Give Jest time to clean up
}
