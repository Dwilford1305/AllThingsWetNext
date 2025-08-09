import { hash, compare } from 'bcryptjs'
import { sign, verify, SignOptions } from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import type { User } from '@/types/auth'
import { RefreshTokenJti } from '@/models/security'
import { UserSession, UserActivityLog } from '@/models/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production'  
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

// Ensure JWT secrets are strings
if (!JWT_SECRET || typeof JWT_SECRET !== 'string') {
  throw new Error('JWT_SECRET must be defined as a string')
}
if (!JWT_REFRESH_SECRET || typeof JWT_REFRESH_SECRET !== 'string') {
  throw new Error('JWT_REFRESH_SECRET must be defined as a string')
}
if (process.env.NODE_ENV === 'production') {
  if (JWT_SECRET.includes('fallback-secret')) {
    throw new Error('Insecure fallback JWT_SECRET detected in production')
  }
  if (JWT_REFRESH_SECRET.includes('fallback-refresh-secret')) {
    throw new Error('Insecure fallback JWT_REFRESH_SECRET detected in production')
  }
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return hash(password, 12)
  }

  // Compare password
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword)
  }

  // Generate JWT tokens
  static generateTokens(user: User) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    }

    const accessToken = sign(payload, JWT_SECRET as string, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'allthingswet',
      audience: 'allthingswet-users'
    } as SignOptions)

    const refreshJti = uuidv4()
    const refreshToken = sign(
      { ...payload, tokenType: 'refresh', jti: refreshJti }, 
      JWT_REFRESH_SECRET as string, 
      {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'allthingswet',
        audience: 'allthingswet-users'
      } as SignOptions
    )

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour from now

    return {
      accessToken,
  refreshToken,
  refreshJti,
      expiresAt
    }
  }

  // Generic signing for auxiliary tokens (e.g., 2FA pending)
  static signToken(payload: Record<string, unknown>, expiresIn: string) {
    return sign(payload, JWT_SECRET as string, {
      expiresIn,
      issuer: 'allthingswet',
      audience: 'allthingswet-users'
    } as SignOptions)
  }

  static verifyToken(token: string): Record<string, unknown> | null {
    try {
  return verify(token, JWT_SECRET, { issuer: 'allthingswet', audience: 'allthingswet-users' }) as Record<string, unknown>
    } catch {
      return null
    }
  }

  // Verify JWT token
  static verifyAccessToken(token: string): Record<string, unknown> {
    try {
      return verify(token, JWT_SECRET, {
        issuer: 'allthingswet',
        audience: 'allthingswet-users'
      }) as Record<string, unknown>
    } catch (_error) {
      throw new Error('Invalid or expired token')
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): Record<string, unknown> {
    try {
      return verify(token, JWT_REFRESH_SECRET, {
        issuer: 'allthingswet',
        audience: 'allthingswet-users'
      }) as Record<string, unknown>
    } catch (_error) {
      throw new Error('Invalid or expired refresh token')
    }
  }

  // Placeholder for refresh token reuse detection (to be backed by persistence)
  static async detectRefreshReuse(jti: string): Promise<boolean> {
    if (!jti) return false
    const existing = await RefreshTokenJti.findOne({ jti })
    // If found and marked reuse_detected already handled previously
    return !!existing
  }

  static async markRefreshUsed(params: { jti: string; userId: string; ip?: string | null; userAgent?: string | null; reason?: 'rotated'|'revoked'|'reuse_detected' }): Promise<void> {
    const { jti, userId, ip, userAgent, reason = 'rotated' } = params
    if (!jti || !userId) return
    try {
      await RefreshTokenJti.create({ jti, userId, ip, userAgent, reason })
    } catch (_e) {
      // Ignore duplicate key errors
    }
  }

  static async handleReuseDetected(userId: string, reusedJti: string) {
    // Revoke all active sessions for user as precaution
    await UserSession.updateMany({ userId, isActive: true }, { isActive: false, revokedAt: new Date() })
    // Mark the reused JTI explicitly if not already
    await RefreshTokenJti.updateOne({ jti: reusedJti }, { reason: 'reuse_detected' })
    try {
      await UserActivityLog.create({
        id: this.generateUserId(),
        userId,
        action: 'refresh_token_reuse_detected',
        details: { reusedJti },
        success: false,
        ip: 'unknown',
        userAgent: 'unknown'
      })
    } catch { /* swallow logging errors */ }
  }

  // Generate random token for email verification, password reset, etc.
  static generateRandomToken(): string {
    return uuidv4() + Date.now().toString(36)
  }

  // Validate password strength
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Extract user info from request headers
  static getUserFromToken(authHeader: string | null): Record<string, unknown> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header')
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    return this.verifyAccessToken(token)
  }

  // Check if user has required permission
  static hasPermission(user: User, requiredPermission: string): boolean {
    if (user.role === 'super_admin') {
      return true // Super admin has all permissions
    }

    if (user.role === 'admin' && 'permissions' in user) {
      const adminUser = user as User & { permissions?: string[] }
      return adminUser.permissions?.includes(requiredPermission) || false
    }

    return false
  }

  // Check if user can access business
  static canAccessBusiness(user: User, businessId: string): boolean {
    if (user.role === 'super_admin' || user.role === 'admin') {
      return true
    }

    if (user.role === 'business_owner') {
      const businessUser = user as User & { businessIds?: string[] }
      return businessUser.businessIds?.includes(businessId) || false
    }

    return false
  }

  // Rate limiting helper
  static isRateLimited(attempts: number, _timeWindow = 15 * 60 * 1000): boolean {
    // Allow 5 attempts per 15 minutes
    return attempts >= 5
  }

  // Sanitize user data for client response (remove sensitive fields)
  static sanitizeUser(user: Record<string, unknown>): Partial<User> {
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

    return sanitizedUser as Partial<User>
  }

  // Generate user ID
  static generateUserId(): string {
    return `user_${uuidv4()}`
  }

  // Generate session ID
  static generateSessionId(): string {
    return `session_${uuidv4()}`
  }

  // Generate business claim request ID
  static generateClaimRequestId(): string {
    return `claim_${uuidv4()}`
  }
}
