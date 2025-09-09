import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth0 route tester for debugging routing issues
 * This helps determine if the Pages Router or App Router is handling Auth0 requests
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    console.log('[Auth0 Route Test] App Router route test endpoint called:', {
      url: request.url,
      pathname,
      host,
      baseUrl,
      environment: process.env.VERCEL_ENV,
      nodeEnv: process.env.NODE_ENV
    });
    
    // Test if Pages Router handler is accessible
    const tests = {
      appRouterActive: true,
      pagesRouterAuth0Path: '/api/auth/login',
      currentRequest: {
        url: request.url,
        pathname,
        method: request.method,
        host,
        baseUrl
      },
      environment: {
        VERCEL_ENV: process.env.VERCEL_ENV,
        NODE_ENV: process.env.NODE_ENV,
        hasVercelUrl: !!process.env.VERCEL_URL
      },
      auth0Config: {
        hasSecret: !!process.env.AUTH0_SECRET,
        hasBaseUrl: !!process.env.AUTH0_BASE_URL,
        hasIssuerBaseUrl: !!process.env.AUTH0_ISSUER_BASE_URL,
        hasClientId: !!process.env.AUTH0_CLIENT_ID,
        hasClientSecret: !!process.env.AUTH0_CLIENT_SECRET,
        currentBaseUrl: process.env.AUTH0_BASE_URL,
        issuerBaseUrl: process.env.AUTH0_ISSUER_BASE_URL,
        clientIdPreview: process.env.AUTH0_CLIENT_ID ? `${process.env.AUTH0_CLIENT_ID.substring(0, 8)}...` : 'MISSING'
      }
    };
    
    return NextResponse.json({
      success: true,
      message: 'App Router auth route test endpoint is working',
      tests,
      recommendations: [
        'If you can see this, the App Router is handling auth routes',
        'Check if Pages Router (/pages/api/auth/[...auth0].ts) is also accessible',
        'There may be a routing conflict between App Router and Pages Router',
        'Try accessing /api/auth/login directly to see which router handles it'
      ]
    });
    
  } catch (error) {
    console.error('[Auth0 Route Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Route test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}