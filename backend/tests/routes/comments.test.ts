import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'

describe('Comments & Activity API', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let commentId: number
  let testToken: string

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('comment_test_user@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id

    const workspaceResult = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Comment Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspaceResult[0].id

    const boardResult = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Comment Board', ${userId})
      RETURNING id
    `
    boardId = boardResult[0].id

    const listResult = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Comment List')
      RETURNING id
    `
    listId = listResult[0].id

    const cardResult = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'Card with Comments')
      RETURNING id
    `
    cardId = cardResult[0].id

    const tokenPayload = {
      sub: userId,
      email: 'comment_test_user@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    testToken = await sign(tokenPayload, process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('POST /api/cards/:id/comments > should add a comment', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'This is a test comment',
        }),
      }),
    )

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.data.content).toBe('This is a test comment')
    expect(json.data.user_email).toBe('comment_test_user@example.com')
    commentId = json.data.id
  })

  test('GET /api/cards/:id/comments > should get comments', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/comments`, {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBe(1)
    expect(json[0].content).toBe('This is a test comment')
  })

  test('PUT /api/cards/:cardId/comments/:commentId > should update comment', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Updated test comment',
        }),
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.data.content).toBe('Updated test comment')
  })

  test('GET /api/cards/:id/activities > should get activity log with comment add logged', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/activities`, {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(Array.isArray(json)).toBe(true)
    // Should have 'created' and 'added_comment' activity logs!
    expect(json.length).toBeGreaterThanOrEqual(1)
    const actions = json.map((a) => a.action)
    expect(actions).toContain('added_comment')
  })

  test('DELETE /api/cards/:cardId/comments/:commentId > should delete comment', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      }),
    )

    expect(response.status).toBe(204)
  })
})
