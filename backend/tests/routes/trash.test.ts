import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('Archive & Trash Routes', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let token: string

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('trash_test_user@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id

    const workspaceResult = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Trash Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspaceResult[0].id

    const boardResult = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Trash Board', ${userId})
      RETURNING id
    `
    boardId = boardResult[0].id

    const listResult = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Trash List')
      RETURNING id
    `
    listId = listResult[0].id

    const cardResult = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'Trash Card')
      RETURNING id
    `
    cardId = cardResult[0].id

    const tokenPayload = {
      sub: userId,
      email: 'trash_test_user@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    token = await sign(tokenPayload, 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('PUT /api/cards/:id - should archive card', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ archived_at: new Date().toISOString() }),
      }),
    )
    expect(res.status).toBe(200)

    // Verify in archive
    const archRes = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}/archive`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    )
    expect(archRes.status).toBe(200)
    const body = await archRes.json()
    expect(body.data.cards.length).toBe(1)
    expect(body.data.cards[0].id).toBe(cardId)
  })

  test('PUT /api/cards/:id - should restore card', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ archived_at: null }),
      }),
    )
    expect(res.status).toBe(200)

    // Verify archive is empty
    const archRes = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}/archive`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    )
    const body = await archRes.json()
    expect(body.data.cards.length).toBe(0)
  })

  test('DELETE /api/cards/:id - should soft-delete card', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }),
    )
    expect(res.status).toBe(204)

    // Verify in trash
    const trashRes = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}/trash`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    )
    expect(trashRes.status).toBe(200)
    const body = await trashRes.json()
    expect(body.data.cards.length).toBe(1)
    expect(body.data.cards[0].id).toBe(cardId)
  })

  test('PUT /api/cards/:id - should restore card from trash', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deleted_at: null }),
      }),
    )
    expect(res.status).toBe(200)

    // Verify trash is empty
    const trashRes = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}/trash`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    )
    const body = await trashRes.json()
    expect(body.data.cards.length).toBe(0)
  })
})
