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
	// Common Vercel env vars
	const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
	return vercel?.replace(/\/$/, '');
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
	const modPromise = import('@auth0/nextjs-auth0');

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
				if (!configuredHost || configuredHost !== host) {
					const proto = (req.headers['x-forwarded-proto'] as string) || (configured.startsWith('http://') ? 'http' : 'https');
					process.env.AUTH0_BASE_URL = `${proto}://${host}`;
				}
			}
		} catch (e) {
			console.warn('[Auth0] baseURL dynamic override failed (continuing):', e);
		}
		const { handleAuth, handleCallback } = await modPromise;
		const wrapped = handleAuth({
			async callback(reqInner: NextApiRequest, resInner: NextApiResponse) {
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
					console.error('Auth0 callback error:', error);
					// If state cookie missing, surface clearer client error
					if (error instanceof Error && /Missing state cookie/i.test(error.message)) {
						return resInner.status(400).json({ success: false, error: 'Auth0 state cookie missing; verify AUTH0_BASE_URL, callback URL, and cookie settings.' });
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
