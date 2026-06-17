import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'

describe('Goals Routes', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let token: string
  let objectiveId: number
  let keyResultId: number

  beforeAll(async () => {
    // Seed user
    const userRes = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('goals_test@example.com', 'hash')
      RETURNING id
    `
    userId = userRes[0].id

    // Seed workspace
    const wsRes = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Goals Workspace', ${userId})
      RETURNING id
    `
    workspaceId = wsRes[0].id

    // Seed board, list, card for linking test
    const boardRes = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Goals Board', ${userId})
      RETURNING id
    `
    boardId = boardRes[0].id

    const listRes = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Goals List')
      RETURNING id
    `
    listId = listRes[0].id

    const cardRes = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'Goal Link Card')
      RETURNING id
    `
    cardId = cardRes[0].id

    // Token signing
    const payload = {
      sub: userId,
      email: 'goals_test@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }
    const secret = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
    token = await sign(payload, secret, 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  describe('POST /api/goals', () => {
    test('should create objective', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            title: 'Improve User Retention',
            type: 'objective',
            due_date: new Date('2026-06-30T00:00:00.000Z').toISOString(),
            color: '#3b82f6',
          }),
        }),
      )
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.title).toBe('Improve User Retention')
      expect(body.data.type).toBe('objective')
      expect(body.data.parent_id).toBeNull()
      objectiveId = body.data.id
    })

    test('should create key result under objective', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            parent_id: objectiveId,
            title: 'Reduce churn to < 5%',
            type: 'key_result',
            target_value: 5,
            unit: '%',
          }),
        }),
      )
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.type).toBe('key_result')
      expect(body.data.parent_id).toBe(objectiveId)
      expect(Number(body.data.target_value)).toBe(5)
      keyResultId = body.data.id
    })

    test('should return 400 if key_result has no parent_id', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            title: 'Bad Key Result',
            type: 'key_result',
          }),
        }),
      )
      expect(res.status).toBe(400)
    })

    test('should return 400 if objective has parent_id', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            parent_id: objectiveId,
            title: 'Bad Objective',
            type: 'objective',
          }),
        }),
      )
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/goals', () => {
    test('should return goals with nested key results', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/goals?workspace_id=${workspaceId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBeGreaterThan(0)
      const obj = body.data.find((g: any) => g.id === objectiveId)
      expect(obj).toBeDefined()
      expect(obj.type).toBe('objective')
      expect(obj.key_results).toBeDefined()
      expect(obj.key_results.length).toBeGreaterThan(0)
      expect(obj.progress).toBeDefined()
    })
  })

  describe('PUT /api/goals/:id/progress', () => {
    test('should update current_value and recalculate progress', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/goals/${keyResultId}/progress`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ current_value: 3.5 }),
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Number(body.data.current_value)).toBe(3.5)
      expect(body.data.progress).toBe(70) // 3.5 / 5 * 100
    })
  })

  describe('POST /api/goals/:id/cards', () => {
    test('should link card to goal', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/goals/${keyResultId}/cards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ card_id: cardId }),
        }),
      )
      expect(res.status).toBe(201)
    })

    test('should return 409 for duplicate link', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/goals/${keyResultId}/cards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ card_id: cardId }),
        }),
      )
      expect(res.status).toBe(409)
    })
  })

  describe('DELETE /api/goals/:id/cards/:cardId', () => {
    test('should unlink card from goal', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/goals/${keyResultId}/cards/${cardId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      )
      expect(res.status).toBe(204)
    })
  })

  describe('DELETE /api/goals/:id', () => {
    test('should delete goal and cascade key results', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/goals/${objectiveId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      )
      expect(res.status).toBe(204)

      // Verify cascading delete of child key results
      const kr = await db`SELECT * FROM goals WHERE id = ${keyResultId}`
      expect(kr.length).toBe(0)
    })

    test('should return 404 for non-existent goal', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/goals/99999', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      )
      expect(res.status).toBe(404)
    })
  })
})
