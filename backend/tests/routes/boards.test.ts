import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('Boards Route', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let token: string

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('boards_route_test@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id

    const workspaceResult = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Route Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspaceResult[0].id

    const tokenPayload = {
      sub: userId,
      email: 'boards_route_test@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    token = await sign(tokenPayload, 'your-jwt-secret-here-change-in-production')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('POST /api/boards - should create a board', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'Route Board', workspace_id: workspaceId }),
      }),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.data.title).toBe('Route Board')
    boardId = body.data.id
  })

  test('GET /api/boards - should list boards', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/boards', {
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

  test('GET /api/boards/:id - should get single board with lists', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe(boardId)
    expect(body.data.lists).toBeDefined()
  })

  test('PUT /api/boards/:id - should update board', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'Updated Route Board' }),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.title).toBe('Updated Route Board')
  })

  test('DELETE /api/boards/:id - should delete board', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )
    expect(res.status).toBe(204)

    const checkRes = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )
    expect(checkRes.status).toBe(404)
  })
})
