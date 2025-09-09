import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Only allow in development/preview environments for security
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview') {
      return NextResponse.json({ 
        success: false, 
        error: 'Debug endpoint not available in production' 
      }, { status: 403 });
    }

    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const currentUrl = `${protocol}://${host}`;

    // Check Auth0 environment variables
    const auth0Config = {
      hasSecret: !!process.env.AUTH0_SECRET,
      hasBaseUrl: !!process.env.AUTH0_BASE_URL,
      hasIssuerBaseUrl: !!process.env.AUTH0_ISSUER_BASE_URL,
      hasClientId: !!process.env.AUTH0_CLIENT_ID,
      hasClientSecret: !!process.env.AUTH0_CLIENT_SECRET,
      
      baseUrl: process.env.AUTH0_BASE_URL,
      issuerBaseUrl: process.env.AUTH0_ISSUER_BASE_URL,
      clientIdPreview: process.env.AUTH0_CLIENT_ID ? `${process.env.AUTH0_CLIENT_ID.substring(0, 12)}...` : 'MISSING',
      
      environment: process.env.VERCEL_ENV || 'development',
      nodeEnv: process.env.NODE_ENV,
      currentUrl,
      host,
      
      // Configuration validation
      baseUrlMatchesHost: process.env.AUTH0_BASE_URL === currentUrl,
      isPreviewEnv: process.env.VERCEL_ENV === 'preview',
      isVercel: !!process.env.VERCEL_URL,
    };

    // Validate required variables
    const requiredVars = ['AUTH0_SECRET', 'AUTH0_ISSUER_BASE_URL', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    // Expected callback URLs based on current environment
    const expectedCallbacks = [
      `${currentUrl}/api/auth/callback`,
      'https://allthingswetaskiwin.ca/api/auth/callback',
      'https://*.vercel.app/api/auth/callback',
      'http://localhost:3000/api/auth/callback'
    ];

    const diagnostics = {
      status: missingVars.length === 0 ? 'configured' : 'incomplete',
      missingVariables: missingVars,
      configuration: auth0Config,
      expectedCallbackUrls: expectedCallbacks,
      recommendations: [] as Array<{
        type: 'error' | 'warning' | 'info';
        message: string;
        suggestion: string;
      }>
    };

    // Add specific recommendations based on configuration
    if (auth0Config.isPreviewEnv && auth0Config.baseUrl?.includes('allthingswetaskiwin.ca')) {
      diagnostics.recommendations.push({
        type: 'warning',
        message: 'AUTH0_BASE_URL is set to production URL in preview environment',
        suggestion: 'Remove AUTH0_BASE_URL from preview environment variables to allow dynamic detection'
      });
    }

    if (!auth0Config.baseUrlMatchesHost && auth0Config.isPreviewEnv) {
      diagnostics.recommendations.push({
        type: 'info',
        message: 'Base URL will be dynamically adjusted for preview environment',
        suggestion: 'This is normal behavior for preview deployments'
      });
    }

    if (missingVars.length > 0) {
      diagnostics.recommendations.push({
        type: 'error',
        message: `Missing required Auth0 environment variables: ${missingVars.join(', ')}`,
        suggestion: 'Configure these variables in your Vercel project settings'
      });
    }

    // Test Auth0 Management API access (basic connectivity test)
    let managementApiTest = null;
    if (auth0Config.hasIssuerBaseUrl && auth0Config.hasClientId && auth0Config.hasClientSecret) {
      try {
        const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.AUTH0_CLIENT_ID,
            client_secret: process.env.AUTH0_CLIENT_SECRET,
            audience: `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/`,
            grant_type: 'client_credentials'
          })
        });

        if (tokenResponse.ok) {
          managementApiTest = { status: 'success', message: 'Client credentials are valid' };
        } else {
          const errorData = await tokenResponse.text();
          managementApiTest = { 
            status: 'error', 
            message: 'Client credentials test failed',
            details: errorData.substring(0, 200) // Limit error details for security
          };
        }
      } catch (error) {
        managementApiTest = { 
          status: 'error', 
          message: 'Failed to test client credentials',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json({
      success: true,
      diagnostics: {
        ...diagnostics,
        clientCredentialsTest: managementApiTest,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Auth0 Debug] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Debug endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}