import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'
import { limitMap } from '../../src/middleware/rateLimit'

async function makeRequest(path: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  const method = options.method || 'GET'
  const headers = options.headers || {}
  return await app.fetch(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: options.body,
    })
  )
}

describe('Rate Limiting Middleware', () => {
  let userId: number
  let testToken: string

  beforeAll(async () => {
    process.env.ENABLE_RATE_LIMIT = 'true'
    // 1. Create a test user
    const user = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('ratelimit_test@example.com', 'hashed')
      RETURNING id
    `
    userId = user[0].id

    // 2. Generate token
    testToken = await sign(
      { sub: userId, email: 'ratelimit_test@example.com' },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      'HS256'
    )
  })

  afterAll(async () => {
    delete process.env.ENABLE_RATE_LIMIT
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  beforeEach(() => {
    // Clear limitMap before each test to ensure isolation
    limitMap.clear()
  })

  test('should allow requests within limit', async () => {
    const res = await makeRequest('/api/boards', {
      headers: { Authorization: `Bearer ${testToken}` },
    })
    expect(res.status).not.toBe(429)
  })

  test('should return 429 when IP rate limit exceeded', async () => {
    // Send 101 requests sequentially without authentication to hit the IP limit
    let lastRes: Response | null = null
    for (let i = 0; i < 101; i++) {
      lastRes = await makeRequest('/api/boards')
    }
    
    expect(lastRes).not.toBeNull()
    expect(lastRes!.status).toBe(429)
    
    const body = await lastRes!.json()
    expect(body.error).toContain('Too many requests')
  })

  test('should include Retry-After header on 429', async () => {
    // Manually force a limit exceed in the map
    limitMap.set('ip:127.0.0.1', {
      count: 101,
      resetAt: Date.now() + 60000,
    })

    const res = await makeRequest('/api/boards')
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
  })
})
