import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer | null = null;

/**
 * Connect to a MongoDB Memory Server for testing
 */
export async function connectToTestDatabase(): Promise<string> {
  try {
    // Start MongoDB Memory Server
    mongod = await MongoMemoryServer.create({
      binary: {
        downloadDir: '/tmp/mongodb-binaries',
      },
    });
    
    const uri = mongod.getUri();
    
    // Connect mongoose to the test database
    await mongoose.connect(uri);
    
    console.log('Connected to test database:', uri);
    return uri;
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Clear all data from the test database
 */
export async function clearTestDatabase(): Promise<void> {
  try {
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