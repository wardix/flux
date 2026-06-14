import { afterAll, describe, expect, test } from 'bun:test'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('OAuth Routes', () => {
  afterAll(async () => {
    await db`DELETE FROM users WHERE email IN ('mock-google-user@test.com', 'mock-github-user@test.com', 'mock-facebook-user@test.com')`
  })

  describe('GET /api/auth/google', () => {
    test('should redirect to Google OAuth', async () => {
      const res = await app.fetch(new Request('http://localhost/api/auth/google'))
      expect(res.status).toBe(302)
      const location = res.headers.get('Location')
      expect(location).toContain('accounts.google.com')
    })
  })

  describe('GET /api/auth/github', () => {
    test('should redirect to GitHub OAuth', async () => {
      const res = await app.fetch(new Request('http://localhost/api/auth/github'))
      expect(res.status).toBe(302)
      const location = res.headers.get('Location')
      expect(location).toContain('github.com')
    })
  })

  describe('GET /api/auth/facebook', () => {
    test('should redirect to Facebook OAuth', async () => {
      const res = await app.fetch(new Request('http://localhost/api/auth/facebook'))
      expect(res.status).toBe(302)
      const location = res.headers.get('Location')
      expect(location).toContain('facebook.com')
    })
  })

  describe('OAuth Callback', () => {
    test('should create new user on first Google OAuth login callback', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/google/callback?code=mock-google-code', {
          headers: {
            Accept: 'application/json',
          },
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.token).toBeTruthy()
      expect(data.user.email).toBe('mock-google-user@test.com')

      // Verify user created in DB
      const user = await db`SELECT * FROM users WHERE email = 'mock-google-user@test.com'`
      expect(user).toHaveLength(1)

      // Verify linked account
      const linked = await db`SELECT * FROM oauth_accounts WHERE user_id = ${user[0].id}`
      expect(linked).toHaveLength(1)
      expect(linked[0].provider).toBe('google')
    })

    test('should link to existing user if email matches', async () => {
      // Create user first
      const email = 'mock-github-user@test.com'
      const existingRes = await db`
        INSERT INTO users (email, password_hash)
        VALUES (${email}, 'random-hash')
        RETURNING id
      `
      const existingUserId = existingRes[0].id

      // Trigger github callback mock
      const res = await app.fetch(
        new Request('http://localhost/api/auth/github/callback?code=mock-github-code', {
          headers: {
            Accept: 'application/json',
          },
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.token).toBeTruthy()

      // Should map to the same user
      expect(data.user.id).toBe(existingUserId)

      // Verify oauth_accounts entry created
      const linked = await db`SELECT * FROM oauth_accounts WHERE user_id = ${existingUserId}`
      expect(linked).toHaveLength(1)
      expect(linked[0].provider).toBe('github')
    })
  })
})
