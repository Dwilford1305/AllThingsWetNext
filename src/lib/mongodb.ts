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
    if (process.env.NODE_ENV === 'test') {
      // Provide a lightweight mock so schema inspection tests can proceed
      // without requiring a live database connection.
      // We attach mongoose models to an in-memory connection substitute.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mock: any = mongoose;
  cached!.conn = mock as typeof mongoose;
  return cached!.conn as typeof mongoose;
    }
    throw new Error('MONGODB_URI is not defined')
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      // Add these for better reliability
      connectTimeoutMS: 10000, // How long to wait before timing out a connection attempt
      heartbeatFrequencyMS: 30000, // How often to check the connection
      maxIdleTimeMS: 30000, // How long a connection can be idle before being closed
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
