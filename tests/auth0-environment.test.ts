import { initializeAuth0Environment, environmentHelpers } from '@/lib/auth0-config';

describe('Auth0 Environment Configuration', () => {
  beforeEach(() => {
    // Clean up environment variables before each test
    delete process.env.AUTH0_BASE_URL;
    delete process.env.AUTH0_ISSUER_BASE_URL;
    delete process.env.AUTH0_REDIRECT_URI;
    delete process.env.AUTH0_POST_LOGOUT_REDIRECT_URI;
  });

  afterEach(() => {
    // Clean up after each test
    delete process.env.AUTH0_BASE_URL;
    delete process.env.AUTH0_ISSUER_BASE_URL;
    delete process.env.AUTH0_REDIRECT_URI;
    delete process.env.AUTH0_POST_LOGOUT_REDIRECT_URI;
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_URL;
    });

    test('should set localhost URL for development', () => {
      initializeAuth0Environment();
      expect(process.env.AUTH0_BASE_URL).toBe('http://localhost:3000');
    });

    test('should respect existing AUTH0_BASE_URL', () => {
      process.env.AUTH0_BASE_URL = 'http://localhost:4000';
      initializeAuth0Environment();
      expect(process.env.AUTH0_BASE_URL).toBe('http://localhost:4000');
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'production';
      delete process.env.VERCEL_URL;
    });

    test('should set production URL when no VERCEL_URL', () => {
      initializeAuth0Environment();
      expect(process.env.AUTH0_BASE_URL).toBe('https://allthingswetaskiwin.ca');
    });

    test('should use VERCEL_URL when available', () => {
      process.env.VERCEL_URL = 'myapp-123.vercel.app';
      initializeAuth0Environment();
      expect(process.env.AUTH0_BASE_URL).toBe('https://myapp-123.vercel.app');
    });
  });

  describe('Preview Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'preview';
    });

    test('should use preview URL from VERCEL_URL', () => {
      process.env.VERCEL_URL = 'myapp-preview-123.vercel.app';
      initializeAuth0Environment();
      expect(process.env.AUTH0_BASE_URL).toBe('https://myapp-preview-123.vercel.app');
    });

    test('should set correct callback URLs for preview', () => {
      process.env.VERCEL_URL = 'myapp-preview-456.vercel.app';
      initializeAuth0Environment();
      expect(process.env.AUTH0_REDIRECT_URI).toBe('https://myapp-preview-456.vercel.app/api/auth/callback');
      expect(process.env.AUTH0_POST_LOGOUT_REDIRECT_URI).toBe('https://myapp-preview-456.vercel.app');
    });
  });

  describe('Auth0 Domain Configuration', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('should format Auth0 domain with https', () => {
      process.env.AUTH0_DOMAIN = 'myapp.auth0.com';
      initializeAuth0Environment();
      expect(process.env.AUTH0_ISSUER_BASE_URL).toBe('https://myapp.auth0.com');
    });

    test('should not modify domain that already has https', () => {
      process.env.AUTH0_DOMAIN = 'https://myapp.auth0.com';
      initializeAuth0Environment();
      expect(process.env.AUTH0_ISSUER_BASE_URL).toBe('https://myapp.auth0.com');
    });
  });

  describe('Environment Helpers', () => {
    test('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      expect(environmentHelpers.isDevelopment()).toBe(true);
      expect(environmentHelpers.isProduction()).toBe(false);
    });

    test('should detect Vercel preview environment', () => {
      process.env.VERCEL_ENV = 'preview';
      expect(environmentHelpers.isVercelPreview()).toBe(true);
      expect(environmentHelpers.getEnvironmentName()).toBe('preview');
    });

    test('should detect Vercel production environment', () => {
      process.env.VERCEL_ENV = 'production';
      expect(environmentHelpers.isVercelProduction()).toBe(true);
      expect(environmentHelpers.getEnvironmentName()).toBe('production');
    });
  });
});