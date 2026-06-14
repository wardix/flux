import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('Subtasks API', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let parentCardId: number
  let subtaskId: number
  let noSubtaskCardId: number
  let testToken: string

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('subtask_test_user@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id

    const workspaceResult = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Subtask Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspaceResult[0].id

    const boardResult = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Subtask Board', ${userId})
      RETURNING id
    `
    boardId = boardResult[0].id

    const listResult = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Subtask List')
      RETURNING id
    `
    listId = listResult[0].id

    const parentCardResult = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'Parent Card')
      RETURNING id
    `
    parentCardId = parentCardResult[0].id

    const noSubtaskCardResult = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'No Subtask Card')
      RETURNING id
    `
    noSubtaskCardId = noSubtaskCardResult[0].id

    const tokenPayload = {
      sub: userId,
      email: 'subtask_test_user@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    testToken = await sign(tokenPayload, 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  describe('POST /api/cards/:id/subtasks', () => {
    test('should create a subtask under parent card', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${parentCardId}/subtasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ title: 'Design mockup' }),
        }),
      )
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.title).toBe('Design mockup')
      expect(data.parent_card_id).toBe(parentCardId)
      subtaskId = data.id
    })

    test('should return 400 when trying to nest under another subtask', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${subtaskId}/subtasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ title: 'Nested too deep' }),
        }),
      )
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('nesting depth')
    })

    test('should return 404 for non-existent parent card', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/cards/99999/subtasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ title: 'Orphan subtask' }),
        }),
      )
      expect(res.status).toBe(404)
    })

    test('should return 400 if title is missing', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${parentCardId}/subtasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({}),
        }),
      )
      expect(res.status).toBe(400)
    })

    test('should return 401 without auth', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${parentCardId}/subtasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'No auth' }),
        }),
      )
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/cards/:id/subtasks', () => {
    test('should return subtasks with total and completed count', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${parentCardId}/subtasks`, {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(200)
      const { data, meta } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(meta.total).toBeGreaterThanOrEqual(1)
      expect(typeof meta.completed).toBe('number')
    })

    test('should return empty array for card without subtasks', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${noSubtaskCardId}/subtasks`, {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(200)
      const { data, meta } = await res.json()
      expect(data).toEqual([])
      expect(meta.total).toBe(0)
    })
  })

  describe('PUT /api/cards/:cardId/subtasks/:subtaskId', () => {
    test('should update subtask title', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${parentCardId}/subtasks/${subtaskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ title: 'Updated subtask' }),
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.title).toBe('Updated subtask')
    })

    test('should toggle subtask completion', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${parentCardId}/subtasks/${subtaskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ is_completed: true }),
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.is_completed).toBe(true)
    })
  })

  describe('DELETE /api/cards/:cardId/subtasks/:subtaskId', () => {
    test('should delete subtask', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${parentCardId}/subtasks/${subtaskId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(204)
    })

    test('should return 404 for non-existent subtask', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${parentCardId}/subtasks/99999`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(404)
    })
  })
})
