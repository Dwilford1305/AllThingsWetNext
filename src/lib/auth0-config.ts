// Auth0 configuration for Next.js
export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  scope: 'openid profile email',
  redirectUri: process.env.AUTH0_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  postLogoutRedirectUri: process.env.AUTH0_POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000/',
  session: {
    cookieSecret: process.env.AUTH0_COOKIE_SECRET!,
    cookieLifetime: 60 * 60 * 8, // 8 hours
  },
};
