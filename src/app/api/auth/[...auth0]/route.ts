import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
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

// Enhanced Auth0 handler for App Router with comprehensive logging and error handling
export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/'
  }),
  logout: handleLogout({
    returnTo: '/'
  }),
  callback: handleCallback({
    // Use any for session to avoid tight coupling to Auth0's Session type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterCallback: async (req: NextApiRequest, res: NextApiResponse, session: any) => {
      try {
        console.log('[Auth0 App Router] Callback afterCallback triggered:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email || 'none',
          environment: process.env.VERCEL_ENV,
          host: req.headers.host,
          url: req.url
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

export const POST = GET;