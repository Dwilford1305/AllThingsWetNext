// Centralized CSRF token utilities
// Reads the csrfToken cookie and provides helper to attach header
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  return document.cookie.split('; ').find(c=>c.startsWith('csrfToken='))?.split('=')[1] || null;
}

// Ensure we have a CSRF cookie set on the client for double-submit protection
export function ensureCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  let token = getCsrfToken();
  if (!token) {
    // Generate a simple random token
    const array = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
    }
    token = Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
    // Set cookie (not HttpOnly so client can read; SameSite=Lax for CSRF safety)
    const isSecure = typeof location !== 'undefined' ? location.protocol === 'https:' : true;
    document.cookie = `csrfToken=${token}; path=/; SameSite=Lax; ${isSecure ? 'Secure;' : ''} max-age=86400`;
  }
  return token;
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
