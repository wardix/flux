import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import app from '../../src/index'
import { db } from '../../src/db'

let testToken: string
let testUserId: number
let otherUserId: number
let boardId: number
let cardId: number
let notifId: number
let otherUserNotifId: number

describe('Notifications API', () => {
  beforeAll(async () => {
    // Clean up
    await db`DELETE FROM users WHERE email LIKE 'notif_test%'`
    
    // Create users
    const u1 = await db`INSERT INTO users (email, password_hash) VALUES ('notif_test1@example.com', 'hash') RETURNING id`
    testUserId = u1[0].id
    
    const u2 = await db`INSERT INTO users (email, password_hash) VALUES ('notif_test2@example.com', 'hash') RETURNING id`
    otherUserId = u2[0].id

    // Setup token (mock/create a real token)
    const { sign } = await import('hono/jwt')
    testToken = await sign({ sub: String(testUserId), exp: Math.floor(Date.now() / 1000) + 3600 }, 'secret-key-123') // Adjust to your actual JWT secret if needed, though for standard tests this might need the real env var. Let's assume standard auth.
    // wait, what's the jwt secret? let's use process.env.JWT_SECRET || 'secret'
    testToken = await sign({ sub: String(testUserId), exp: Math.floor(Date.now() / 1000) + 3600 }, process.env.JWT_SECRET || 'secret-key-123')

    // Create workspace, board, list, card
    const w = await db`INSERT INTO workspaces (name, owner_id) VALUES ('W1', ${testUserId}) RETURNING id`
    const b = await db`INSERT INTO boards (workspace_id, title) VALUES (${w[0].id}, 'B1') RETURNING id`
    boardId = b[0].id
    const l = await db`INSERT INTO lists (board_id, title, position) VALUES (${boardId}, 'L1', 0) RETURNING id`
    const c = await db`INSERT INTO cards (list_id, title, position) VALUES (${l[0].id}, 'C1', 0) RETURNING id`
    cardId = c[0].id

    // Create notifications
    const n1 = await db`INSERT INTO notifications (user_id, type, title, message, card_id, board_id) VALUES (${testUserId}, 'assigned', 'T1', 'M1', ${cardId}, ${boardId}) RETURNING id`
    notifId = n1[0].id
    await db`INSERT INTO notifications (user_id, type, title, message, card_id, board_id, is_read) VALUES (${testUserId}, 'comment', 'T2', 'M2', ${cardId}, ${boardId}, TRUE)`
    
    const n2 = await db`INSERT INTO notifications (user_id, type, title, message) VALUES (${otherUserId}, 'mentioned', 'T3', 'M3') RETURNING id`
    otherUserNotifId = n2[0].id
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id IN (${testUserId}, ${otherUserId})`
  })

  describe('GET /api/notifications', () => {
    test('should return notifications for authenticated user', async () => {
      const res = await app.request('/api/notifications', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data, meta } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(meta.unread_count).toBeGreaterThanOrEqual(0)
    })

    test('should filter unread only', async () => {
      const res = await app.request('/api/notifications?unread=true', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      data.forEach((n: any) => expect(n.is_read).toBe(false))
    })

    test('should return 401 without auth', async () => {
      const res = await app.request('/api/notifications')
      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/notifications/:id/read', () => {
    test('should mark notification as read', async () => {
      const res = await app.request(`/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.is_read).toBe(true)
    })

    test('should return 404 for non-existent notification', async () => {
      const res = await app.request('/api/notifications/99999/read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(404)
    })

    test('should return 403 for other user notification', async () => {
      const res = await app.request(`/api/notifications/${otherUserNotifId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(403)
    })
  })

  describe('PUT /api/notifications/read-all', () => {
    test('should mark all notifications as read', async () => {
      const res = await app.request('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.updated_count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('GET /api/notifications/unread-count', () => {
    test('should return unread count', async () => {
      const res = await app.request('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(typeof data.count).toBe('number')
    })
  })
})
