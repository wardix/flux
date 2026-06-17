import { afterAll, describe, expect, test } from 'bun:test'
import { db } from '../../src/db/index'
import { app } from '../../src/index'

describe('Auth Route', () => {
  const testEmail = 'auth_test_user@example.com'
  const testPassword = 'securepassword123'
  let token: string

  afterAll(async () => {
    await db`DELETE FROM users WHERE email = ${testEmail}`
  })

  test('POST /api/auth/register - should create user', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      }),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.data.email).toBe(testEmail)
  })

  test('POST /api/auth/register - should conflict on duplicate email', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      }),
    )
    expect(res.status).toBe(409)
  })

  test('POST /api/auth/login - should authenticate and return token', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.token).toBeDefined()
    token = body.data.token
  })

  test('GET /api/auth/me - should fail without token', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/auth/me', {
        method: 'GET',
      }),
    )
    expect(res.status).toBe(401)
  })

  test('GET /api/auth/me - should succeed with valid token', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.email).toBe(testEmail)
  })

  test('POST /api/auth/register - should return 403 when DISABLE_REGISTRATION=true', async () => {
    const originalValue = process.env.DISABLE_REGISTRATION
    process.env.DISABLE_REGISTRATION = 'true'

    const res = await app.fetch(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'blocked@example.com', password: 'password123' }),
      }),
    )
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Registration is currently disabled')

    // Restore env
    if (originalValue === undefined) {
      delete process.env.DISABLE_REGISTRATION
    } else {
      process.env.DISABLE_REGISTRATION = originalValue
    }
  })

  test('POST /api/auth/login - should still work when DISABLE_REGISTRATION=true', async () => {
    const originalValue = process.env.DISABLE_REGISTRATION
    process.env.DISABLE_REGISTRATION = 'true'

    const res = await app.fetch(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.token).toBeDefined()

    // Restore env
    if (originalValue === undefined) {
      delete process.env.DISABLE_REGISTRATION
    } else {
      process.env.DISABLE_REGISTRATION = originalValue
    }
  })
})
