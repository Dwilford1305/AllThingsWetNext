import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0/edge'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/auth'
import { AuthService } from '@/lib/auth'
import type { User as UserType, UserPreferences } from '@/types/auth'
import { initializeAuth0Environment } from '@/lib/auth0-config'

// Initialize Auth0 environment variables
initializeAuth0Environment();

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

function buildFallbackProfile(auth0User: Auth0User) {
  const name: string = auth0User?.name || ''
  const [first = '', ...rest] = name.split(' ').filter(Boolean)
  const last = auth0User?.family_name || rest.join(' ')
  return {
    id: auth0User?.sub || auth0User?.email || 'auth0_user',
    email: auth0User?.email || '',
    firstName: auth0User?.given_name || first,
    lastName: last,
    role: 'user',
    profileImage: auth0User?.picture || '',
    phone: '',
    isEmailVerified: !!auth0User?.email_verified,
    isActive: true,
    isSuspended: false,
    preferences: defaultPreferences,
  }
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
      // If DB lacks a profile image, use Auth0/Google picture
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
    return NextResponse.json({ success: true, data: buildFallbackProfile(auth0User) })
  } catch (e) {
    console.error('GET /api/auth/me error:', e)
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
    const dbUser = await User.findOne({ email })
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Profile not found in database' }, { status: 409 })
    }
  const { firstName, lastName, phone, preferences, username } = await request.json()
    if (typeof firstName === 'string') dbUser.firstName = firstName
    if (typeof lastName === 'string') dbUser.lastName = lastName
    if (typeof phone === 'string') dbUser.phone = phone
  if (typeof username === 'string') dbUser.username = username.trim() || undefined
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
    console.error('PUT /api/auth/me error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
