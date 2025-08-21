// Centralized CSRF token utilities
// Reads the csrfToken cookie and provides helper to attach header
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  return document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1] || null;
}

export function withCsrfHeaders(init: RequestInit = {}): RequestInit {
  const token = getCsrfToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', token);
  return { ...init, headers };
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  if (['POST','PUT','PATCH','DELETE'].includes(method)) {
    return fetch(input, withCsrfHeaders(init));
  }
  return fetch(input, init);
}
