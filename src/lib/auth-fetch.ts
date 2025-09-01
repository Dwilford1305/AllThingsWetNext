import { getCsrfToken, ensureCsrfCookie } from './csrf';

/**
 * Make authenticated API requests that work with both Auth0 and JWT token authentication
 * For Auth0 users, uses cookies automatically sent by browser
 * For JWT users, adds Authorization header
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);

  // Add CSRF token for state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
  // Ensure CSRF cookie exists before sending header
  if (typeof window !== 'undefined') ensureCsrfCookie();
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  // Add JWT token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Always include credentials to send cookies (for Auth0)
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  return fetch(url, fetchOptions);
}

/**
 * Authenticated fetch with JSON response parsing
 */
export async function authenticatedFetchJson<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await authenticatedFetch(url, options);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed'
    };
  }
}