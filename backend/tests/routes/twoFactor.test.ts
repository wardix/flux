import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'
import * as twoFactorService from '../../src/services/twoFactorService'

describe('Two-Factor Authentication (2FA)', () => {
  let userId: number
  let testToken: string
  let user2faEnabledToken: string
  let user2faEnabledId: number
  let tempToken: string
  let secret: string

  beforeAll(async () => {
    // Create first test user (normal)
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('2fa_test_normal@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id
    testToken = await sign(
      {
        sub: userId,
        email: '2fa_test_normal@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
    )

    // Create second test user (2FA enabled)
    const userResult2 = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('2fa_test_enabled@example.com', 'hashed')
      RETURNING id
    `
    user2faEnabledId = userResult2[0].id
    user2faEnabledToken = await sign(
      {
        sub: user2faEnabledId,
        email: '2fa_test_enabled@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
    )

    // Insert 2FA config for second user
    secret = twoFactorService.generateSecret()
    const hashedCodes = await twoFactorService.hashRecoveryCodes(['abcde-12345'])
    await db`
      INSERT INTO user_2fa (user_id, secret, enabled, recovery_codes)
      VALUES (${user2faEnabledId}, ${secret}, true, ${`{${hashedCodes.join(',')}}`})
    `

    // Generate temp token for testing 2FA Login Flow
    tempToken = await sign(
      {
        sub: user2faEnabledId,
        email: '2fa_test_enabled@example.com',
        temp: true,
        exp: Math.floor(Date.now() / 1000) + 300,
      },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
    )
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id IN (${userId}, ${user2faEnabledId})`
  })

  describe('POST /api/auth/2fa/setup', () => {
    test('should return QR code and secret', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/2fa/setup', {
          method: 'POST',
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data).toHaveProperty('secret')
      expect(data).toHaveProperty('qr_code_url')
      expect(data.qr_code_url).toMatch(/^data:image\/png;base64,/)
    })

    test('should return 409 if 2FA already enabled', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/2fa/setup', {
          method: 'POST',
          headers: { Authorization: `Bearer ${user2faEnabledToken}` },
        }),
      )
      expect(res.status).toBe(409)
    })

    test('should return 401 without auth', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/2fa/setup', {
          method: 'POST',
        }),
      )
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/auth/2fa/verify', () => {
    test('should enable 2FA with valid TOTP code', async () => {
      // First, get the secret from user_2fa (inserted during normal test setup above)
      const existing = await db`SELECT secret FROM user_2fa WHERE user_id = ${userId}`
      const userSecret = existing[0].secret

      // Generate valid TOTP code
      const { TOTP } = await import('otpauth')
      const totp = new TOTP({ secret: userSecret })
      const validTOTPCode = totp.generate()

      const res = await app.fetch(
        new Request('http://localhost/api/auth/2fa/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testToken}`,
          },
          body: JSON.stringify({ code: validTOTPCode }),
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.enabled).toBe(true)
      expect(data.recovery_codes).toHaveLength(10)
    })

    test('should return 400 with invalid TOTP code', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/2fa/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testToken}`,
          },
          body: JSON.stringify({ code: '000000' }),
        }),
      )
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/2fa/disable', () => {
    test('should disable 2FA with valid code', async () => {
      const { TOTP } = await import('otpauth')
      const totp = new TOTP({ secret })
      const validTOTPCode = totp.generate()

      const res = await app.fetch(
        new Request('http://localhost/api/auth/2fa/disable', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user2faEnabledToken}`,
          },
          body: JSON.stringify({ code: validTOTPCode }),
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.enabled).toBe(false)
    })
  })

  describe('2FA Login Flow', () => {
    test('should require 2FA code if enabled', async () => {
      // Re-enable 2FA for user2faEnabledId first (disabled in previous test step)
      await db`UPDATE user_2fa SET enabled = true WHERE user_id = ${user2faEnabledId}`

      // Create argon2 hash for password check
      const passwordHash = await (await import('argon2')).hash('pass123')
      await db`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${user2faEnabledId}`

      const res = await app.fetch(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: '2fa_test_enabled@example.com', password: 'pass123' }),
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.requires_2fa).toBe(true)
      expect(body.data.temp_token).toBeTruthy()
      tempToken = body.data.temp_token
    })

    test('should return full token after valid 2FA code', async () => {
      const { TOTP } = await import('otpauth')
      const totp = new TOTP({ secret })
      const validCode = totp.generate()

      const res = await app.fetch(
        new Request('http://localhost/api/auth/2fa/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temp_token: tempToken, code: validCode }),
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.token).toBeTruthy()
      expect(data.user).toHaveProperty('id')
    })
  })
})
