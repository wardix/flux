import { TOTP } from 'otpauth'
import * as QRCode from 'qrcode'

/**
 * Generate a cryptographically secure 2FA secret (Base32 encoded).
 */
export function generateSecret(): string {
  // Generate a random 20-character secret (encoded in Base32)
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  const randomBytes = new Uint8Array(20)
  crypto.getRandomValues(randomBytes)
  for (let i = 0; i < randomBytes.length; i++) {
    secret += base32chars[randomBytes[i] % 32]
  }
  return secret
}

/**
 * Generate a TOTP object helper.
 */
function getTotp(email: string, secret: string): TOTP {
  return new TOTP({
    issuer: 'Flux',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  })
}

/**
 * Generate QR code data URL (base64 image/png) for Google Authenticator / other TOTP apps.
 */
export async function generateQRCode(email: string, secret: string): Promise<string> {
  const totp = getTotp(email, secret)
  const otpauthUrl = totp.toString()
  return await QRCode.toDataURL(otpauthUrl)
}

/**
 * Verify a 6-digit TOTP code.
 */
export function verifyTOTP(secret: string, code: string): boolean {
  const totp = new TOTP({
    issuer: 'Flux',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  })

  // Verify with a time window of 1 step (30 seconds) forward/backward
  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}

/**
 * Generate 10 random alphanumeric recovery codes.
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    // Generate a code like "xxxx-xxxx"
    const randomHex = () => Math.random().toString(36).substring(2, 6)
    codes.push(`${randomHex()}-${randomHex()}`)
  }
  return codes
}

/**
 * Hash recovery codes using Bun's native bcrypt implementation.
 */
export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return await Promise.all(codes.map((code) => Bun.password.hash(code)))
}

/**
 * Verify a recovery code against hashed recovery codes stored in the database.
 * Returns the index of the verified hashed code if correct, or -1 if invalid.
 */
export async function verifyRecoveryCode(code: string, hashedCodes: string[]): Promise<number> {
  for (let i = 0; i < hashedCodes.length; i++) {
    const match = await Bun.password.verify(code, hashedCodes[i])
    if (match) {
      return i
    }
  }
  return -1
}
