import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'

describe('Cards Route', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let token: string

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('cards_route_test@example.com', 'hashed')
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
      VALUES (${workspaceId}, 'Route Board for Cards', ${userId})
      RETURNING id
    `
    boardId = boardResult[0].id

    const listResult = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Route List for Cards')
      RETURNING id
    `
    listId = listResult[0].id

    const tokenPayload = {
      sub: userId,
      email: 'cards_route_test@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    token = await sign(tokenPayload, process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('POST /api/cards - should create a card', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          list_id: listId,
          title: 'Route Card',
          description: 'Test card details',
        }),
      }),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.data.title).toBe('Route Card')
    cardId = body.data.id
  })

  test('PUT /api/cards/:id - should update card', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'Updated Route Card', story_points: 3 }),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.title).toBe('Updated Route Card')
    expect(body.data.story_points).toBe(3)
  })

  test('PUT /api/cards/positions - should update positions in batch', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/cards/positions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cards: [{ id: cardId, list_id: listId, position: 10 }],
        }),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('DELETE /api/cards/:id - should delete card', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )
    expect(res.status).toBe(204)
  })
})
