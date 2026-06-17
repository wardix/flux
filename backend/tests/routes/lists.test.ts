import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'

describe('Lists Route', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let token: string

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('lists_route_test@example.com', 'hashed')
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
      VALUES (${workspaceId}, 'Route Board for Lists', ${userId})
      RETURNING id
    `
    boardId = boardResult[0].id

    const tokenPayload = {
      sub: userId,
      email: 'lists_route_test@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    token = await sign(tokenPayload, process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('POST /api/lists - should create a list', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ board_id: boardId, title: 'Route List' }),
      }),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.data.title).toBe('Route List')
    listId = body.data.id
  })

  test('PUT /api/lists/:id - should update list', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'Updated Route List', position: 5 }),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.title).toBe('Updated Route List')
    expect(body.data.position).toBe(5)
  })

  test('DELETE /api/lists/:id - should delete list', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/lists/${listId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )
    expect(res.status).toBe(204)
  })
})
