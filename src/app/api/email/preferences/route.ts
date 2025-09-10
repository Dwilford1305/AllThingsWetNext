import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0/edge'
import { EmailPreferences } from '../../../models/email'
import { connectToDatabase } from '../../../lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

// Get user email preferences
export async function GET(request: NextRequest) {
  try {
    const res = new NextResponse()
    const session = await getSession(request, res)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()
    
    // Get user preferences from database
    let preferences = await EmailPreferences.findOne({ userId: session.user.sub })
    
    // If no preferences exist, create default ones
    if (!preferences) {
      const defaultPreferences = {
        id: uuidv4(),
        userId: session.user.sub,
        email: session.user.email,
        preferences: {
          transactional: true,
          marketing: false,
          newsletter: true,
          eventNotifications: true,
          businessUpdates: true,
          newsDigest: true,
          frequency: 'weekly',
          digestTime: 'morning'
        },
        pushNotifications: {
          enabled: false,
          types: {
            marketplace: true,
            events: true,
            business: true,
            news: true,
            general: true
          },
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          },
          frequency: 'immediate'
        },
        unsubscribedFromAll: false,
        bounceCount: 0,
        isSuppressed: false
      }
      
      preferences = new EmailPreferences(defaultPreferences)
      await preferences.save()
    }

    return NextResponse.json({
      success: true,
      preferences: {
        email: preferences.preferences,
        pushNotifications: preferences.pushNotifications,
        unsubscribedFromAll: preferences.unsubscribedFromAll
      }
    })
  } catch (error) {
    console.error('Failed to get email preferences:', error)
    return NextResponse.json(
      { error: 'Failed to get email preferences' },
      { status: 500 }
    )
  }
}

// Update user email preferences
export async function POST(request: NextRequest) {
  try {
    const res = new NextResponse()
    const session = await getSession(request, res)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email: emailPrefs, pushNotifications } = body

    if (!emailPrefs && !pushNotifications) {
      return NextResponse.json(
        { error: 'At least one preference type is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Find existing preferences or create new
    let preferences = await EmailPreferences.findOne({ userId: session.user.sub })
    
    if (!preferences) {
      preferences = new EmailPreferences({
        id: uuidv4(),
        userId: session.user.sub,
        email: session.user.email,
        preferences: {
          transactional: true,
          marketing: false,
          newsletter: true,
          eventNotifications: true,
          businessUpdates: true,
          newsDigest: true,
          frequency: 'weekly',
          digestTime: 'morning'
        },
        pushNotifications: {
          enabled: false,
          types: {
            marketplace: true,
            events: true,
            business: true,
            news: true,
            general: true
          },
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          },
          frequency: 'immediate'
        },
        unsubscribedFromAll: false,
        bounceCount: 0,
        isSuppressed: false
      })
    }

    // Update email preferences if provided
    if (emailPrefs) {
      preferences.preferences = {
        ...preferences.preferences,
        ...emailPrefs,
        // Transactional emails cannot be disabled
        transactional: true
      }
    }

    // Update push notification preferences if provided
    if (pushNotifications) {
      preferences.pushNotifications = {
        ...preferences.pushNotifications,
        ...pushNotifications
      }
    }

    preferences.updatedAt = new Date()
    await preferences.save()

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        email: preferences.preferences,
        pushNotifications: preferences.pushNotifications
      }
    })
  } catch (error) {
    console.error('Failed to update email preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update email preferences' },
      { status: 500 }
    )
  }
}