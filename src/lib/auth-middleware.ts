import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0/edge'
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

    // 1) Try our legacy JWT/session first (Authorization or accessToken cookie)
    const authHeader = request.headers.get('authorization')
    let token: string | undefined
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      token = request.cookies.get('accessToken')?.value
    }

    if (token) {
      try {
        const decoded = AuthService.verifyAccessToken(token)
        const session = await UserSession.findOne({
          accessToken: token,
          isActive: true,
          expiresAt: { $gt: new Date() }
        })

        if (session) {
          const user = await User.findOne({ id: decoded.userId, isActive: true })
          if (user) {
            await UserSession.updateOne(
              { _id: session._id },
              { lastUsedAt: new Date() }
            )
            return {
              user: AuthService.sanitizeUser(user.toObject()),
              session: session.toObject()
            }
          }
        }
        // If session or user not found, fall through to Auth0 cookie-based auth
      } catch (_e) {
        // On token verification error, fall through to Auth0 cookie-based auth
      }
    }

    // 2) Fallback: Auth0 session from cookies (App Router)
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
        user: AuthService.sanitizeUser(dbUser.toObject()),
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
    if (['POST','PUT','PATCH','DELETE'].includes(request.method.toUpperCase())) {
      const csrfError = _checkCsrf(request)
      if (csrfError) return handleAuthError(csrfError)
    }
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

// Basic CSRF check placeholder (double-submit cookie pattern to be enforced later)
function _checkCsrf(request: NextRequest) {
  const method = request.method.toUpperCase()
  if (!['POST','PUT','PATCH','DELETE'].includes(method)) return null
  const headerToken = request.headers.get('x-csrf-token')
  const cookieToken = request.cookies.get('csrfToken')?.value
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return { error: 'Invalid or missing CSRF token', status: 403 }
  }
  return null
}

// Wrapper for API routes that require specific roles
export function withRole(allowedRoles: string[], handler: (request: AuthenticatedRequest, context?: Record<string, unknown>) => Promise<Response>) {
  return async (request: NextRequest, context?: Record<string, unknown>) => {
    if (['POST','PUT','PATCH','DELETE'].includes(request.method.toUpperCase())) {
      const csrfError = _checkCsrf(request)
      if (csrfError) return handleAuthError(csrfError)
    }
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
    if (['POST','PUT','PATCH','DELETE'].includes(request.method.toUpperCase())) {
      const csrfError = _checkCsrf(request)
      if (csrfError) return handleAuthError(csrfError)
    }
    const authResult = await authorizePermission(request, requiredPermission)
    
    if (authResult.error) {
      return handleAuthError(authResult)
    }

    ;(request as AuthenticatedRequest).user = authResult.user
    ;(request as AuthenticatedRequest).session = authResult.session

    return handler(request as AuthenticatedRequest, context)
  }
}
