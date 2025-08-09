import crypto from 'crypto'

// Basic RFC 6238 TOTP implementation (SHA1 / 30s window)
export function generateBase32Secret(length = 20): string {
  const random = crypto.randomBytes(length)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let output = ''
  for (let i = 0; i < random.length; i++) {
    output += alphabet[random[i] % alphabet.length]
  }
  return output
}

function base32ToBuffer(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const c of base32.replace(/=+$/,'')) {
    const val = alphabet.indexOf(c.toUpperCase())
    if (val === -1) continue
    bits += val.toString(2).padStart(5,'0')
  }
  const bytes: number[] = []
  for (let i=0;i+8<=bits.length;i+=8) bytes.push(parseInt(bits.substring(i,i+8),2))
  return Buffer.from(bytes)
}

export function generateTOTP(secret: string, timeStepSec = 30, digits = 6, timestamp = Date.now()): string {
  const counter = Math.floor(timestamp / 1000 / timeStepSec)
  const key = base32ToBuffer(secret)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = crypto.createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length-1] & 0xf
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset+1] & 0xff) << 16) | ((hmac[offset+2] & 0xff) << 8) | (hmac[offset+3] & 0xff)
  const str = (code % 10**digits).toString().padStart(digits,'0')
  return str
}

export function verifyTOTP(secret: string, token: string, window = 1, timeStepSec = 30, digits = 6): boolean {
  const now = Date.now()
  for (let w = -window; w <= window; w++) {
    const ts = now + w * timeStepSec * 1000
    if (generateTOTP(secret, timeStepSec, digits, ts) === token) return true
  }
  return false
}

export function generateBackupCodes(count = 5): string[] {
  return Array.from({ length: count }, () => crypto.randomBytes(5).toString('hex'))
}
