// Lazy Auth0 handler with environment guard to avoid build/runtime crash when required vars missing
// We intentionally avoid top-level import of '@auth0/nextjs-auth0' until we've verified env vars.
import type { NextApiRequest, NextApiResponse } from 'next';
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

// Determine if required Auth0 env vars exist
const requiredVars = [
	'AUTH0_SECRET',
	'AUTH0_BASE_URL',
	'AUTH0_ISSUER_BASE_URL',
	'AUTH0_CLIENT_ID',
	'AUTH0_CLIENT_SECRET',
];

function deriveBaseURL(): string | undefined {
	// Allow automatic fallback so local dev doesn't break if AUTH0_BASE_URL not explicitly set
	const direct = process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
	if (direct) return direct.replace(/\/$/, '');
	
	// For Vercel deployments, handle different environments
	if (process.env.VERCEL_URL) {
		const vercelUrl = `https://${process.env.VERCEL_URL}`;
		
		// For preview deployments, use wildcard pattern for Auth0 config
		// Note: Auth0 dashboard must include *.vercel.app in allowed callback URLs
		if (process.env.VERCEL_ENV === 'preview') {
			console.log('[Auth0] Preview deployment detected:', vercelUrl);
			console.log('[Auth0] Ensure your Auth0 application includes "*.vercel.app" in allowed callback URLs');
		}
		
		return vercelUrl.replace(/\/$/, '');
	}
	
	return undefined;
}

// If base URL missing but others present, we try to synthesize one for dev
if (!process.env.AUTH0_BASE_URL) {
	const synthesized = deriveBaseURL();
	if (synthesized) {
		process.env.AUTH0_BASE_URL = synthesized; // Mutate only at runtime, not build-time constant usage
	}
}

const hasAll = requiredVars.every((k) => !!process.env[k]);

let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

if (!hasAll) {
	handler = function missingAuth0(req: NextApiRequest, res: NextApiResponse) {
		res.status(503).json({
			success: false,
			error: 'Auth0 not configured',
			missing: requiredVars.filter((k) => !process.env[k]),
		});
	};
} else {

	function logStateCookieDiagnostics(req: NextApiRequest, err: unknown) {
		if (!(err instanceof Error)) return;
		if (!/Missing state cookie/i.test(err.message)) return;
		try {
			const host = req.headers.host;
			const origin = (req.headers as Record<string, unknown>).origin || (req.headers as Record<string, unknown>).referer;
			const base = process.env.AUTH0_BASE_URL;
			const cookieHeader = req.headers.cookie || ''; // may be undefined
			const hasSession = /appSession|auth0\./i.test(cookieHeader);
			console.warn('[Auth0] Missing state cookie diagnostics', {
				AUTH0_BASE_URL: base,
				reqHost: host,
				reqOrigin: origin,
				cookieLength: cookieHeader.length,
				hasSessionLikeCookie: hasSession,
				cookiesPreview: cookieHeader.slice(0, 160),
			});
			if (base && host && !base.includes(host)) {
				console.warn('[Auth0] Potential baseURL/Host mismatch. Ensure AUTH0_BASE_URL matches actual request origin exactly.');
			}
		} catch (e) {
			console.warn('[Auth0] Failed to produce diagnostics for missing state cookie', e);
		}
	}
	handler = async function auth0Handler(req: NextApiRequest, res: NextApiResponse) {
		// Dynamic base URL correction: if configured base doesn't match request host (preview/local), adjust on-the-fly
		try {
			const host = req.headers.host;
			if (host) {
				const configured = process.env.AUTH0_BASE_URL || '';
				const configuredHost = configured.replace(/^https?:\/\//i, '').replace(/\/$/, '');
				
				// Enhanced logging for preview environments
				if (process.env.VERCEL_ENV === 'preview') {
					console.log('[Auth0] Preview environment debugging:');
					console.log('[Auth0] - Host:', host);
					console.log('[Auth0] - Original AUTH0_BASE_URL:', configured);
					console.log('[Auth0] - Configured host:', configuredHost);
					console.log('[Auth0] - VERCEL_URL:', process.env.VERCEL_URL);
					console.log('[Auth0] - Host match check:', configuredHost === host);
				}
				
				if (!configuredHost || configuredHost !== host) {
					const proto = (req.headers['x-forwarded-proto'] as string) || (configured.startsWith('http://') ? 'http' : 'https');
					const newBaseUrl = `${proto}://${host}`;
					
					// For preview environments, don't override if AUTH0_BASE_URL is explicitly set to production URL
					// This prevents issues where AUTH0_BASE_URL is hardcoded to production in environment variables
					if (process.env.VERCEL_ENV === 'preview' && configured && configured.includes('allthingswetaskiwin.ca')) {
						console.log('[Auth0] WARNING: AUTH0_BASE_URL is set to production URL in preview environment');
						console.log('[Auth0] This may cause callback URL mismatches. Consider removing AUTH0_BASE_URL from preview environment variables.');
						console.log('[Auth0] Production URL:', configured);
						console.log('[Auth0] Preview URL would be:', newBaseUrl);
					}
					
					process.env.AUTH0_BASE_URL = newBaseUrl;
					
					// Log for preview environments to help with debugging
					if (process.env.VERCEL_ENV === 'preview') {
						console.log('[Auth0] Preview environment detected - Dynamic base URL correction applied');
						console.log('[Auth0] Original base URL:', configured);
						console.log('[Auth0] New base URL:', newBaseUrl);
						console.log('[Auth0] Host:', host);
						console.log('[Auth0] IMPORTANT: Ensure your Auth0 dashboard includes the following in allowed callback URLs:');
						console.log(`[Auth0] - ${newBaseUrl}/api/auth/callback`);
						console.log(`[Auth0] - Or add wildcard pattern: https://*.vercel.app/api/auth/callback`);
					}
				}
			}
		} catch (e) {
			console.warn('[Auth0] baseURL dynamic override failed (continuing):', e);
		}
		// Import AFTER potential AUTH0_BASE_URL override so SDK picks up adjusted value
		const { handleAuth, handleCallback } = await import('@auth0/nextjs-auth0');
		const wrapped = handleAuth({
			async callback(reqInner: NextApiRequest, resInner: NextApiResponse) {
				// Early recovery: if no state cookie present, likely user navigated directly or cookie stripped.
				try {
					const cookieHeader = reqInner.headers.cookie || '';
					const hasState = /auth0\.state|state=/i.test(cookieHeader);
					// Prevent infinite loop with a one-time retry marker
					const url = new URL(reqInner.url ?? '', `http://${reqInner.headers.host}`);
					const retried = url.searchParams.get('stateRetry');
					if (!hasState && !retried) {
						url.searchParams.set('stateRetry', '1');
						// Redirect through login to establish fresh state cookie
						return resInner.redirect(302, `/api/auth/login?returnTo=${encodeURIComponent(url.pathname + url.search)}`);
					}
				} catch (e) {
					console.warn('[Auth0] state pre-check failed (continuing):', e);
				}
				try {
					await handleCallback(reqInner, resInner, {
						// Using any for session to avoid tight coupling to Auth0's Session type; runtime shape still validated lightly
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						afterCallback: async (_req: NextApiRequest, _res: NextApiResponse, session: any) => {
							try {
								await connectDB();
								const auth0User = session?.user as Auth0User | undefined;
								const email = auth0User?.email?.toLowerCase();
								if (email) {
									const existing = await User.findOne({ email });
									if (!existing) {
										const name = auth0User?.name || '';
										const [first = '', ...rest] = name.split(' ').filter(Boolean);
										await User.create({
											id: `user_${randomUUID()}`,
											email,
											passwordHash: '',
											firstName: auth0User?.given_name || first || 'User',
											// Guarantee non-empty lastName to satisfy schema
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
										if (auth0User?.email_verified && !existing.isEmailVerified) updates.isEmailVerified = true;
										if (!existing.profileImage && auth0User?.picture) updates.profileImage = auth0User.picture;
										if (Object.keys(updates).length) {
											await User.updateOne({ email }, { $set: updates });
										}
									}
								}
							} catch (e) {
								console.error('Auth0 afterCallback provisioning error:', e);
							}
							return session;
						},
					});
				} catch (error) {
					logStateCookieDiagnostics(reqInner, error);
					
					// Enhanced error logging to see actual Auth0 error
					console.error('[Auth0] Detailed callback error:', {
						message: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
						environment: process.env.VERCEL_ENV,
						baseUrl: process.env.AUTH0_BASE_URL,
						host: reqInner.headers.host,
						url: reqInner.url,
						method: reqInner.method,
						errorType: typeof error,
						errorName: error instanceof Error ? error.name : 'Unknown'
					});
					
					// More specific error handling based on actual Auth0 errors
					if (error instanceof Error) {
						let errorMessage = 'Authentication error occurred';
						let errorDetails = error.message;
						
						// Log the raw error for debugging
						console.log('[Auth0] Raw error analysis:', {
							fullMessage: error.message,
							stack: error.stack,
							hasCallbackMismatch: /Callback URL|redirect_uri|Invalid redirect/i.test(error.message),
							hasAccessDenied: /access_denied/i.test(error.message),
							hasUnauthorized: /Unauthorized/i.test(error.message),
							hasStateCookie: /Missing state cookie/i.test(error.message)
						});
						
						// Check for specific Auth0 error patterns - be more specific about error matching
						if (/Missing state cookie/i.test(error.message)) {
							errorMessage = 'Auth0 state cookie missing';
							errorDetails = 'Authentication state was lost. Please try logging in again.';
						} else if (/access_denied/i.test(error.message)) {
							// Handle access_denied errors first (more specific than callback URL issues)
							errorMessage = 'Auth0 application access denied';
							
							if (process.env.VERCEL_ENV === 'preview') {
								errorDetails = `Auth0 application rejected the authentication request.

COMMON CAUSES & SOLUTIONS:

1. **Application Type Configuration**
   → Go to Auth0 Dashboard → Applications → Your Dev Application → Settings
   → Ensure "Application Type" is set to "Regular Web Application"
   → NOT "Single Page Application" or "Machine to Machine"

2. **Grant Types**
   → In Application Settings → Advanced Settings → Grant Types
   → Ensure these are CHECKED:
     ✓ Authorization Code
     ✓ Refresh Token
     ✓ Client Credentials (optional)

3. **Token Endpoint Authentication Method**
   → In Advanced Settings → OAuth
   → Set to "POST" (recommended) or "Basic"

4. **Application Login URI** (if required)
   → In Application Settings → Application Login URI
   → Set to: https://${reqInner.headers.host || 'your-domain'}/api/auth/login

5. **User Assignment** (if enabled)
   → Go to Auth0 Dashboard → Applications → Your Dev Application → Users
   → Ensure your user is assigned to this application
   → Or disable "Require user consent" in Advanced Settings

6. **Application Status**
   → Verify the application is not disabled
   → Check application is in the correct Auth0 tenant/environment

7. **Environment Variables**
   → Verify AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET match your DEV application
   → NOT your production application credentials

Current configuration:
- Auth0 Domain: ${process.env.AUTH0_ISSUER_BASE_URL}
- Client ID: ${process.env.AUTH0_CLIENT_ID ? `${process.env.AUTH0_CLIENT_ID.substring(0, 8)}...` : 'MISSING'}
- Environment: ${process.env.VERCEL_ENV}
- Base URL: ${process.env.AUTH0_BASE_URL}

Auth0 Error: ${error.message}`;
							} else {
								errorDetails = `Auth0 application access denied: ${error.message}`;
							}
						} else if (/Callback URL|redirect_uri|Invalid redirect/i.test(error.message)) {
							errorMessage = 'Auth0 callback URL mismatch';
							
							if (process.env.VERCEL_ENV === 'preview') {
								const host = reqInner.headers.host;
								const baseUrl = process.env.AUTH0_BASE_URL;
								
								// Check if wildcards are likely configured by looking for specific Auth0 error messages
								const hasWildcardError = /wildcard|pattern|\*\.vercel\.app/i.test(error.message);
								
								if (hasWildcardError) {
									errorDetails = `Auth0 wildcard pattern issue detected.

Your Auth0 application may have wildcard patterns configured, but Auth0 is still rejecting the callback URL.

ADVANCED TROUBLESHOOTING:
1. **Verify wildcard syntax** - Ensure wildcards use EXACTLY this format:
   - https://*.vercel.app/api/auth/callback (with asterisk)
   - NOT https://www.vercel.app/api/auth/callback
   - NOT https://{subdomain}.vercel.app/api/auth/callback

2. **Check Auth0 Application Type**
   → Must be "Regular Web Application" for wildcards to work
   → "Single Page Application" may not support wildcards

3. **Auth0 Cache Issue**
   → Changes can take up to 5 minutes to propagate
   → Try waiting longer or contact Auth0 support

4. **Auth0 Plan Limitations**
   → Some Auth0 plans may have wildcard restrictions
   → Check your Auth0 plan supports wildcard callback URLs

Current error: ${error.message}
Preview URL: https://${host}
Base URL: ${baseUrl}`;
								} else {
									errorDetails = `Auth0 callback URL validation failed for preview deployment.

Current details:
- Preview URL: https://${host}
- Configured base URL: ${baseUrl}
- Raw Auth0 error: ${error.message}

VERIFICATION STEPS:
1. Check Auth0 Dashboard → Applications → Your Dev Application → Settings
2. Verify these patterns are present and SAVED:

Allowed Callback URLs:
https://allthingswetaskiwin.ca/api/auth/callback,
https://*.vercel.app/api/auth/callback,
http://localhost:3000/api/auth/callback

Allowed Logout URLs:
https://allthingswetaskiwin.ca/api/auth/logout,
https://*.vercel.app/api/auth/logout,
http://localhost:3000/api/auth/logout

Allowed Web Origins:
https://allthingswetaskiwin.ca,
https://*.vercel.app,
http://localhost:3000

3. Click "Save Changes" and wait 2-3 minutes
4. Ensure application type is "Regular Web Application"

If patterns are configured correctly and issue persists, this may indicate an Auth0 service issue.`;
								}
							} else {
								errorDetails = `Callback URL mismatch: ${error.message}`;
							}
						} else if (/audience|scope|client_id/i.test(error.message)) {
							errorMessage = 'Auth0 configuration error';
							errorDetails = `Auth0 application configuration issue: ${error.message}`;
						} else {
							// Unknown error - provide the actual error message for debugging
							errorMessage = 'Auth0 authentication failed';
							errorDetails = `Unexpected Auth0 error: ${error.message}`;
						}
						
						return resInner.status(400).json({ 
							success: false, 
							error: errorMessage,
							details: errorDetails,
							environment: process.env.VERCEL_ENV || 'development',
							baseUrl: process.env.AUTH0_BASE_URL,
							actualError: error.message // Include actual error for debugging
						});
					}
					
					resInner.status(500).end('Authentication error');
				}
			},
		});
		await wrapped(req, res);
	};
}

export default function wrappedExport(req: NextApiRequest, res: NextApiResponse) {
	return handler(req, res);
}
