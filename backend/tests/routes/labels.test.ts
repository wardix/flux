import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('Labels Route', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let labelId: number
  let token: string

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('labels_route_test@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id

    const workspaceResult = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Route Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspaceResult[0].id

    const boardResult = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Route Board for Labels', ${userId})
      RETURNING id
    `
    boardId = boardResult[0].id

    const tokenPayload = {
      sub: userId,
      email: 'labels_route_test@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    token = await sign(tokenPayload, 'your-jwt-secret-here-change-in-production')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('POST /api/labels - should create a label', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ board_id: boardId, name: 'Urgent', color: '#ef4444' }),
      }),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.data.name).toBe('Urgent')
    labelId = body.data.id
  })

  test('GET /api/labels?boardId=... - should get board labels', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/labels?boardId=${boardId}`, {
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

  test('DELETE /api/labels/:id - should delete label', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/labels/${labelId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )
    expect(res.status).toBe(204)
  })
})
