# Auth0 Authentication System

## Overview

This application uses Auth0 for authentication with environment-aware URL configuration to support both production and preview deployments. The system is designed to work seamlessly across development, production, and Vercel preview environments.

## Key Features

- **Environment-Aware URLs**: Automatically configures Auth0 callback URLs for different environments
- **Vercel Preview Support**: Properly handles authentication in preview deployments
- **Security-First**: Uses modern Auth0 SDK with secure defaults
- **Hybrid Architecture**: Supports both Auth0 and custom JWT (for existing users)

## Environment Configuration

### Required Environment Variables

```env
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_SECRET=your_32_character_random_string
# or
AUTH0_COOKIE_SECRET=your_32_character_random_string

# Optional - will be auto-configured if not set
AUTH0_BASE_URL=https://your-domain.com
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_REDIRECT_URI=https://your-domain.com/api/auth/callback
AUTH0_POST_LOGOUT_REDIRECT_URI=https://your-domain.com
```

### Automatic URL Configuration

The system automatically configures Auth0 URLs based on the environment:

#### Development
- `AUTH0_BASE_URL`: `http://localhost:3000`
- Callbacks work locally for development

#### Production
- `AUTH0_BASE_URL`: Uses `VERCEL_URL` if available, otherwise `https://allthingswetaskiwin.ca`
- Automatic HTTPS configuration

#### Preview (Vercel)
- `AUTH0_BASE_URL`: Uses `https://${VERCEL_URL}` (e.g., `https://app-git-branch-user.vercel.app`)
- Each preview deployment gets unique callback URLs
- Solves the "login works in production but not preview" issue

## Architecture

### Files Structure

```
src/
├── lib/
│   └── auth0-config.ts          # Environment-aware Auth0 configuration
├── hooks/
│   └── useAuth.ts               # Unified auth hook (Auth0 + JWT fallback)
├── app/
│   ├── providers.tsx            # Auth0 UserProvider setup
│   └── api/auth/
│       ├── me/route.ts          # User profile API (Auth0 + DB sync)
│       └── profile/route.ts     # Profile management
└── lib/
    └── auth-middleware.ts       # Server-side auth middleware

pages/
└── api/auth/
    └── [...auth0].ts            # Auth0 handler (Pages Router)
```

### Authentication Flow

1. **Login**: User clicks login → redirected to Auth0 → callback creates/updates local user record
2. **Session**: Auth0 session maintained via secure HTTP-only cookies
3. **API Access**: Server APIs use Auth0 session + custom JWT fallback
4. **User Sync**: Auth0 user data automatically synced to local database

## Key Components

### Auth0 Environment Initialization

The `initializeAuth0Environment()` function ensures Auth0 has the correct URLs:

```typescript
import { initializeAuth0Environment } from '@/lib/auth0-config';

// Call before using any Auth0 functions
initializeAuth0Environment();
```

### Unified Auth Hook

The `useAuth` hook provides a consistent interface:

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { isAuthenticated, isLoading, user, getAuthHeaders } = useAuth();
  
  // Works with both Auth0 and JWT tokens
  const headers = getAuthHeaders();
}
```

### Server-Side Authentication

```typescript
import { getSession } from '@auth0/nextjs-auth0/edge';
import { initializeAuth0Environment } from '@/lib/auth0-config';

initializeAuth0Environment(); // Must call first

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  // Session available if user is authenticated
}
```

## Deployment Considerations

### Vercel Environment Variables

Set these in your Vercel project settings:

**Production & Preview:**
```
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_SECRET=your_32_character_random_string
```

**Optional (will be auto-configured):**
```
AUTH0_BASE_URL=https://allthingswetaskiwin.ca  # Only for production override
```

### Auth0 Dashboard Configuration

In your Auth0 application settings:

**Allowed Callback URLs:**
```
http://localhost:3000/api/auth/callback,
https://allthingswetaskiwin.ca/api/auth/callback,
https://*.vercel.app/api/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:3000,
https://allthingswetaskiwin.ca,
https://*.vercel.app
```

**Allowed Web Origins:**
```
http://localhost:3000,
https://allthingswetaskiwin.ca,
https://*.vercel.app
```

## Troubleshooting

### Preview Login Issues

**Problem**: Login works in production but fails in preview
**Solution**: Ensure `*.vercel.app` is allowed in Auth0 dashboard and environment initialization is working

**Debug**: Check console logs in development:
```
[Auth0] Setting AUTH0_BASE_URL to: https://app-git-branch-user.vercel.app
[Auth0] Environment: production, Vercel: preview, URL: app-git-branch-user.vercel.app
```

### Environment Detection

Use the helper functions to debug environment detection:

```typescript
import { environmentHelpers } from '@/lib/auth0-config';

console.log('Environment:', environmentHelpers.getEnvironmentName());
console.log('Is Preview:', environmentHelpers.isVercelPreview());
console.log('Base URL:', environmentHelpers.getBaseUrl());
```

### Common Issues

1. **CSRF Errors**: Ensure AUTH0_SECRET is set and consistent
2. **Callback Mismatch**: Check Auth0 dashboard allows your preview URLs
3. **Session Issues**: Verify cookie settings for your domain

## Security Notes

- All Auth0 communication uses HTTPS in production
- Session cookies are HTTP-only and secure
- CSRF protection enabled by default
- JWT tokens use secure fallback configuration

## Testing

Run the Auth0 configuration tests:

```bash
npm test -- --testPathPattern=auth0-environment.test.ts
```

Tests verify:
- Environment detection
- URL configuration
- Callback URL generation
- Domain formatting

## Migration Notes

### From Auth0 v2.x to v3.5.0

- ✅ Updated import paths (no `/client` or `/edge` suffixes needed)
- ✅ Fixed TypeScript types for callbacks
- ✅ Maintained backward compatibility
- ✅ Added environment-aware configuration

### Future Considerations

- Auth0 v4.x will require more significant API changes
- Consider consolidating custom JWT system if not needed
- Implement refresh token rotation for enhanced security