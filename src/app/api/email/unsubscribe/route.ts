import { NextRequest, NextResponse } from 'next/server'
import ComprehensiveEmailService from '../../../../lib/email/services/ComprehensiveEmailService'

// Handle email unsubscribe requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const type = searchParams.get('type') // Optional: specific type to unsubscribe from
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // For GET requests, show unsubscribe confirmation page
    const unsubscribeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribe - AllThingsWet</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .form { background: #f9f9f9; padding: 30px; border-radius: 8px; }
            .button { background: #dc2626; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
            .button:hover { background: #b91c1c; }
            .cancel { background: #6b7280; margin-left: 10px; }
            .cancel:hover { background: #4b5563; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Unsubscribe from AllThingsWet Emails</h1>
          </div>
          <div class="form">
            <p>We're sorry to see you go! You are about to unsubscribe the email address:</p>
            <p><strong>${email}</strong></p>
            ${type ? `<p>From: <strong>${type} emails</strong></p>` : '<p>From: <strong>All emails</strong></p>'}
            
            <form method="POST" action="/api/email/unsubscribe">
              <input type="hidden" name="email" value="${email}">
              ${type ? `<input type="hidden" name="type" value="${type}">` : ''}
              <button type="submit" class="button">Confirm Unsubscribe</button>
              <button type="button" class="button cancel" onclick="window.history.back()">Cancel</button>
            </form>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              <strong>Note:</strong> You will still receive important account and security-related emails.
            </p>
          </div>
        </body>
      </html>
    `

    return new NextResponse(unsubscribeHtml, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('Unsubscribe page error:', error)
    return NextResponse.json(
      { error: 'Failed to load unsubscribe page' },
      { status: 500 }
    )
  }
}

// Process unsubscribe request
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const type = formData.get('type') as string
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Unsubscribe user from all emails
    await ComprehensiveEmailService.unsubscribeUser(email)

    // Show success page
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed - AllThingsWet</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .success { background: #dcfce7; border: 1px solid #16a34a; padding: 30px; border-radius: 8px; text-align: center; }
            .button { background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
            .button:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Successfully Unsubscribed</h1>
          </div>
          <div class="success">
            <h2>✓ You have been unsubscribed</h2>
            <p>The email address <strong>${email}</strong> has been removed from our mailing list.</p>
            ${type ? `<p>You will no longer receive <strong>${type} emails</strong>.</p>` : '<p>You will no longer receive marketing emails from us.</p>'}
            
            <p>You may still receive important account and security-related emails.</p>
            
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" class="button">
              Return to AllThingsWet
            </a>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              Changed your mind? You can update your email preferences in your account settings.
            </p>
          </div>
        </body>
      </html>
    `

    return new NextResponse(successHtml, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('Unsubscribe processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    )
  }
}