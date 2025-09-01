import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0/edge'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/auth'
import { AuthService } from '@/lib/auth'
import type { User as UserType, UserPreferences } from '@/types/auth'
import { randomUUID } from 'crypto'

type Auth0User = {
  sub?: string
  email?: string
  name?: string
  given_name?: string
  family_name?: string
  nickname?: string
  picture?: string
  email_verified?: boolean
}

const defaultPreferences = {
  notifications: {
    email: true,
    events: true,
    news: true,
    businessUpdates: true,
    marketing: false,
  },
  privacy: {
    profileVisible: true,
    contactInfoVisible: false,
  },
  theme: 'system' as const,
}

export async function GET(request: NextRequest) {
  try {
    const res = new NextResponse()
    const session = await getSession(request, res)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()
    const auth0User = session.user as Auth0User
    const email = auth0User?.email
    if (!email) return NextResponse.json({ success: false, error: 'Missing email in session' }, { status: 400 })
  const dbUser = await User.findOne({ email })
  if (dbUser) {
      const sanitized = AuthService.sanitizeUser(dbUser.toObject()) as UserType
      // If no profile image saved in DB, fall back to Auth0 picture (e.g., Google avatar)
      if (!sanitized.profileImage && auth0User?.picture) {
        sanitized.profileImage = auth0User.picture
      }
      const mergedPrefs: UserPreferences = {
        ...defaultPreferences,
        ...(sanitized.preferences || (defaultPreferences as unknown as UserPreferences)),
        notifications: {
          ...defaultPreferences.notifications,
          ...(sanitized.preferences?.notifications || {}),
        },
        privacy: {
          ...defaultPreferences.privacy,
          ...(sanitized.preferences?.privacy || {}),
        },
      }
      const data = { ...sanitized, preferences: mergedPrefs }
      return NextResponse.json({ success: true, data })
    }
    // If user not found, provision a local user record immediately on first authenticated GET
    const name: string = auth0User?.name || ''
    const [fallbackFirst = '', ...rest] = name.split(' ').filter(Boolean)
    const created = await User.create({
      id: `user_${randomUUID()}`,
      email: email.toLowerCase(),
      passwordHash: '',
      username: (auth0User?.nickname || '').toLowerCase() || undefined,
      firstName: auth0User?.given_name || fallbackFirst || 'User',
      // Ensure a non-empty lastName to satisfy schema
      lastName: auth0User?.family_name || rest.join(' ') || 'User',
      role: 'user',
      isEmailVerified: !!auth0User?.email_verified,
      profileImage: auth0User?.picture || '',
      isActive: true,
      isSuspended: false,
      preferences: defaultPreferences,
    })
    const sanitized = AuthService.sanitizeUser(created.toObject()) as UserType
    // Ensure preferences are present in response
    const mergedPrefs: UserPreferences = {
      ...defaultPreferences,
      ...(sanitized.preferences || (defaultPreferences as unknown as UserPreferences)),
      notifications: {
        ...defaultPreferences.notifications,
        ...(sanitized.preferences?.notifications || {}),
      },
      privacy: {
        ...defaultPreferences.privacy,
        ...(sanitized.preferences?.privacy || {}),
      },
    }
    const data = { ...sanitized, preferences: mergedPrefs }
    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('GET /api/auth/profile error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const res = new NextResponse()
    const session = await getSession(request, res)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()
    const auth0User = session.user as Auth0User
    const email = auth0User?.email
    if (!email) return NextResponse.json({ success: false, error: 'Missing email in session' }, { status: 400 })
    let dbUser = await User.findOne({ email })
  const { firstName, lastName, phone, preferences, username } = await request.json()
  if (!dbUser) {
      // Auto-provision a local user for Auth0-only signups
      const name: string = auth0User?.name || ''
      const [fallbackFirst = '', ...rest] = name.split(' ').filter(Boolean)
      dbUser = await User.create({
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        email: email.toLowerCase(),
        passwordHash: '',
        username: (typeof username === 'string' && username ? username.toLowerCase() : (auth0User?.nickname || '')?.toLowerCase()) || undefined,
        firstName: (firstName as string) || auth0User?.given_name || fallbackFirst || 'User',
        // Ensure a non-empty lastName to satisfy schema
        lastName: (lastName as string) || auth0User?.family_name || rest.join(' ') || 'User',
        role: 'user',
        isEmailVerified: !!auth0User?.email_verified,
        profileImage: auth0User?.picture || '',
        isActive: true,
        isSuspended: false,
        preferences: {
          ...defaultPreferences,
          ...(preferences && typeof preferences === 'object' ? preferences : {}),
        }
      })
    }
    if (typeof firstName === 'string') dbUser.firstName = firstName
    if (typeof lastName === 'string') dbUser.lastName = lastName
    if (typeof phone === 'string') dbUser.phone = phone
    if (typeof username === 'string') {
      const normalized = username.trim().toLowerCase()
      if (normalized && normalized !== dbUser.username) {
        // basic validation mirrors schema
        const isValid = /^[a-z0-9_.]{3,32}$/i.test(normalized)
        if (!isValid) {
          return NextResponse.json({ success: false, error: 'Invalid username. Use 3-32 letters, numbers, underscore or dot.' }, { status: 400 })
        }
        const exists = await User.findOne({ username: normalized, email: { $ne: dbUser.email } })
        if (exists) {
          return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 409 })
        }
        dbUser.username = normalized
      }
    }
    if (preferences && typeof preferences === 'object') {
      dbUser.preferences = {
        ...defaultPreferences,
        ...dbUser.preferences,
        ...preferences,
        notifications: { ...defaultPreferences.notifications, ...(dbUser.preferences?.notifications || {}), ...(preferences.notifications || {}) },
        privacy: { ...defaultPreferences.privacy, ...(dbUser.preferences?.privacy || {}), ...(preferences.privacy || {}) },
      }
    }
    await dbUser.save()
    const sanitized = AuthService.sanitizeUser(dbUser.toObject())
    return NextResponse.json({ success: true, data: sanitized, message: 'Profile updated' })
  } catch (e) {
    console.error('PUT /api/auth/profile error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
