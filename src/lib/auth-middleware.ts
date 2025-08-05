import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { User, UserSession } from '@/models/auth'
import type { User as UserType } from '@/types/auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: Partial<UserType>
  session?: Record<string, unknown>
}

// Type guard to check if partial user has required fields for permission checking
function isValidUserForPermissions(user: Partial<UserType> | undefined): user is UserType {
  return !!(user && user.id && user.role && 'permissions' in user)
}

// Type guard to check if partial user has required fields for business access
function isValidUserForBusiness(user: Partial<UserType> | undefined): user is UserType {
  return !!(user && user.id && user.role)
}

// Middleware to authenticate requests
export async function authenticate(request: NextRequest) {
  try {
    await connectDB()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No authorization header found', status: 401 }
    }

    const token = authHeader.substring(7)
    const decoded = AuthService.verifyAccessToken(token)
    
    // Check if session exists and is active
    const session = await UserSession.findOne({
      accessToken: token,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })

    if (!session) {
      return { error: 'Invalid or expired session', status: 401 }
    }

    // Get user from database
    const user = await User.findOne({ id: decoded.userId, isActive: true })
    if (!user) {
      return { error: 'User not found or inactive', status: 401 }
    }

    // Update session last used time
    await UserSession.updateOne(
      { _id: session._id },
      { lastUsedAt: new Date() }
    )

    return { 
      user: AuthService.sanitizeUser(user.toObject()),
      session: session.toObject()
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Authentication failed', status: 401 }
  }
}

// Middleware to check user role permissions
export async function authorizeRole(
  request: NextRequest, 
  allowedRoles: string[]
) {
  const authResult = await authenticate(request)
  
  if (authResult.error) {
    return authResult
  }

  const { user } = authResult
  
  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    return { error: 'Insufficient permissions', status: 403 }
  }

  return authResult
}

// Middleware to check specific permissions
export async function authorizePermission(
  request: NextRequest,
  requiredPermission: string
) {
  const authResult = await authenticate(request)
  
  if (authResult.error) {
    return authResult
  }

  const { user } = authResult

  if (!isValidUserForPermissions(user) || !AuthService.hasPermission(user, requiredPermission)) {
    return { error: 'Insufficient permissions', status: 403 }
  }

  return authResult
}

// Middleware to check business ownership
export async function authorizeBusiness(
  request: NextRequest,
  businessId: string
) {
  const authResult = await authenticate(request)
  
  if (authResult.error) {
    return authResult
  }

  const { user } = authResult

  if (!isValidUserForBusiness(user) || !AuthService.canAccessBusiness(user, businessId)) {
    return { error: 'Access denied to this business', status: 403 }
  }

  return authResult
}

// Helper function to handle auth errors in API routes
export function handleAuthError(error: { error?: string; status?: number }) {
  return NextResponse.json(
    { success: false, error: error.error || 'Authentication failed' },
    { status: error.status || 500 }
  )
}

// Wrapper for API routes that require authentication
export function withAuth(handler: (request: AuthenticatedRequest, context?: Record<string, unknown>) => Promise<Response>) {
  return async (request: NextRequest, context?: Record<string, unknown>) => {
    const authResult = await authenticate(request)
    
    if (authResult.error) {
      return handleAuthError(authResult)
    }

    // Add user and session to request
    ;(request as AuthenticatedRequest).user = authResult.user
    ;(request as AuthenticatedRequest).session = authResult.session

    return handler(request as AuthenticatedRequest, context)
  }
}

// Wrapper for API routes that require specific roles
export function withRole(allowedRoles: string[], handler: (request: AuthenticatedRequest, context?: Record<string, unknown>) => Promise<Response>) {
  return async (request: NextRequest, context?: Record<string, unknown>) => {
    const authResult = await authorizeRole(request, allowedRoles)
    
    if (authResult.error) {
      return handleAuthError(authResult)
    }

    ;(request as AuthenticatedRequest).user = authResult.user
    ;(request as AuthenticatedRequest).session = authResult.session

    return handler(request as AuthenticatedRequest, context)
  }
}

// Wrapper for API routes that require specific permissions
export function withPermission(requiredPermission: string, handler: (request: AuthenticatedRequest, context?: Record<string, unknown>) => Promise<Response>) {
  return async (request: NextRequest, context?: Record<string, unknown>) => {
    const authResult = await authorizePermission(request, requiredPermission)
    
    if (authResult.error) {
      return handleAuthError(authResult)
    }

    ;(request as AuthenticatedRequest).user = authResult.user
    ;(request as AuthenticatedRequest).session = authResult.session

    return handler(request as AuthenticatedRequest, context)
  }
}
