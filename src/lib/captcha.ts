// CAPTCHA verification utility (placeholder implementation).
// Replace with real provider (hCaptcha / reCAPTCHA) by sending token to provider endpoint.
export async function verifyCaptcha(token?: string, _remoteIp?: string): Promise<{ success: boolean; error?: string }> {
  if (!token) return { success: false, error: 'Missing CAPTCHA token' }
  if (process.env.CAPTCHA_BYPASS === 'true' && token === 'dev_bypass') return { success: true }
  if (token.length < 10) return { success: false, error: 'Invalid CAPTCHA token' }
  // TODO: Real provider verification here.
  return { success: true }
}

export const CAPTCHA_REQUIRED = process.env.CAPTCHA_REQUIRED !== 'false'
