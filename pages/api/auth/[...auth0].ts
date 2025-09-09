import { handleAuth, handleCallback, Session } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/auth';
import { randomUUID } from 'crypto';
import { initializeAuth0Environment } from '@/lib/auth0-config';

// Initialize Auth0 environment variables before using the SDK
initializeAuth0Environment();

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

// Customize Auth0 callback to ensure a local User record exists after login/signup
export default handleAuth({
	async callback(req: NextApiRequest, res: NextApiResponse) {
		try {
			await handleCallback(req, res, {
				afterCallback: async (_req: NextApiRequest, _res: NextApiResponse, session: Session | null | undefined): Promise<Session | undefined> => {
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
								// Light-touch sync for verified flag and picture on login
								const updates: Record<string, unknown> = {};
								if (auth0User?.email_verified && !existing.isEmailVerified) updates.isEmailVerified = true;
								if (!existing.profileImage && auth0User?.picture) updates.profileImage = auth0User.picture;
								if (Object.keys(updates).length) {
									await User.updateOne({ email }, { $set: updates });
								}
							}
						}
					} catch (e) {
						// Don't block login if provisioning fails; log on server
						console.error('Auth0 afterCallback provisioning error:', e);
					}
					return session || undefined;
				},
			});
		} catch (error) {
			console.error('Auth0 callback error:', error);
			res.status(500).end('Authentication error');
		}
	},
});
