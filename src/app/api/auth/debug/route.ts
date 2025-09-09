import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Enhanced environment detection for debugging
    const nodeEnv = process.env.NODE_ENV;
    const vercelEnv = process.env.VERCEL_ENV;
    const isVercel = !!process.env.VERCEL_URL;
    
    // Log environment detection for debugging
    console.log('[Auth0 Debug] Environment detection:', {
      NODE_ENV: nodeEnv,
      VERCEL_ENV: vercelEnv,
      VERCEL_URL: process.env.VERCEL_URL,
      isVercel,
      allowAccess: !(nodeEnv === 'production' && vercelEnv !== 'preview')
    });
    
    // Only restrict in true production (not preview environments)
    if (nodeEnv === 'production' && vercelEnv !== 'preview' && !process.env.DEBUG_ENDPOINT_ENABLED) {
      return NextResponse.json({ 
        success: false, 
        error: 'Debug endpoint not available in production',
        environment: {
          NODE_ENV: nodeEnv,
          VERCEL_ENV: vercelEnv,
          isVercel
        }
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
    // NOTE: This tests client credentials for Management API access, which is optional for basic authentication
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
          managementApiTest = { 
            status: 'success', 
            message: 'Client credentials are valid for Management API access',
            note: 'This indicates your application is configured as Regular Web Application with Client Credentials grant'
          };
        } else {
          const errorData = await tokenResponse.text();
          let errorJson;
          try {
            errorJson = JSON.parse(errorData);
          } catch {
            errorJson = { error: 'parse_error', error_description: errorData.substring(0, 100) };
          }
          
          managementApiTest = { 
            status: 'error', 
            message: 'Client credentials test failed',
            details: errorData.substring(0, 200),
            errorCode: errorJson.error,
            errorDescription: errorJson.error_description,
            httpStatus: tokenResponse.status,
            note: 'This test is for Management API access only. Basic login may still work if Application Type and Grant Types are configured correctly.',
            // Enhanced diagnostics for access_denied
            diagnostics: errorJson.error === 'access_denied' ? {
              likelyCauses: [
                'Application Type is set to "Single Page Application" instead of "Regular Web Application"',
                'Client Credentials grant type is not enabled in Auth0 application settings',
                'Application does not have permission to access Auth0 Management API (this is optional for basic login)',
                'Client ID or Client Secret is incorrect',
                'Application is disabled or in wrong Auth0 tenant'
              ],
              requiredSteps: [
                '1. Go to Auth0 Dashboard → Applications → Your Dev Application',
                '2. Settings tab → Application Type → Set to "Regular Web Application"',
                '3. Advanced Settings → Grant Types → Check "Authorization Code"', 
                '4. Advanced Settings → Grant Types → Check "Refresh Token"',
                '5. Optional: Advanced Settings → Grant Types → Check "Client Credentials" (for Management API access)',
                '6. Save Changes and wait 2 minutes',
                '7. Verify Client ID/Secret match exactly (no extra spaces)',
                '8. Check application is enabled and in correct tenant'
              ],
              criticalCheck: 'Most common cause: Application Type = "Single Page Application" should be "Regular Web Application"',
              loginMayStillWork: 'Even if this test fails, basic Auth0 login should work if Application Type is "Regular Web Application" and Authorization Code grant is enabled.'
            } : null
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