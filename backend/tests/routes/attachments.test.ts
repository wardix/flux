import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'

describe('Attachments API', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let attachmentId: number
  let testToken: string

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('attachment_test_user@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id

    const workspaceResult = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Attachment Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspaceResult[0].id

    const boardResult = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Attachment Board', ${userId})
      RETURNING id
    `
    boardId = boardResult[0].id

    const listResult = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Attachment List')
      RETURNING id
    `
    listId = listResult[0].id

    const cardResult = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'Card with Attachments')
      RETURNING id
    `
    cardId = cardResult[0].id

    const tokenPayload = {
      sub: userId,
      email: 'attachment_test_user@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    testToken = await sign(tokenPayload, process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('POST /api/cards/:id/attachments > should upload an attachment', async () => {
    const formData = new FormData()
    const blob = new Blob(['dummy content'], { type: 'text/plain' })
    formData.append('file', blob, 'test.txt')

    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
        body: formData,
      }),
    )

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.data.name).toBe('test.txt')
    expect(json.data.file_type).toContain('text/plain')
    expect(json.data.is_cover).toBe(false)
    attachmentId = json.data.id
  })

  test('GET /api/cards/:id/attachments > should get attachments', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/attachments`, {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBe(1)
    expect(json[0].name).toBe('test.txt')
  })

  test('PUT /api/cards/:cardId/attachments/:attachmentId/cover > should set cover', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/attachments/${attachmentId}/cover`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_cover: true,
        }),
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.data.is_cover).toBe(true)
  })

  test('DELETE /api/cards/:cardId/attachments/:attachmentId > should delete attachment', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      }),
    )

    expect(response.status).toBe(204)
  })
})
