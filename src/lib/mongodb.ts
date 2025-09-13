import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

// During build time on Vercel, environment variables should be available
// but let's be more defensive about it
if (!MONGODB_URI && process.env.NODE_ENV !== 'test') {
  console.error('Missing MONGODB_URI environment variable')
  if (process.env.VERCEL_ENV === 'production') {
    throw new Error('MONGODB_URI environment variable is required in production')
  }
}

interface GlobalMongoose {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Use globalThis for better compatibility
declare const globalThis: {
  mongoose: GlobalMongoose | undefined
}

let cached = globalThis.mongoose

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null }
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined')
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      // Connection pool settings for better performance
      maxPoolSize: 20, // Increased from 10 for better concurrent handling
      minPoolSize: 5, // Maintain minimum connections
      maxIdleTimeMS: 30000, // How long a connection can be idle before being closed
      // Timeout settings optimized for performance
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // How long to wait before timing out a connection attempt
      heartbeatFrequencyMS: 30000, // How often to check the connection
      // Performance optimizations
      retryWrites: true, // Retry write operations on transient network errors
      readPreference: 'primary' as const // Read from primary for consistency
    };

    console.log('Attempting to connect to MongoDB...')
    cached!.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
      console.log('✅ Connected to MongoDB Atlas')
      // Optional: ping to ensure server is ready
      try {
        const db = mongooseInstance.connection.db
        if (db) {
          await db.admin().ping()
          console.log('✅ MongoDB ping successful')
        }
      } catch (e) {
        console.warn('⚠️ MongoDB ping failed (continuing):', e)
      }
      return mongooseInstance
    }).catch((error) => {
      console.error('❌ MongoDB connection failed:', error)
      cached!.promise = null
      throw error
    })
  }

  try {
    cached!.conn = await cached!.promise
  } catch (e) {
    cached!.promise = null
    console.error('❌ MongoDB connection error:', e)
    throw e
  }

  return cached!.conn
}

export { connectDB }
