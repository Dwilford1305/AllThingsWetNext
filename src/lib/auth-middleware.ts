import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0/edge'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/auth'
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

// Helper function to sanitize user data for client response (remove sensitive fields)
function sanitizeUser(user: Record<string, unknown>): Partial<UserType> {
  const {
    passwordHash: _passwordHash,
    passwordResetToken: _passwordResetToken,
    passwordResetTokenExpires: _passwordResetTokenExpires,
    emailVerificationToken: _emailVerificationToken,
    emailVerificationTokenExpires: _emailVerificationTokenExpires,
    twoFactorSecret: _twoFactorSecret,
    loginAttempts: _loginAttempts,
    lockUntil: _lockUntil,
    ...sanitizedUser
  } = user

  return sanitizedUser as Partial<UserType>
}

// Middleware to authenticate requests using Auth0 only
export async function authenticate(request: NextRequest) {
  try {
    await connectDB()

    // Use Auth0 session from cookies (App Router)
    try {
      const res = new NextResponse()
      const auth0 = await getSession(request, res)
      const auth0User = auth0?.user as { email?: string } | undefined
      if (!auth0User?.email) {
        return { error: 'Not authenticated', status: 401 }
      }

      const dbUser = await User.findOne({ email: auth0User.email, isActive: true })
      if (!dbUser) {
        // Authenticated via Auth0 but no local user record: treat as basic user
        return {
          user: {
            email: auth0User.email,
            role: 'user'
          } as Partial<UserType>,
          session: { provider: 'auth0' }
        }
      }

      return {
        user: sanitizeUser(dbUser.toObject()),
        session: { provider: 'auth0' }
      }
    } catch (_e) {
      // No session found
      return { error: 'Not authenticated', status: 401 }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Authentication failed', status: 401 }
  }
}

// Helper function to check if user has required permission
function hasPermission(user: UserType, requiredPermission: string): boolean {
  if (user.role === 'super_admin') {
    return true // Super admin has all permissions
  }

  if (user.role === 'admin' && 'permissions' in user) {
    const adminUser = user as UserType & { permissions?: string[] }
    return adminUser.permissions?.includes(requiredPermission) || false
  }

  return false
}

// Helper function to check if user can access business
function canAccessBusiness(user: UserType, businessId: string): boolean {
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true
  }

  if (user.role === 'business_owner') {
    const businessUser = user as UserType & { businessIds?: string[] }
    return businessUser.businessIds?.includes(businessId) || false
  }

  return false
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

  if (!isValidUserForPermissions(user) || !hasPermission(user, requiredPermission)) {
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

  if (!isValidUserForBusiness(user) || !canAccessBusiness(user, businessId)) {
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
