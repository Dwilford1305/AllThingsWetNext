/**
 * Make authenticated API requests using Auth0 session cookies
 * Auth0 handles session security, so we just need to include credentials
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Always include credentials to send Auth0 session cookies
  const fetchOptions: RequestInit = {
    ...options,
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