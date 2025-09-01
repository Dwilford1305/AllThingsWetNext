import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';
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

// Helper function to determine user role and create appropriate marketplace subscription
function createMarketplaceSubscription(email: string, role: string) {
	// Check if this email should be a super admin
	const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
	const isAdmin = adminEmail && email === adminEmail;
	
	if (isAdmin || role === 'super_admin') {
		return {
			tier: 'unlimited',
			status: 'active',
			adQuota: {
				monthly: 9999, // Unlimited
				used: 0,
				resetDate: new Date()
			},
			features: {
				featuredAds: true,
				analytics: true,
				prioritySupport: true,
				photoLimit: 99, // Unlimited photos
				adDuration: 365 // 1 year duration
			}
		};
	}
	
	// Default free subscription for regular users
	return {
		tier: 'free',
		status: 'inactive',
		adQuota: {
			monthly: 1,
			used: 0,
			resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
		},
		features: {
			featuredAds: false,
			analytics: false,
			prioritySupport: false,
			photoLimit: 1,
			adDuration: 30
		}
	};
}

// Customize Auth0 callback to ensure a local User record exists after login/signup
export default handleAuth({
	async callback(req, res) {
		try {
			await handleCallback(req, res, {
				afterCallback: async (_req, _res, session) => {
					try {
						await connectDB();
						const auth0User = session?.user as Auth0User | undefined;
						const email = auth0User?.email?.toLowerCase();
						if (email) {
							const existing = await User.findOne({ email });
							if (!existing) {
								const name = auth0User?.name || '';
								const [first = '', ...rest] = name.split(' ').filter(Boolean);
								
								// Determine if this should be a super admin
								const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
								const role = (adminEmail && email === adminEmail) ? 'super_admin' : 'user';
								const permissions = role === 'super_admin' ? [
									'manage_users',
									'manage_businesses', 
									'manage_content',
									'manage_scrapers',
									'view_analytics',
									'manage_payments',
									'system_settings',
									'super_admin'
								] : [];
								
								await User.create({
									id: `user_${randomUUID()}`,
									email,
									passwordHash: '',
									firstName: auth0User?.given_name || first || 'User',
									// Guarantee non-empty lastName to satisfy schema
									lastName: auth0User?.family_name || rest.join(' ') || 'User',
									role,
									permissions,
									isEmailVerified: !!auth0User?.email_verified,
									profileImage: auth0User?.picture || '',
									isActive: true,
									isSuspended: false,
									preferences: defaultPreferences,
									marketplaceSubscription: createMarketplaceSubscription(email, role),
								});
							} else {
								// Light-touch sync for verified flag, picture, and ensure proper subscription
								const updates: Record<string, unknown> = {};
								if (auth0User?.email_verified && !existing.isEmailVerified) updates.isEmailVerified = true;
								if (!existing.profileImage && auth0User?.picture) updates.profileImage = auth0User.picture;
								
								// Ensure super admins have unlimited marketplace subscription
								const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
								if (adminEmail && email === adminEmail && existing.role !== 'super_admin') {
									updates.role = 'super_admin';
									updates.permissions = [
										'manage_users',
										'manage_businesses', 
										'manage_content',
										'manage_scrapers',
										'view_analytics',
										'manage_payments',
										'system_settings',
										'super_admin'
									];
									updates.marketplaceSubscription = createMarketplaceSubscription(email, 'super_admin');
								} else if (existing.role === 'super_admin' && (!existing.marketplaceSubscription || existing.marketplaceSubscription.adQuota.monthly !== 9999)) {
									// Ensure existing super admins have unlimited quota
									updates.marketplaceSubscription = createMarketplaceSubscription(email, 'super_admin');
								}
								
								if (Object.keys(updates).length) {
									await User.updateOne({ email }, { $set: updates });
								}
							}
						}
					} catch (e) {
						// Don't block login if provisioning fails; log on server
						console.error('Auth0 afterCallback provisioning error:', e);
					}
					return session;
				},
			});
		} catch (error) {
			console.error('Auth0 callback error:', error);
			res.status(500).end('Authentication error');
		}
	},
});
