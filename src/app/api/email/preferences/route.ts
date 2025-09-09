import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0/edge'
import ComprehensiveEmailService from '../../../../lib/email/services/ComprehensiveEmailService'

// Get user email preferences
export async function GET(request: NextRequest) {
  try {
    const res = new NextResponse()
    const session = await getSession(request, res)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Implement get email preferences
    // For now, return default preferences
    const defaultPreferences = {
      transactional: true,
      marketing: false,
      newsletter: true,
      eventNotifications: true,
      businessUpdates: true,
      newsDigest: true,
      frequency: 'weekly',
      digestTime: 'morning'
    }

    return NextResponse.json({
      success: true,
      preferences: defaultPreferences
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
    const { preferences } = body

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences are required' },
        { status: 400 }
      )
    }

    // TODO: Get user ID from session and update preferences
    // await ComprehensiveEmailService.updateEmailPreferences(session.user.sub, preferences)

    return NextResponse.json({
      success: true,
      message: 'Email preferences updated successfully'
    })
  } catch (error) {
    console.error('Failed to update email preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update email preferences' },
      { status: 500 }
    )
  }
}