import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

async function makeRequest(path: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  const method = options.method || 'GET'
  const headers = options.headers || {}
  return await app.fetch(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: options.body,
    })
  )
}

describe('Time Tracking API', () => {
  let userId: number
  let otherUserId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let otherCardId: number
  let testToken: string
  let otherToken: string
  let timeLogId: number
  let otherUserLogId: number

  beforeAll(async () => {
    // 1. Create users
    const user = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('time_test@example.com', 'hashed')
      RETURNING id
    `
    userId = user[0].id

    const otherUser = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('time_other@example.com', 'hashed')
      RETURNING id
    `
    otherUserId = otherUser[0].id

    // 2. Create workspace
    const workspace = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Time Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspace[0].id

    // 3. Create board
    const board = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Time Board', ${userId})
      RETURNING id
    `
    boardId = board[0].id

    // 4. Create list
    const list = await db`
      INSERT INTO lists (board_id, title, position)
      VALUES (${boardId}, 'Time List', 0)
      RETURNING id
    `
    listId = list[0].id

    // 5. Create cards
    const card = await db`
      INSERT INTO cards (list_id, title, position)
      VALUES (${listId}, 'Card 1', 0)
      RETURNING id
    `
    cardId = card[0].id

    const otherCard = await db`
      INSERT INTO cards (list_id, title, position)
      VALUES (${listId}, 'Card 2', 1)
      RETURNING id
    `
    otherCardId = otherCard[0].id

    // 6. Generate tokens
    testToken = await sign(
      { sub: userId, email: 'time_test@example.com' },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      'HS256'
    )

    otherToken = await sign(
      { sub: otherUserId, email: 'time_other@example.com' },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      'HS256'
    )

    // 7. Insert manual logs for delete tests
    const myLog = await db`
      INSERT INTO time_logs (card_id, user_id, started_at, duration_seconds, description, is_running)
      VALUES (${cardId}, ${userId}, NOW() - INTERVAL '1 hour', 1800, 'My Work', FALSE)
      RETURNING id
    `
    timeLogId = myLog[0].id

    const otherLog = await db`
      INSERT INTO time_logs (card_id, user_id, started_at, duration_seconds, description, is_running)
      VALUES (${cardId}, ${otherUserId}, NOW() - INTERVAL '1 hour', 2400, 'Other Work', FALSE)
      RETURNING id
    `
    otherUserLogId = otherLog[0].id
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id IN (${userId}, ${otherUserId})`
  })

  describe('POST /api/cards/:id/timer/start', () => {
    test('should start timer on card', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/timer/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ description: 'Working on feature' }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json() as any
      expect(data.is_running).toBe(true)
      expect(data.card_id).toBe(cardId)
      expect(data.ended_at).toBeNull()
    })

    test('should return 409 if timer already running', async () => {
      const res = await makeRequest(`/api/cards/${otherCardId}/timer/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(409)
      const body = await res.json() as any
      expect(body.error).toContain('running timer')
    })

    test('should return 401 without auth', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/timer/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/cards/:id/timer/stop', () => {
    test('should stop running timer and calculate duration', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/timer/stop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json() as any
      expect(data.is_running).toBe(false)
      expect(data.ended_at).not.toBeNull()
      expect(data.duration_seconds).toBeGreaterThanOrEqual(0)
    })

    test('should return 404 if no active timer running on card', async () => {
      const res = await makeRequest(`/api/cards/${otherCardId}/timer/stop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/cards/:id/time-logs (manual)', () => {
    test('should create manual time log with duration', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/time-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          started_at: '2026-01-14T09:00:00Z',
          duration_seconds: 3600,
          description: 'Code review',
        }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json() as any
      expect(data.duration_seconds).toBe(3600)
      expect(data.is_running).toBe(false)
    })

    test('should create manual time log with start/end time', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/time-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          started_at: '2026-01-14T13:00:00Z',
          ended_at: '2026-01-14T14:30:00Z',
          description: 'Testing',
        }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json() as any
      expect(data.duration_seconds).toBe(5400) // 1.5 hours
    })

    test('should return 400 if ended_at is before started_at', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/time-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          started_at: '2026-01-14T14:00:00Z',
          ended_at: '2026-01-14T13:00:00Z',
        }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/cards/:id/time-logs', () => {
    test('should return all time logs with summary', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/time-logs`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data, meta } = await res.json() as any
      expect(Array.isArray(data)).toBe(true)
      expect(meta.total_duration_seconds).toBeGreaterThan(0)
      expect(meta.total_logs).toBeGreaterThan(0)
      expect(Array.isArray(meta.by_user)).toBe(true)
    })
  })

  describe('GET /api/users/me/active-timer', () => {
    test('should return null when no active timer', async () => {
      const res = await makeRequest('/api/users/me/active-timer', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json() as any
      expect(data).toBeNull()
    })

    test('should return active timer details when timer running', async () => {
      // Start a timer first
      await makeRequest(`/api/cards/${cardId}/timer/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({}),
      })

      const res = await makeRequest('/api/users/me/active-timer', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json() as any
      expect(data).not.toBeNull()
      expect(data.card_id).toBe(cardId)
      expect(data.elapsed_seconds).toBeGreaterThanOrEqual(0)

      // Stop it to leave clean state
      await makeRequest(`/api/cards/${cardId}/timer/stop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testToken}` },
      })
    })
  })

  describe('DELETE /api/time-logs/:id', () => {
    test('should delete own time log', async () => {
      const res = await makeRequest(`/api/time-logs/${timeLogId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(204)
    })

    test('should return 403 for other user time log', async () => {
      const res = await makeRequest(`/api/time-logs/${otherUserLogId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(403)
    })
  })
})
