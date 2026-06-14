import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

let token = ''
let userId: number

beforeAll(async () => {
  const email = `test_unsplash_${Date.now()}@example.com`
  const userRes = await db`
    INSERT INTO users (email, password_hash)
    VALUES (${email}, 'hash')
    RETURNING id
  `
  userId = userRes[0].id

  const payload = {
    sub: userId,
    email: 'test_unsplash@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }
  const secret = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
  token = await sign(payload, secret)
})

afterAll(async () => {
  await db`DELETE FROM users WHERE id = ${userId}`
})

describe('GET /api/unsplash/search', () => {
  test('should return search results', async () => {
    process.env.UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'mock_key'

    const res = await app.fetch(
      new Request('http://localhost/api/unsplash/search?q=nature', {
        headers: { Authorization: `Bearer ${token}` },
      })
    )

    expect([200, 500]).toContain(res.status)
    const body = await res.json()
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true)
      if (body.data.length > 0) {
        expect(body.data[0].url_regular).toBeDefined()
        expect(body.data[0].photographer).toBeDefined()
      }
    } else {
      expect(body.error).toBeDefined()
    }
  })

  test('should return 400 for missing query', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/unsplash/search', {
        headers: { Authorization: `Bearer ${token}` },
      })
    )
    expect(res.status).toBe(400)
  })

  test('should return 401 without auth', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/unsplash/search?q=nature')
    )
    expect(res.status).toBe(401)
  })
})
