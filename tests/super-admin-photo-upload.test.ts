import { NextRequest } from 'next/server'

// Mock the dependencies
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/models', () => ({
  Business: {
    findOne: jest.fn(),
    updateOne: jest.fn()
  },
  BusinessAd: {
    findOneAndUpdate: jest.fn()
  },
  User: {
    findOne: jest.fn()
  }
}))

jest.mock('@/lib/auth', () => ({
  AuthService: {
    verifyAccessToken: jest.fn()
  }
}))

// Mock the auth middleware to inject user into request
jest.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: Function) => {
    return async (request: NextRequest) => {
      // Extract user info from Authorization header for tests
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return Response.json(
          { success: false, error: 'Not authenticated' },
          { status: 401 }
        )
      }
      
      // Create an authenticated request with user property
      const authenticatedRequest = request as any
      authenticatedRequest.user = { id: 'test-user-id' } // Fallback value; typically overridden by specific test values in test setup
      
      return handler(authenticatedRequest)
    }
  }
}))

import { POST } from '@/app/api/businesses/photos/route'
import { Business, BusinessAd, User } from '@/models'
import { AuthService } from '@/lib/auth'

describe('Super Admin Photo Upload API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow super admin to upload photos to any business', async () => {
    // Mock super admin user
    const mockUser = {
      id: 'super-admin-123',
      role: 'super_admin',
      email: 'admin@example.com'
    }

    // Mock business (not owned by super admin)
    const mockBusiness = {
      id: 'test-business-123',
      name: 'Test Business',
      subscriptionTier: 'free', // Even free tier should work for super admin
      claimedByUserId: 'different-user-456',
      photos: []
    }

    // Setup mocks
    ;(AuthService.verifyAccessToken as jest.Mock).mockReturnValue({
      userId: 'super-admin-123'
    })
    ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
    ;(Business.findOne as jest.Mock).mockResolvedValue(mockBusiness)
    ;(Business.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 })
    ;(BusinessAd.findOneAndUpdate as jest.Mock).mockResolvedValue({})

    // Create a mock FormData with a test file
    const mockFile = new File(['test image content'], 'test.jpg', { 
      type: 'image/jpeg',
      size: 1024 * 1024 // 1MB
    })

    const formData = new FormData()
    formData.append('businessId', 'test-business-123')
    formData.append('photo', mockFile)

    // Create mock request with user property (injected by withAuth mock)
    const mockRequest = {
      method: 'POST',
      headers: new Headers({
        'authorization': 'Bearer mock-token',
        'x-csrf-token': 'test-csrf-token'
      }),
      cookies: {
        get: (name: string) => name === 'csrfToken' ? { value: 'test-csrf-token' } : undefined
      },
      formData: () => Promise.resolve(formData),
      user: { id: 'super-admin-123' } // User injected by withAuth middleware
    } as unknown as NextRequest

    // Call the API
    const response = await POST(mockRequest)
    const result = await response.json()

    // Assertions
    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Photo uploaded successfully')
    
    // Verify super admin can access any business
    expect(Business.findOne).toHaveBeenCalledWith({ id: 'test-business-123' })
    
    // Verify photo was added to business
    expect(Business.updateOne).toHaveBeenCalledWith(
      { id: 'test-business-123' },
      expect.objectContaining({
        photos: expect.arrayContaining([expect.stringContaining('data:image/jpeg;base64,')]),
        updatedAt: expect.any(Date)
      })
    )

    // Verify business ad was created with platinum tier for super admin
    expect(BusinessAd.findOneAndUpdate).toHaveBeenCalledWith(
      { businessId: 'test-business-123', tier: 'platinum' },
      expect.objectContaining({
        tier: 'platinum',
        businessId: 'test-business-123',
        adSize: { width: 336, height: 280 } // Platinum dimensions
      }),
      { upsert: true, new: true }
    )
  })

  it('should deny regular user access to business they do not own', async () => {
    // Mock regular user
    const mockUser = {
      id: 'regular-user-123',
      role: 'user',
      email: 'user@example.com'
    }

    // Setup mocks
    ;(AuthService.verifyAccessToken as jest.Mock).mockReturnValue({
      userId: 'regular-user-123'
    })
    ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
    ;(Business.findOne as jest.Mock).mockResolvedValue(null) // Business not found for regular user

    // Create mock FormData
    const mockFile = new File(['test image content'], 'test.jpg', { 
      type: 'image/jpeg',
      size: 1024 * 1024
    })

    const formData = new FormData()
    formData.append('businessId', 'test-business-123')
    formData.append('photo', mockFile)

    const mockRequest = {
      method: 'POST',
      headers: new Headers({
        'authorization': 'Bearer mock-token',
        'x-csrf-token': 'test-csrf-token'
      }),
      cookies: {
        get: (name: string) => name === 'csrfToken' ? { value: 'test-csrf-token' } : undefined
      },
      formData: () => Promise.resolve(formData),
      user: { id: 'regular-user-123' } // User injected by withAuth middleware
    } as unknown as NextRequest

    // Call the API
    const response = await POST(mockRequest)
    const result = await response.json()

    // Assertions
    expect(response.status).toBe(404)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Business not found or not owned by user')
    
    // Verify regular user can only access businesses they own
    expect(Business.findOne).toHaveBeenCalledWith({ 
      id: 'test-business-123',
      claimedByUserId: 'regular-user-123'
    })
  })

  it('should reject upload without authentication', async () => {
    const mockRequest = {
      method: 'POST',
      headers: new Headers({
        'x-csrf-token': 'test-csrf-token'
      }), // No authorization header
      cookies: {
        get: (name: string) => name === 'csrfToken' ? { value: 'test-csrf-token' } : undefined
      },
      formData: () => Promise.resolve(new FormData())
    } as unknown as NextRequest

    const response = await POST(mockRequest)
    const result = await response.json()

    expect(response.status).toBe(401)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })
})