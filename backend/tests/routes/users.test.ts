import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'

async function makeRequest(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {},
) {
  const method = options.method || 'GET'
  const headers = options.headers || {}
  return await app.fetch(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: options.body,
    }),
  )
}

describe('Users API (locale)', () => {
  let userId: number
  let testToken: string

  beforeAll(async () => {
    // 1. Create a test user
    const user = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('locale_test@example.com', 'hashed')
      RETURNING id
    `
    userId = user[0].id

    // 2. Generate token
    testToken = await sign(
      { sub: userId, email: 'locale_test@example.com' },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      'HS256',
    )
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('PUT /api/users/me/locale > should update user locale preference to id', async () => {
    const res = await makeRequest('/api/users/me/locale', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ locale: 'id' }),
    })
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.locale).toBe('id')

    // Verify database is updated
    const dbUser = await db`SELECT locale FROM users WHERE id = ${userId}`
    expect(dbUser[0].locale).toBe('id')
  })

  test('PUT /api/users/me/locale > should return 400 for unsupported locale', async () => {
    const res = await makeRequest('/api/users/me/locale', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ locale: 'fr' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Invalid locale')
  })

  test('PUT /api/users/me/locale > should return 401 without auth', async () => {
    const res = await makeRequest('/api/users/me/locale', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locale: 'id' }),
    })
    expect(res.status).toBe(401)
  })
})
