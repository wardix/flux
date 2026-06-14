import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import app from '../../src/index'
import { db } from '../../src/db'

let testToken: string
let testUserId: number
let boardId: number
let listId: number

describe('Email to Board Webhooks', () => {
  beforeAll(async () => {
    // Clean up
    await db`DELETE FROM users WHERE email LIKE 'email_test%'`
    
    // Create user
    const u1 = await db`INSERT INTO users (email, password_hash) VALUES ('email_test1@example.com', 'hash') RETURNING id`
    testUserId = u1[0].id

    const { sign } = await import('hono/jwt')
    testToken = await sign({ sub: String(testUserId), exp: Math.floor(Date.now() / 1000) + 3600 }, process.env.JWT_SECRET || 'secret-key-123')

    const w = await db`INSERT INTO workspaces (name, owner_id) VALUES ('W1', ${testUserId}) RETURNING id`
    const b = await db`INSERT INTO boards (workspace_id, title) VALUES (${w[0].id}, 'B1') RETURNING id`
    boardId = b[0].id
    const l = await db`INSERT INTO lists (board_id, title, position) VALUES (${boardId}, 'L1', 0) RETURNING id`
    listId = l[0].id
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${testUserId}`
  })

  describe('POST /api/boards/:boardId/email', () => {
    test('should generate email address for board', async () => {
      const res = await app.request(`/api/boards/${boardId}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({ target_list_id: listId }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.email_address).toMatch(/^board-[a-z0-9]+@/)
      expect(data.is_active).toBe(true)
    })

    test('should return 401 without auth', async () => {
      const res = await app.request(`/api/boards/${boardId}/email`, { method: 'POST' })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/boards/:boardId/email', () => {
    test('should return email settings for board', async () => {
      const res = await app.request(`/api/boards/${boardId}/email`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/webhooks/email', () => {
    let boardEmailAddress: string

    beforeAll(async () => {
      // Get the email address created in previous test
      const res = await app.request(`/api/boards/${boardId}/email`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      const { data } = await res.json()
      boardEmailAddress = data[0].email_address
      process.env.WEBHOOK_EMAIL_SECRET = 'test-secret'
    })

    test('should create card from inbound email', async () => {
      const formData = new FormData()
      formData.append('to', boardEmailAddress)
      formData.append('from', 'john@example.com')
      formData.append('subject', 'Bug pada halaman login')
      formData.append('text', 'Saat klik tombol login, tidak terjadi apa-apa.')

      const res = await app.request('/api/webhooks/email?secret=test-secret', {
        method: 'POST',
        body: formData,
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.card_id).toBeDefined()
      expect(data.status).toBe('created')
    })

    test('should return 403 with invalid webhook secret', async () => {
      const formData = new FormData()
      formData.append('to', boardEmailAddress)
      formData.append('subject', 'Test')

      const res = await app.request('/api/webhooks/email?secret=wrong', {
        method: 'POST',
        body: formData,
      })
      expect(res.status).toBe(403)
    })

    test('should return 404 for unknown email address', async () => {
      const formData = new FormData()
      formData.append('to', 'unknown@inbound.flux.app')
      formData.append('subject', 'Test')

      const res = await app.request('/api/webhooks/email?secret=test-secret', {
        method: 'POST',
        body: formData,
      })
      expect(res.status).toBe(404)
    })

    test('should handle email with attachments', async () => {
      const formData = new FormData()
      formData.append('to', boardEmailAddress)
      formData.append('from', 'john@example.com')
      formData.append('subject', 'Bug with screenshot')
      formData.append('text', 'See attached screenshot')
      formData.append('attachment1', new Blob(['fake image data'], { type: 'image/png' }), 'screenshot.png')
      // Try to provide some attachment info if needed by the app logic
      formData.append('attachment-info', JSON.stringify({
        attachment1: { filename: 'screenshot.png', type: 'image/png' }
      }))

      const res = await app.request('/api/webhooks/email?secret=test-secret', {
        method: 'POST',
        body: formData,
      })
      expect(res.status).toBe(200)
    })

    test('should use subject as card title, body as description', async () => {
      const formData = new FormData()
      formData.append('to', boardEmailAddress)
      formData.append('from', 'john@example.com')
      formData.append('subject', 'My Card Title')
      formData.append('text', 'My card description here')

      const res = await app.request('/api/webhooks/email?secret=test-secret', {
        method: 'POST',
        body: formData,
      })
      expect(res.status).toBe(200)
      
      const { data } = await res.json()
      
      const card = await db`SELECT * FROM cards WHERE id = ${data.card_id}`
      expect(card[0].title).toBe('My Card Title')
      expect(card[0].description).toContain('My card description here')
      expect(card[0].description).toContain('Source: john@example.com')
    })
  })
})
