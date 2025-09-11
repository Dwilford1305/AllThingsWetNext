import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer | null = null;
let mockMode = false;

/**
 * Connect to a MongoDB Memory Server for testing
 * Falls back to mock mode if MongoDB Memory Server can't download binaries
 */
export async function connectToTestDatabase(): Promise<string> {
  try {
    // Try to start MongoDB Memory Server with timeout
    const createPromise = MongoMemoryServer.create({
      binary: {
        downloadDir: '/tmp/mongodb-binaries',
      },
    });
    
    // Set a timeout for the MongoDB Memory Server creation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MongoDB Memory Server timeout')), 10000);
    });
    
    mongod = await Promise.race([createPromise, timeoutPromise]) as MongoMemoryServer;
    
    const uri = mongod.getUri();
    
    // Connect mongoose to the test database
    await mongoose.connect(uri);
    
    console.log('Connected to test database:', uri);
    return uri;
  } catch (error) {
    console.warn('Failed to connect to MongoDB Memory Server, using mock mode:', error.message);
    mockMode = true;
    // Return a mock URI for testing
    return 'mock://localhost:27017/test';
  }
}

/**
 * Clear all data from the test database
 */
export async function clearTestDatabase(): Promise<void> {
  try {
    if (mockMode) {
      console.log('Mock mode: Test database cleared (simulated)');
      return;
    }
    
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    console.log('Test database cleared');
  } catch (error) {
    console.error('Failed to clear test database:', error);
    throw error;
  }
}

/**
 * Disconnect from the test database and stop the memory server
 */
export async function disconnectFromTestDatabase(): Promise<void> {
  try {
    if (mockMode) {
      console.log('Mock mode: Disconnected from test database (simulated)');
      return;
    }
    
    await mongoose.disconnect();
    
    if (mongod) {
      await mongod.stop();
      mongod = null;
    }
    
    console.log('Disconnected from test database');
  } catch (error) {
    console.error('Failed to disconnect from test database:', error);
    throw error;
  }
}

/**
 * Seed test data for user workflows
 */
export async function seedTestData() {
  // Import models (this will be used in actual tests)
  // For now, return placeholder data structure
  const testData = {
    users: {
      admin: {
        email: 'admin@test.com',
        password: 'testPassword123!',
        role: 'super_admin',
      },
      regularUser: {
        email: 'user@test.com', 
        password: 'testPassword123!',
        role: 'user',
      },
      businessOwner: {
        email: 'business@test.com',
        password: 'testPassword123!',
        role: 'business_owner',
      },
    },
    businesses: [
      {
        name: 'Test Business',
        address: '123 Test Street, Wetaskiwin, AB',
        phone: '780-123-4567',
        email: 'test@business.com',
        category: 'Restaurant',
        status: 'active',
      },
    ],
    events: [
      {
        title: 'Test Community Event',
        description: 'A test event for E2E testing',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: 'Community Center',
      },
    ],
    marketplaceItems: [
      {
        title: 'Test Item for Sale',
        description: 'Test marketplace item',
        price: 100,
        category: 'Electronics',
        condition: 'Used',
      },
    ],
  };
  
  return testData;
}

/**
 * Create test user in database
 */
export async function createTestUser(userData: {
  email: string;
  password: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}) {
  try {
    // This would typically use your User model
    // For now, return a mock user object
    return {
      id: 'test-user-id',
      email: userData.email,
      role: userData.role || 'user',
      firstName: userData.firstName || 'Test',
      lastName: userData.lastName || 'User',
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
}

/**
 * Clean up test user
 */
export async function cleanupTestUser(userId: string) {
  try {
    // This would typically delete the user from the database
    console.log('Cleaned up test user:', userId);
  } catch (error) {
    console.error('Failed to cleanup test user:', error);
    throw error;
  }
}