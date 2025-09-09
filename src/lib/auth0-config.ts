/**
 * Auth0 Environment Variable Configuration
 * 
 * This module ensures Auth0 environment variables are properly set for different
 * deployment environments (development, production, preview).
 * 
 * The Auth0 Next.js SDK reads configuration from environment variables,
 * so we need to ensure they're set correctly before the SDK initializes.
 */

/**
 * Determines the base URL for the current environment
 */
function getBaseUrl(): string {
  // Check for explicitly set base URL first (highest priority)
  if (process.env.AUTH0_BASE_URL) {
    return process.env.AUTH0_BASE_URL;
  }

  // Vercel preview/production URL detection (works for both preview and production)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Production fallback
  if (process.env.NODE_ENV === 'production') {
    return 'https://allthingswetaskiwin.ca';
  }

  // Final fallback
  return 'http://localhost:3000';
}

/**
 * Initialize Auth0 environment variables
 * This should be called before any Auth0 functions are used
 */
export function initializeAuth0Environment(): void {
  // Only set if not already configured
  if (!process.env.AUTH0_BASE_URL) {
    const baseUrl = getBaseUrl();
    process.env.AUTH0_BASE_URL = baseUrl;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Auth0] Setting AUTH0_BASE_URL to: ${baseUrl}`);
      console.log(`[Auth0] Environment: ${process.env.NODE_ENV}, Vercel: ${process.env.VERCEL_ENV}, URL: ${process.env.VERCEL_URL}`);
    }
  }

  // Ensure issuer base URL is properly formatted
  if (process.env.AUTH0_DOMAIN && !process.env.AUTH0_ISSUER_BASE_URL) {
    const domain = process.env.AUTH0_DOMAIN;
    process.env.AUTH0_ISSUER_BASE_URL = domain.startsWith('https://') 
      ? domain 
      : `https://${domain}`;
  }

  // Ensure redirect URIs are set if not provided
  if (!process.env.AUTH0_REDIRECT_URI) {
    process.env.AUTH0_REDIRECT_URI = `${process.env.AUTH0_BASE_URL}/api/auth/callback`;
  }
  
  if (!process.env.AUTH0_POST_LOGOUT_REDIRECT_URI) {
    process.env.AUTH0_POST_LOGOUT_REDIRECT_URI = process.env.AUTH0_BASE_URL;
  }
}

/**
 * Environment detection helpers
 */
export const environmentHelpers = {
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isVercelPreview: () => process.env.VERCEL_ENV === 'preview',
  isVercelProduction: () => process.env.VERCEL_ENV === 'production',
  getEnvironmentName: () => {
    if (process.env.VERCEL_ENV === 'preview') return 'preview';
    if (process.env.VERCEL_ENV === 'production') return 'production';
    if (process.env.NODE_ENV === 'development') return 'development';
    return 'unknown';
  },
  getBaseUrl,
};