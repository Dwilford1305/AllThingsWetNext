import { NextRequest, NextResponse } from 'next/server'
import ComprehensiveEmailService from '../../../../../lib/email/services/ComprehensiveEmailService'

// Track email clicks and redirect to target URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingId = searchParams.get('id')
    const targetUrl = searchParams.get('url')
    
    if (!trackingId || !targetUrl) {
      return NextResponse.json(
        { error: 'Missing tracking ID or target URL' },
        { status: 400 }
      )
    }

    // Decode the target URL
    const decodedUrl = decodeURIComponent(targetUrl)

    // Get user agent and IP for analytics
    const userAgent = request.headers.get('user-agent') || undefined
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               undefined

    // Track the click event (don't await to avoid delaying redirect)
    ComprehensiveEmailService.trackClick(trackingId, decodedUrl, userAgent, ip)
      .catch(error => console.error('Click tracking error:', error))

    // Redirect to target URL
    return NextResponse.redirect(decodedUrl, { status: 302 })
  } catch (error) {
    console.error('Email click tracking error:', error)
    
    // If tracking fails, still try to redirect if we have a URL
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')
    
    if (targetUrl) {
      try {
        const decodedUrl = decodeURIComponent(targetUrl)
        return NextResponse.redirect(decodedUrl, { status: 302 })
      } catch (urlError) {
        console.error('URL decode error:', urlError)
      }
    }
    
    return NextResponse.json(
      { error: 'Click tracking failed' },
      { status: 500 }
    )
  }
}