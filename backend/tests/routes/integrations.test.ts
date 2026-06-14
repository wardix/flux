import { describe, test, expect, beforeAll, afterAll, mock } from 'bun:test'
import server from '../../src/index'
import { db } from '../../src/db'

describe('Personal Access Tokens & Webhooks API', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let testToken: string
  let patId: number
  let patToken: string
  let webhookId: number

  beforeAll(async () => {
    // Seed user
    const [user] = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('pat_webhook_test@flux.com', 'hash')
      RETURNING id
    `
    userId = user.id

    // Generate JWT token
    const { sign } = await import('hono/jwt')
    const secretKey = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
    testToken = await sign({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 }, secretKey, 'HS256')

    // Create workspace
    const [ws] = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Test WS', ${userId})
      RETURNING id
    `
    workspaceId = ws.id

    // Create board
    const [board] = await db`
      INSERT INTO boards (workspace_id, title)
      VALUES (${workspaceId}, 'Test Board')
      RETURNING id
    `
    boardId = board.id

    // Create list
    const [list] = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Todo')
      RETURNING id
    `
    listId = list.id
  })

  afterAll(async () => {
    await db`DELETE FROM workspaces WHERE owner_id = ${userId}`
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  describe('Personal Access Tokens', () => {
    test('should create a Personal Access Token', async () => {
      const res = await server.fetch(
        new Request('http://localhost/api/personal-access-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ name: 'Development Token' }),
        })
      )
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.name).toBe('Development Token')
      expect(data.token).toContain('flux_pat_')
      patId = data.id
      patToken = data.token
    })

    test('should list Personal Access Tokens', async () => {
      const res = await server.fetch(
        new Request('http://localhost/api/personal-access-tokens', {
          headers: { Authorization: `Bearer ${testToken}` },
        })
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.length).toBe(1)
      expect(data[0].id).toBe(patId)
    })

    test('should authorize requests using PAT', async () => {
      const res = await server.fetch(
        new Request('http://localhost/api/boards', {
          headers: { Authorization: `Bearer ${patToken}` },
        })
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('should delete Personal Access Token', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/personal-access-tokens/${patId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${testToken}` },
        })
      )
      expect(res.status).toBe(204)

      // Verify validation fails
      const resVal = await server.fetch(
        new Request('http://localhost/api/boards', {
          headers: { Authorization: `Bearer ${patToken}` },
        })
      )
      expect(resVal.status).toBe(401)
    })
  })

  describe('Webhooks', () => {
    test('should create a webhook for a board', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/webhooks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({
            url: 'https://webhook.site/test-flux',
            secret: 'sec',
          }),
        })
      )
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.url).toBe('https://webhook.site/test-flux')
      webhookId = data.id
    })

    test('should list webhooks for a board', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/webhooks`, {
          headers: { Authorization: `Bearer ${testToken}` },
        })
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.length).toBe(1)
      expect(data[0].id).toBe(webhookId)
    })

    test('should delete a webhook', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/webhooks/${webhookId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${testToken}` },
        })
      )
      expect(res.status).toBe(204)
    })
  })
})
