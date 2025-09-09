/**
 * Test suite to verify CSRF token handling in subscription upgrade components
 * This test validates that the fix for issue #95 is working correctly
 */

import { authenticatedFetch } from '@/lib/auth-fetch';
import { getCsrfToken, ensureCsrfCookie } from '@/lib/csrf';

// Mock browser APIs for Node environment
const mockDocument = {
  cookie: '',
};

const mockWindow = {
  crypto: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
  location: {
    protocol: 'https:',
  },
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
};

// Mock global objects
global.document = mockDocument as any;
global.window = mockWindow as any;
global.crypto = mockWindow.crypto as any;
global.location = mockWindow.location as any;
global.localStorage = mockWindow.localStorage as any;

// Mock fetch to verify CSRF headers are included
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CSRF Token Handling in Subscription Upgrades', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Clear cookies before each test
    mockDocument.cookie = '';
    (mockWindow.localStorage.getItem as jest.Mock).mockClear();
    (mockWindow.localStorage.setItem as jest.Mock).mockClear();
  });

  afterEach(() => {
    // Clean up localStorage mocks
    (mockWindow.localStorage.clear as jest.Mock).mockClear();
  });

  describe('CSRF Token Generation and Retrieval', () => {
    test('ensureCsrfCookie should generate a token if none exists', () => {
      const token = ensureCsrfCookie();
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(mockDocument.cookie).toContain(`csrfToken=${token}`);
    });

    test('getCsrfToken should retrieve existing token from cookie', () => {
      const testToken = 'abc123def456';
      mockDocument.cookie = `csrfToken=${testToken}; path=/`;
      
      const retrievedToken = getCsrfToken();
      expect(retrievedToken).toBe(testToken);
    });

    test('getCsrfToken should return null if no token exists', () => {
      const token = getCsrfToken();
      expect(token).toBeNull();
    });
  });

  describe('authenticatedFetch CSRF Handling', () => {
    test('should include CSRF token in POST request headers', async () => {
      // Set up a CSRF token
      const testToken = 'test-csrf-token-123';
      mockDocument.cookie = `csrfToken=${testToken}; path=/`;
      
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await authenticatedFetch('/api/marketplace/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionTier: 'gold', duration: 12 }),
      });

      // Verify fetch was called with CSRF headers
      expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/subscription', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-CSRF-Token': testToken,
        }),
        credentials: 'include',
        body: JSON.stringify({ subscriptionTier: 'gold', duration: 12 }),
      });
    });

    test('should include CSRF token in business subscription POST requests', async () => {
      const testToken = 'business-csrf-token-456';
      mockDocument.cookie = `csrfToken=${testToken}; path=/`;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await authenticatedFetch('/api/businesses/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessId: 'test-business',
          subscriptionTier: 'platinum',
          duration: 12 
        }),
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/businesses/subscription', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-CSRF-Token': testToken,
        }),
        credentials: 'include',
        body: JSON.stringify({ 
          businessId: 'test-business',
          subscriptionTier: 'platinum',
          duration: 12 
        }),
      });
    });

    test('should not include CSRF token in GET requests', async () => {
      const testToken = 'get-request-token';
      mockDocument.cookie = `csrfToken=${testToken}; path=/`;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await authenticatedFetch('/api/marketplace/subscription', {
        method: 'GET',
      });

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers;
      
      // For GET requests, CSRF token should not be included
      expect(headers.get('X-CSRF-Token')).toBeNull();
    });

    test('should generate CSRF token if none exists when making POST request', async () => {
      // Ensure no token exists initially
      expect(getCsrfToken()).toBeNull();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await authenticatedFetch('/api/marketplace/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionTier: 'silver', duration: 1 }),
      });

      // Verify a token was generated and used
      const generatedToken = getCsrfToken();
      expect(generatedToken).toBeTruthy();
      
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers.get('X-CSRF-Token')).toBe(generatedToken);
    });
  });

  describe('Component Integration Scenarios', () => {
    test('marketplace subscription upgrade should include CSRF token', async () => {
      // Simulate the exact flow from MarketplaceSubscription component
      const testToken = 'marketplace-upgrade-token';
      mockDocument.cookie = `csrfToken=${testToken}; path=/`;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          message: 'Subscription upgraded successfully' 
        }),
      });

      // Simulate the exact request from handleUpgrade function
      await authenticatedFetch('/api/marketplace/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionTier: 'gold',
          duration: 12,
          paymentId: 'test-payment-id'
        })
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/subscription', 
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-CSRF-Token': testToken,
          }),
          credentials: 'include',
        })
      );
    });

    test('business dashboard upgrade should include CSRF token', async () => {
      // Simulate the exact flow from BusinessDashboard component
      const testToken = 'business-dashboard-token';
      mockDocument.cookie = `csrfToken=${testToken}; path=/`;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          message: 'Business subscription upgraded' 
        }),
      });

      // Simulate handleUpgradeSuccess function
      await authenticatedFetch('/api/businesses/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionTier: 'platinum',
          duration: 12,
          paymentId: 'business-payment-id',
          businessId: 'test-business-123'
        })
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/businesses/subscription', 
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-CSRF-Token': testToken,
          }),
          credentials: 'include',
        })
      );
    });

    test('offer code validation should include CSRF token', async () => {
      // Simulate offer code validation from BusinessDashboard
      const testToken = 'offer-code-token';
      mockDocument.cookie = `csrfToken=${testToken}; path=/`;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          valid: true,
          discountAmount: 50
        }),
      });

      await authenticatedFetch('/api/businesses/validate-offer-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'SAVE50',
          currentTier: 'free',
          targetTier: 'gold',
          basePrice: 399.99
        })
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/businesses/validate-offer-code', 
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-CSRF-Token': testToken,
          }),
          credentials: 'include',
        })
      );
    });
  });

  describe('Error Prevention Validation', () => {
    test('should prevent the original CSRF error scenario', async () => {
      // This test validates that the fix prevents the original issue
      // where requests failed with "Invalid or missing CSRF token"
      
      // Generate a valid CSRF token
      const validToken = ensureCsrfCookie();
      expect(validToken).toBeTruthy();
      
      // Mock a successful API response (simulating the API accepting the token)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true, 
          message: 'Subscription upgraded successfully' 
        }),
      });

      // Make the request that would have previously failed
      const response = await authenticatedFetch('/api/marketplace/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionTier: 'gold',
          duration: 12
        })
      });

      // Verify the request included the CSRF token
      const callArgs = mockFetch.mock.calls[0];
      const requestHeaders = callArgs[1].headers;
      expect(requestHeaders.get('X-CSRF-Token')).toBe(validToken);
      
      // Verify the response indicates success (no CSRF error)
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.message).toContain('Subscription upgraded successfully');
    });
  });
});