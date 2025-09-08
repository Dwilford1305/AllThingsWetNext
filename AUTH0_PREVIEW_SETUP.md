# Auth0 Preview Environment Setup Guide

This guide explains how to configure Auth0 to work with Vercel preview deployments and resolve authentication issues in preview builds.

## Problem

Auth0 authentication works in production but fails in Vercel preview deployments with errors like:
- "Missing state cookie"
- "Callback URL mismatch" 
- "Invalid redirect_uri"

## Root Cause

Vercel preview deployments generate unique URLs for each deployment (e.g., `https://your-app-abc123.vercel.app`), but Auth0 applications require pre-configured callback URLs. Since preview URLs are dynamic, they're not registered in your Auth0 application settings.

## Solution

### 1. Configure Auth0 Application Settings

In your Auth0 Dashboard, add wildcard patterns to support all preview deployments:

#### Allowed Callback URLs
Add these patterns to your Auth0 application:
```
https://your-production-domain.com/api/auth/callback
https://*.vercel.app/api/auth/callback
```

#### Allowed Logout URLs
```
https://your-production-domain.com/api/auth/logout
https://*.vercel.app/api/auth/logout
```

#### Allowed Web Origins
```
https://your-production-domain.com
https://*.vercel.app
```

### 2. Vercel Environment Variables

Ensure these environment variables are set in your Vercel project:

#### For Preview Deployments
```env
AUTH0_SECRET=your_auth0_secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
# AUTH0_BASE_URL is automatically derived from VERCEL_URL
```

#### Notes:
- `AUTH0_BASE_URL` should NOT be set to a fixed value for preview deployments
- The system automatically detects the preview URL and configures Auth0 accordingly
- Vercel automatically provides `VERCEL_URL` and `VERCEL_ENV` variables

### 3. Verify Configuration

After configuring Auth0 and Vercel:

1. Deploy a preview build
2. Check the Auth0 logs for dynamic URL detection:
   ```
   [Auth0] Preview environment detected - Dynamic base URL correction applied
   [Auth0] New base URL: https://your-app-abc123.vercel.app
   ```
3. Test authentication flow in the preview environment

### 4. Environment-Specific Configuration

#### Development (localhost)
```env
AUTH0_BASE_URL=http://localhost:3000
```

#### Production
```env
AUTH0_BASE_URL=https://your-production-domain.com
```

#### Preview (Vercel)
```env
# No AUTH0_BASE_URL needed - automatically derived
```

### 5. Auth0 Dashboard Configuration Steps

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** → Your Application
3. Go to **Settings** tab
4. Update these fields:

   **Allowed Callback URLs:**
   ```
   https://allthingswetaskiwin.ca/api/auth/callback,
   https://*.vercel.app/api/auth/callback,
   http://localhost:3000/api/auth/callback
   ```

   **Allowed Logout URLs:**
   ```
   https://allthingswetaskiwin.ca/api/auth/logout,
   https://*.vercel.app/api/auth/logout,
   http://localhost:3000/api/auth/logout
   ```

   **Allowed Web Origins:**
   ```
   https://allthingswetaskiwin.ca,
   https://*.vercel.app,
   http://localhost:3000
   ```

5. Click **Save Changes**

### 6. Testing Different Environments

#### Test Production
```bash
# Should work without issues
curl https://allthingswetaskiwin.ca/api/auth/me
```

#### Test Preview
```bash
# Replace with actual preview URL
curl https://your-app-abc123.vercel.app/api/auth/me
```

#### Test Local Development
```bash
curl http://localhost:3000/api/auth/me
```

## Troubleshooting

### Issue: "Missing state cookie"
**Cause:** Auth0 callback URL not registered  
**Solution:** Ensure wildcard patterns are added to Auth0 application settings

### Issue: "Callback URL mismatch"
**Cause:** Preview URL not in allowed callback URLs  
**Solution:** Add `https://*.vercel.app/api/auth/callback` to Auth0 settings

### Issue: Authentication works locally but not in preview
**Cause:** Environment variable mismatch  
**Solution:** Remove fixed `AUTH0_BASE_URL` from preview environment variables

### Issue: Infinite redirect loops
**Cause:** Conflicting base URL configuration  
**Solution:** Let the system auto-detect preview URLs, don't override manually

## Security Considerations

### Wildcard Domains
Using `*.vercel.app` in Auth0 settings allows any Vercel app to authenticate with your Auth0 application. For maximum security:

1. Use specific preview URL patterns if possible
2. Monitor Auth0 logs for unexpected authentication attempts
3. Consider separate Auth0 applications for development/preview vs production

### Environment Variable Security
- Never commit Auth0 secrets to version control
- Use Vercel's environment variable encryption
- Rotate secrets regularly
- Use different Auth0 applications for different environments

## Additional Resources

- [Auth0 Next.js Quickstart](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Auth0 Application Settings](https://auth0.com/docs/applications/application-settings)