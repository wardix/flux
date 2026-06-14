import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('Workspaces Route', () => {
  let userId: number
  let workspaceId: number
  let token: string

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('workspaces_route_test@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id

    const tokenPayload = {
      sub: userId,
      email: 'workspaces_route_test@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    token = await sign(tokenPayload, 'your-jwt-secret-here-change-in-production')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('POST /api/workspaces - should create a workspace', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'Test Workspace' }),
      }),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.data.name).toBe('Test Workspace')
    workspaceId = body.data.id
  })

  test('GET /api/workspaces - should get user workspaces', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/workspaces', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.length).toBeGreaterThan(0)
  })

  test('GET /api/workspaces/:id/members - should get workspace members', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.length).toBe(1)
  })
})
