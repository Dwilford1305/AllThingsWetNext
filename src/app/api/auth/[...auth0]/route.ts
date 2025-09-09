// Lazy Auth0 handler for App Router to avoid build-time initialization errors
// DO NOT import Auth0 SDK at module level - causes "baseURL is required" error during Next.js build
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/auth';
import { randomUUID } from 'crypto';

type Auth0User = {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email_verified?: boolean;
};

const defaultPreferences = {
  notifications: {
    email: true,
    events: true,
    news: true,
    businessUpdates: true,
    marketing: false,
  },
  privacy: {
    profileVisible: true,
    contactInfoVisible: false,
  },
  theme: 'system' as const,
};

// Required Auth0 environment variables
const requiredVars = [
  'AUTH0_SECRET',
  'AUTH0_ISSUER_BASE_URL',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
];

function deriveBaseURL(request?: NextRequest): string | undefined {
  // Allow automatic fallback for development
  const direct = process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (direct) return direct.replace(/\/$/, '');
  
  // For Vercel deployments, handle different environments
  if (process.env.VERCEL_URL) {
    const vercelUrl = `https://${process.env.VERCEL_URL}`;
    
    if (process.env.VERCEL_ENV === 'preview') {
      console.log('[Auth0 App Router] Preview deployment detected:', vercelUrl);
    }
    
    return vercelUrl.replace(/\/$/, '');
  }
  
  // For App Router, derive from request if available
  if (request) {
    const host = request.headers.get('host');
    if (host) {
      const proto = request.headers.get('x-forwarded-proto') || 'https';
      const requestUrl = `${proto}://${host}`;
      console.log('[Auth0 App Router] Deriving base URL from request:', requestUrl);
      return requestUrl.replace(/\/$/, '');
    }
  }
  
  return undefined;
}

function validateAuth0Config(request?: NextRequest): { isValid: boolean; missing: string[]; derivedBaseUrl?: string } {
  let derivedBaseUrl: string | undefined;
  if (!process.env.AUTH0_BASE_URL) {
    derivedBaseUrl = deriveBaseURL(request);
    if (derivedBaseUrl) {
      // Set for the duration of this request
      process.env.AUTH0_BASE_URL = derivedBaseUrl;
    }
  }

  const hasBaseUrl = !!process.env.AUTH0_BASE_URL || !!derivedBaseUrl;
  const hasAll = requiredVars.every((k) => !!process.env[k]) && hasBaseUrl;
  
  const missing = requiredVars.filter((k) => !process.env[k]);
  if (!hasBaseUrl) {
    missing.push('AUTH0_BASE_URL (could not be auto-derived)');
  }
  
  return {
    isValid: hasAll,
    missing,
    derivedBaseUrl
  };
}

// Lazy Auth0 handler that initializes only at request time
async function handleAuth0Request(request: NextRequest) {
  console.log('[Auth0 App Router] Handler called:', {
    method: request.method,
    url: request.url,
    host: request.headers.get('host'),
    userAgent: request.headers.get('user-agent')?.substring(0, 50),
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV
  });
  
  // Perform validation at request time
  const validation = validateAuth0Config(request);
  
  console.log('[Auth0 App Router] Validation result:', {
    isValid: validation.isValid,
    missing: validation.missing,
    derivedBaseUrl: validation.derivedBaseUrl,
    currentAuth0BaseUrl: process.env.AUTH0_BASE_URL,
    hasVercelUrl: !!process.env.VERCEL_URL
  });
  
  if (!validation.isValid) {
    console.error('[Auth0 App Router] Configuration error:', {
      missing: validation.missing,
      hasVercelUrl: !!process.env.VERCEL_URL,
      vercelEnv: process.env.VERCEL_ENV,
      derivedBaseUrl: validation.derivedBaseUrl,
      currentBaseUrl: process.env.AUTH0_BASE_URL,
      requestHost: request.headers.get('host'),
      requestUrl: request.url
    });
    
    return NextResponse.json({
      success: false,
      error: 'Auth0 not configured',
      missing: validation.missing,
      help: 'Check your environment variables. AUTH0_BASE_URL can be auto-derived for Vercel deployments.'
    }, { status: 503 });
  }

  console.log('[Auth0 App Router] Configuration valid, importing Auth0 SDK');

  // Dynamic base URL correction for preview environments
  try {
    const host = request.headers.get('host');
    if (host) {
      const configured = process.env.AUTH0_BASE_URL || '';
      const configuredHost = configured.replace(/^https?:\/\//i, '').replace(/\/$/, '');
      
      if (process.env.VERCEL_ENV === 'preview') {
        console.log('[Auth0 App Router] Preview environment debugging:', {
          host,
          originalBaseUrl: configured,
          configuredHost,
          vercelUrl: process.env.VERCEL_URL,
          hostMatch: configuredHost === host
        });
      }
      
      if (!configuredHost || configuredHost !== host) {
        const proto = request.headers.get('x-forwarded-proto') || 'https';
        const newBaseUrl = `${proto}://${host}`;
        
        if (process.env.VERCEL_ENV === 'preview' && configured && configured.includes('allthingswetaskiwin.ca')) {
          console.log('[Auth0 App Router] WARNING: AUTH0_BASE_URL is set to production URL in preview environment');
        }
        
        process.env.AUTH0_BASE_URL = newBaseUrl;
        
        if (process.env.VERCEL_ENV === 'preview') {
          console.log('[Auth0 App Router] Dynamic base URL correction applied:', {
            original: configured,
            new: newBaseUrl,
            host
          });
        }
      }
    }
  } catch (e) {
    console.warn('[Auth0 App Router] Base URL dynamic override failed:', e);
  }
  
  try {
    // Import Auth0 SDK only after configuration is validated and base URL is set
    const { handleAuth, handleCallback } = await import('@auth0/nextjs-auth0');
    console.log('[Auth0 App Router] SDK imported successfully');
    
    // Create a mock request/response compatible with Pages Router API
    const url = new URL(request.url);
    const mockReq = {
      method: request.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(request.headers.entries()),
      query: Object.fromEntries(url.searchParams.entries())
    };
    
    let responseData: any = null;
    let responseStatus = 200;
    let responseHeaders: Record<string, string> = {};
    
    const mockRes = {
      status: (code: number) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data: any) => {
        responseData = data;
        return mockRes;
      },
      redirect: (statusOrUrl: number | string, url?: string) => {
        if (typeof statusOrUrl === 'string') {
          responseStatus = 302;
          responseHeaders['Location'] = statusOrUrl;
        } else {
          responseStatus = statusOrUrl;
          responseHeaders['Location'] = url || '';
        }
        return mockRes;
      },
      setHeader: (name: string, value: string) => {
        responseHeaders[name] = value;
        return mockRes;
      },
      end: (data?: any) => {
        responseData = data;
        return mockRes;
      }
    };
    
    const wrappedHandler = handleAuth({
      callback: handleCallback({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        afterCallback: async (req: any, res: any, session: any) => {
          try {
            console.log('[Auth0 App Router] Callback afterCallback triggered:', {
              hasSession: !!session,
              hasUser: !!session?.user,
              userEmail: session?.user?.email || 'none',
              environment: process.env.VERCEL_ENV,
              host: req.headers?.host
            });

            await connectDB();
            const auth0User = session?.user as Auth0User | undefined;
            const email = auth0User?.email?.toLowerCase();
            
            if (email) {
              const existing = await User.findOne({ email });
              if (!existing) {
                const name = auth0User?.name || '';
                const [first = '', ...rest] = name.split(' ').filter(Boolean);
                
                console.log('[Auth0 App Router] Creating new user:', {
                  email,
                  firstName: auth0User?.given_name || first || 'User',
                  lastName: auth0User?.family_name || rest.join(' ') || 'User'
                });
                
                await User.create({
                  id: `user_${randomUUID()}`,
                  email,
                  passwordHash: '',
                  firstName: auth0User?.given_name || first || 'User',
                  lastName: auth0User?.family_name || rest.join(' ') || 'User',
                  role: 'user',
                  isEmailVerified: !!auth0User?.email_verified,
                  profileImage: auth0User?.picture || '',
                  isActive: true,
                  isSuspended: false,
                  preferences: defaultPreferences,
                });
              } else {
                const updates: Record<string, unknown> = {};
                if (auth0User?.email_verified && !existing.isEmailVerified) {
                  updates.isEmailVerified = true;
                }
                if (!existing.profileImage && auth0User?.picture) {
                  updates.profileImage = auth0User.picture;
                }
                if (Object.keys(updates).length) {
                  await User.updateOne({ email }, { $set: updates });
                }
              }
            }
            
            return session;
          } catch (error) {
            console.error('[Auth0 App Router] afterCallback error:', {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
            return session;
          }
        }
      })
    });
    
    // Call the wrapped handler
    await wrappedHandler(mockReq as any, mockRes as any);
    
    // Convert response to NextResponse
    if (responseHeaders['Location']) {
      return NextResponse.redirect(responseHeaders['Location'], responseStatus);
    }
    
    if (responseData) {
      return NextResponse.json(responseData, { 
        status: responseStatus,
        headers: responseHeaders
      });
    }
    
    return new NextResponse(responseData, { 
      status: responseStatus,
      headers: responseHeaders
    });
    
  } catch (sdkError) {
    console.error('[Auth0 App Router] SDK error:', {
      error: sdkError instanceof Error ? sdkError.message : String(sdkError),
      stack: sdkError instanceof Error ? sdkError.stack : undefined,
      auth0BaseUrl: process.env.AUTH0_BASE_URL,
      requestUrl: request.url,
      requestHost: request.headers.get('host')
    });
    
    return NextResponse.json({
      success: false,
      error: 'Auth0 SDK error',
      details: sdkError instanceof Error ? sdkError.message : 'Unknown SDK error',
      requestUrl: request.url
    }, { status: 500 });
  }
}

// Export the lazy handlers
export const GET = handleAuth0Request;
export const POST = handleAuth0Request;