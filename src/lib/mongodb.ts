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
    cached!.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      console.log('✅ Connected to MongoDB Atlas')
      return mongoose
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
