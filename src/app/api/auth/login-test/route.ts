import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const currentUrl = `${protocol}://${host}`;
    
    // Check if Auth0 environment variables are present
    const auth0Config = {
      hasSecret: !!process.env.AUTH0_SECRET,
      hasBaseUrl: !!process.env.AUTH0_BASE_URL,
      hasIssuerBaseUrl: !!process.env.AUTH0_ISSUER_BASE_URL,
      hasClientId: !!process.env.AUTH0_CLIENT_ID,
      hasClientSecret: !!process.env.AUTH0_CLIENT_SECRET,
      environment: process.env.VERCEL_ENV || 'development',
      nodeEnv: process.env.NODE_ENV,
      currentUrl,
      host
    };
    
    console.log('[Auth0 Login Test] Environment check:', auth0Config);
    
    // Check required variables
    const requiredVars = ['AUTH0_SECRET', 'AUTH0_ISSUER_BASE_URL', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Auth0 not configured',
        missing: missingVars,
        config: auth0Config
      }, { status: 503 });
    }
    
    // Test if we can access the Auth0 login endpoint
    const loginUrl = `${currentUrl}/api/auth/login`;
    
    return NextResponse.json({
      success: true,
      message: 'Auth0 login test endpoint',
      config: auth0Config,
      loginUrl,
      instructions: [
        '1. Visit /api/auth/login to start Auth0 login flow',
        '2. Visit /api/auth/debug for detailed diagnostics',
        '3. Check this endpoint for configuration validation'
      ],
      nextSteps: `Try visiting: ${loginUrl}`
    });
    
  } catch (error) {
    console.error('[Auth0 Login Test] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Login test endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}