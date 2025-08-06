/**
 * Create Admin User Script
 * 
 * This script creates an admin user for testing the business request system.
 * Run with: node create-admin-user.js
 */

const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')

// MongoDB connection string from your .env.local file
const MONGODB_URI = 'mongodb+srv://user:bh86pKotHSW5kGz4@cluster0.cpkhks1.mongodb.net/allthingswetaskiwin?retryWrites=true&w=majority&appName=Cluster0'

async function createAdminUser() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db('allthingswetaskiwin')
    const usersCollection = db.collection('users')
    
    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ 
      email: 'admin@allthingswetaskiwin.ca' 
    })
    
    if (existingAdmin) {
      console.log('Admin user already exists!')
      console.log('Email: admin@allthingswetaskiwin.ca')
      console.log('You can use this to log in to the admin dashboard')
      return
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const adminUser = {
      id: `user_${uuidv4()}`,
      email: 'admin@allthingswetaskiwin.ca',
      passwordHash: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      isEmailVerified: true,
      isActive: true,
      isSuspended: false,
      twoFactorEnabled: false,
      loginAttempts: 0,
      preferences: {
        notifications: {
          email: true,
          events: true,
          news: true,
          businessUpdates: true,
          marketing: false
        },
        privacy: {
          profileVisible: true,
          contactInfoVisible: false
        },
        theme: 'system'
      },
      businessIds: [],
      verificationStatus: 'verified',
      verificationDocuments: [],
      permissions: [
        'manage_users',
        'manage_businesses',
        'manage_content',
        'manage_scrapers',
        'view_analytics',
        'manage_payments',
        'system_settings',
        'super_admin'
      ],
      departmentAccess: ['all'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await usersCollection.insertOne(adminUser)
    
    console.log('✅ Admin user created successfully!')
    console.log('')
    console.log('🔑 Admin Login Credentials:')
    console.log('Email: admin@allthingswetaskiwin.ca')
    console.log('Password: admin123')
    console.log('')
    console.log('🚀 Next Steps:')
    console.log('1. Go to http://localhost:3000')
    console.log('2. Click Login and use the credentials above')
    console.log('3. Go to http://localhost:3000/admin')
    console.log('4. Check the Business Requests tab')
    
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await client.close()
  }
}

// Run the script
createAdminUser().catch(console.error)
