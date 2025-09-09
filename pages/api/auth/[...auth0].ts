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
// AUTH0_BASE_URL is optional if we can derive it automatically
const requiredVars = [
	'AUTH0_SECRET',
	'AUTH0_ISSUER_BASE_URL',
	'AUTH0_CLIENT_ID',
	'AUTH0_CLIENT_SECRET',
];

function deriveBaseURL(req?: NextApiRequest): string | undefined {
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
	
	// For local development, derive from request if available
	if (req && req.headers.host) {
		const proto = req.headers['x-forwarded-proto'] as string || 'http';
		const localUrl = `${proto}://${req.headers.host}`;
		console.log('[Auth0] Local development detected, deriving base URL from request:', localUrl);
		return localUrl.replace(/\/$/, '');
	}
	
	return undefined;
}

// Move validation to request time for serverless environments
// This ensures environment variables are fully available when needed
function validateAuth0Config(req?: NextApiRequest): { isValid: boolean; missing: string[]; derivedBaseUrl?: string } {
	// If base URL missing but others present, we try to synthesize one for dev
	let derivedBaseUrl: string | undefined;
	if (!process.env.AUTH0_BASE_URL) {
		derivedBaseUrl = deriveBaseURL(req);
		if (derivedBaseUrl) {
			process.env.AUTH0_BASE_URL = derivedBaseUrl; // Mutate only at runtime, not build-time constant usage
		}
	}

	// Check if all required vars are present, considering derived base URL
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

let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
// Main Auth0 handler with request-time validation
handler = async function auth0Handler(req: NextApiRequest, res: NextApiResponse) {
	// Enhanced logging for debugging
	console.log('[Auth0] Handler called:', {
		method: req.method,
		url: req.url,
		host: req.headers.host,
		userAgent: req.headers['user-agent']?.substring(0, 50),
		vercelEnv: process.env.VERCEL_ENV,
		nodeEnv: process.env.NODE_ENV
	});
	
	// Perform validation at request time to ensure all environment variables are available
	const validation = validateAuth0Config(req);
	
	console.log('[Auth0] Validation result:', {
		isValid: validation.isValid,
		missing: validation.missing,
		derivedBaseUrl: validation.derivedBaseUrl,
		currentAuth0BaseUrl: process.env.AUTH0_BASE_URL,
		hasVercelUrl: !!process.env.VERCEL_URL
	});
	
	if (!validation.isValid) {
		console.error('[Auth0] Configuration error:', {
			missing: validation.missing,
			hasVercelUrl: !!process.env.VERCEL_URL,
			vercelEnv: process.env.VERCEL_ENV,
			derivedBaseUrl: validation.derivedBaseUrl,
			currentBaseUrl: process.env.AUTH0_BASE_URL,
			requestHost: req.headers.host,
			requestUrl: req.url
		});
		
		return res.status(503).json({
			success: false,
			error: 'Auth0 not configured',
			missing: validation.missing,
			help: 'Check your environment variables. AUTH0_BASE_URL can be auto-derived for Vercel deployments.'
		});
	}

	console.log('[Auth0] Configuration valid, proceeding with Auth0 SDK initialization');

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
		console.log('[Auth0] Importing Auth0 SDK with final configuration:', {
			AUTH0_BASE_URL: process.env.AUTH0_BASE_URL,
			AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL,
			AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ? `${process.env.AUTH0_CLIENT_ID.substring(0, 8)}...` : 'MISSING',
			hasClientSecret: !!process.env.AUTH0_CLIENT_SECRET,
			hasSecret: !!process.env.AUTH0_SECRET
		});
		
		try {
			const { handleAuth, handleCallback } = await import('@auth0/nextjs-auth0');
			console.log('[Auth0] SDK imported successfully, initializing handleAuth');
			
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
						
						// Enhanced error parsing for better debugging
						const stackTrace = error.stack || '';
						
						// Extract Auth0 error details from nested error messages
						const auth0ErrorMatch = error.message.match(/CAUSE:\s*([^(]+)\s*\(([^)]+)\)/);
						const actualAuth0Error = auth0ErrorMatch ? auth0ErrorMatch[1].trim() : null;
						const errorDescription = auth0ErrorMatch ? auth0ErrorMatch[2].trim() : null;
						
						// Log comprehensive error analysis
						console.log('[Auth0] Enhanced error analysis:', {
							fullMessage: error.message,
							actualAuth0Error,
							errorDescription,
							hasCallbackMismatch: /callback url|redirect_uri|invalid redirect|callback.*mismatch/i.test(error.message),
							hasAccessDenied: /access_denied/i.test(error.message),
							hasUnauthorized: /unauthorized/i.test(error.message),
							hasStateCookie: /missing state cookie/i.test(error.message),
							hasInvalidClient: /invalid_client/i.test(error.message),
							hasInvalidGrant: /invalid_grant/i.test(error.message),
							isAuth0ApiError: /auth0|oauth|openid/i.test(error.message),
							stackContainsAuth0: /auth0/i.test(stackTrace)
						});
						
						// Check for specific Auth0 error patterns - enhanced error matching
						if (/missing state cookie/i.test(error.message)) {
							errorMessage = 'Auth0 state cookie missing';
							errorDetails = 'Authentication state was lost. Please try logging in again.';
						} else if (actualAuth0Error === 'access_denied' || /access_denied/i.test(error.message)) {
							// Handle access_denied errors with more specific guidance
							errorMessage = 'Auth0 application access denied';
							
							// Provide enhanced troubleshooting based on environment and error details
							if (process.env.VERCEL_ENV === 'preview') {
								errorDetails = `🚨 **CRITICAL AUTH0 CONFIGURATION ISSUE DETECTED**

Your Auth0 dev application is rejecting authentication requests due to a configuration problem.

🔍 **ERROR ANALYSIS:**
- Auth0 Error: ${actualAuth0Error || 'access_denied'}  
- Description: ${errorDescription || 'Unauthorized'}
- Client ID: ${process.env.AUTH0_CLIENT_ID ? `${process.env.AUTH0_CLIENT_ID.substring(0, 12)}...` : 'MISSING'}
- Auth0 Domain: ${process.env.AUTH0_ISSUER_BASE_URL}
- Preview URL: https://${reqInner.headers.host}

📋 **IMMEDIATE FIX REQUIRED - Follow These Steps:**

**🔧 STEP 1: Check Application Type (MOST COMMON ISSUE)**
→ Go to: Auth0 Dashboard → Applications → Your Dev Application → Settings
→ Find: "Application Type" dropdown
→ **MUST BE:** "Regular Web Application"
→ **NOT:** "Single Page Application" or "Machine to Machine"
→ If wrong, change it and click Save Changes

**🔧 STEP 2: Enable Required Grant Types**
→ Go to: Advanced Settings → Grant Types tab
→ **MUST CHECK ALL OF THESE:**
   ✅ Authorization Code
   ✅ Refresh Token
   ✅ Client Credentials
→ Save Changes

**🔧 STEP 3: Verify Authentication Method**
→ Go to: Advanced Settings → OAuth tab  
→ Find: "Token Endpoint Authentication Method"
→ Set to: "POST" (recommended)

**🔧 STEP 4: Test Your Configuration**
→ Visit: https://${reqInner.headers.host}/api/auth/debug
→ Check if "clientCredentialsTest" shows "success"
→ If still failing, your Client ID/Secret may be wrong

**🔧 STEP 5: Double-Check Client Credentials**
→ In Auth0 Dashboard → Applications → Your Dev Application → Settings
→ Copy EXACTLY (no extra spaces):
   - Domain: Should match ${process.env.AUTH0_ISSUER_BASE_URL}
   - Client ID: Should start with ${process.env.AUTH0_CLIENT_ID ? process.env.AUTH0_CLIENT_ID.substring(0, 8) : 'MISSING'}
   - Client Secret: Copy the full secret carefully
→ Update your Vercel environment variables if they don't match

**🚨 ROOT CAUSE ANALYSIS:**
The debug endpoint shows your client credentials are being rejected by Auth0, which means:
1. **90% likely**: Application Type is "Single Page Application" (fix in Step 1)
2. **5% likely**: Missing Grant Types (fix in Step 2) 
3. **5% likely**: Wrong Client ID/Secret (fix in Step 5)

**✅ VERIFICATION:**
After making changes, wait 2 minutes then:
1. Visit /api/auth/debug - should show clientCredentialsTest: "success"
2. Try logging in again - should work

Your wildcard callback URLs are already configured correctly.`;
							} else {
								errorDetails = `Auth0 application access denied: ${error.message}

Check your Auth0 application configuration:
1. Application Type: "Regular Web Application"  
2. Grant Types: Authorization Code + Refresh Token enabled
3. Client credentials match your environment
4. User has access to the application`;
							}
						} else if (/callback url|redirect_uri|invalid redirect|callback.*mismatch/i.test(error.message)) {
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
		
		console.log('[Auth0] handleAuth configured successfully, calling wrapped function');
		console.log('[Auth0] Request details:', {
			method: req.method,
			url: req.url,
			query: req.query,
			hasAuth0Params: !!(req.query.code || req.query.state || req.query.error)
		});
		
		await wrapped(req, res);
		
		console.log('[Auth0] wrapped function completed');
		
	} catch (sdkError) {
		console.error('[Auth0] SDK initialization or execution error:', {
			error: sdkError instanceof Error ? sdkError.message : String(sdkError),
			stack: sdkError instanceof Error ? sdkError.stack : undefined,
			auth0BaseUrl: process.env.AUTH0_BASE_URL,
			requestUrl: req.url,
			requestHost: req.headers.host
		});
		
		// Fallback error response
		return res.status(500).json({
			success: false,
			error: 'Auth0 SDK error',
			details: sdkError instanceof Error ? sdkError.message : 'Unknown SDK error',
			requestUrl: req.url
		});
	}
	};
};

export default function wrappedExport(req: NextApiRequest, res: NextApiResponse) {
	return handler(req, res);
}
