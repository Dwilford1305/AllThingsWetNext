import { NextRequest, NextResponse } from 'next/server'
import ComprehensiveEmailService from '../../../../lib/email/services/ComprehensiveEmailService'
import EmailAutomationService from '../../../../lib/email/services/EmailAutomationService'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = request.headers.get('authorization')
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 Starting email processing job...')
    
    // Process email queue
    await ComprehensiveEmailService.processQueue(20) // Process up to 20 emails
    
    // Process automated campaigns
    await EmailAutomationService.processAutomatedCampaigns()
    
    console.log('✅ Email processing job completed')
    
    return NextResponse.json({
      success: true,
      message: 'Email processing completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Email processing job failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Email processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow GET for testing purposes
export async function GET(request: NextRequest) {
  try {
    // In development, allow GET requests without auth for testing
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }

    console.log('🧪 Testing email processing job...')
    
    // Process a small batch for testing
    await ComprehensiveEmailService.processQueue(5)
    
    console.log('✅ Test email processing completed')
    
    return NextResponse.json({
      success: true,
      message: 'Test email processing completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Test email processing failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test email processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}