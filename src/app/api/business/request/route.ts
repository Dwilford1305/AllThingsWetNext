import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/auth'
import { BusinessRequest } from '@/models/businessRequest'
import { AuthService } from '@/lib/auth'
import { EmailService } from '@/lib/emailService'
import { z } from 'zod'

// Business Request Schema Validation
const businessRequestSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessType: z.string().min(2, 'Business type is required'),
  description: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  website: z.string().url().optional().or(z.literal('')),
  requestMessage: z.string().optional()
})

// Generate UUID function
function generateUUID(): string {
  return 'req_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Push notification service
async function sendPushNotification(title: string, body: string, data?: Record<string, string | number>): Promise<boolean> {
  try {
    // This would integrate with a push notification service like FCM, OneSignal, etc.
    // For now, we'll log it and you can integrate with your preferred service
    console.log('🔔 Push Notification:', { title, body, data })
    
    // Example for Firebase Cloud Messaging (FCM) integration:
    // const admin = require('firebase-admin')
    // const message = {
    //   notification: { title, body },
    //   data: data || {},
    //   topic: 'admin-notifications' // Send to admin topic
    // }
    // await admin.messaging().send(message)
    
    return true
  } catch (error) {
    console.error('Failed to send push notification:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the JWT token
    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = AuthService.verifyAccessToken(token)
    } catch (_error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = businessRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const {
      businessName,
      businessType,
      description,
      address,
      phone,
      email,
      website,
      requestMessage
    } = validationResult.data

    // Get user information
    const user = await User.findOne({ id: decoded.userId })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has a pending request for this business
    const existingRequest = await BusinessRequest.findOne({
      userId: decoded.userId,
      businessName: businessName,
      status: 'pending'
    })

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'You already have a pending request for this business' 
      }, { status: 400 })
    }

    // Create the business request
    const businessRequest = new BusinessRequest({
      id: generateUUID(),
      userId: decoded.userId,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      businessName,
      businessType,
      description: description || '',
      address,
      phone,
      email: email || user.email,
      website: website || '',
      requestMessage: requestMessage || '',
      status: 'pending'
    })

    await businessRequest.save()

    // Send email notifications
    try {
      // Send notification to admin
      await EmailService.sendBusinessRequestNotification({
        requestId: businessRequest.id,
        businessName,
        businessType,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        phone,
        address,
        description: description || '',
        website: website || '',
        requestMessage: requestMessage || '',
        submittedAt: new Date()
      })

      // Send confirmation to user
      await EmailService.sendBusinessRequestConfirmation(
        user.email,
        businessName
      )

      // Send push notification to admin
      await sendPushNotification(
        '🏢 New Business Listing Request',
        `${businessName} (${businessType}) - submitted by ${user.firstName} ${user.lastName}`,
        {
          type: 'business_request',
          requestId: businessRequest.id,
          businessName,
          userName: `${user.firstName} ${user.lastName}`
        }
      )
    } catch (emailError) {
      console.error('Failed to send notification emails:', emailError)
      // Don't fail the request if email sending fails
    }

    console.log('New business listing request:', {
      requestId: businessRequest.id,
      businessName,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`
    })

    return NextResponse.json({
      success: true,
      message: 'Business listing request submitted successfully',
      requestId: businessRequest.id
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating business request:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the JWT token
    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = AuthService.verifyAccessToken(token)
    } catch (_error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    // Get user's business requests
    const requests = await BusinessRequest.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      requests
    })

  } catch (error) {
    console.error('Error fetching business requests:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
