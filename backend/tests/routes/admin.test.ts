import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'
import { limitMap } from '../../src/middleware/rateLimit'

async function makeRequest(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {},
) {
  const method = options.method || 'GET'
  const headers = options.headers || {}
  return await app.fetch(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: options.body,
    }),
  )
}

describe('Admin & Export API', () => {
  let superAdminId: number
  let regularUserId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number

  let superAdminToken: string
  let regularUserToken: string
  let testToken: string // same as superAdminToken or regularUserToken for general tests

  beforeAll(async () => {
    // 1. Create users
    const sa = await db`
      INSERT INTO users (email, password_hash, is_super_admin)
      VALUES ('superadmin_test@example.com', 'hashed', TRUE)
      RETURNING id
    `
    superAdminId = sa[0].id

    const ru = await db`
      INSERT INTO users (email, password_hash, is_super_admin)
      VALUES ('regular_test@example.com', 'hashed', FALSE)
      RETURNING id
    `
    regularUserId = ru[0].id

    // 2. Create workspace
    const workspace = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Admin Workspace', ${regularUserId})
      RETURNING id
    `
    workspaceId = workspace[0].id

    // 3. Create board
    const board = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Admin Board', ${regularUserId})
      RETURNING id
    `
    boardId = board[0].id

    // 4. Create list
    const list = await db`
      INSERT INTO lists (board_id, title, position)
      VALUES (${boardId}, 'Admin List', 0)
      RETURNING id
    `
    listId = list[0].id

    // 5. Create card
    const card = await db`
      INSERT INTO cards (list_id, title, position)
      VALUES (${listId}, 'Admin Card', 0)
      RETURNING id
    `
    cardId = card[0].id

    // 6. Generate tokens
    superAdminToken = await sign(
      { sub: superAdminId, email: 'superadmin_test@example.com' },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      'HS256',
    )

    regularUserToken = await sign(
      { sub: regularUserId, email: 'regular_test@example.com' },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      'HS256',
    )

    testToken = regularUserToken
  })

  beforeEach(() => {
    limitMap.clear()
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id IN (${superAdminId}, ${regularUserId})`
  })

  describe('GET /api/admin/users', () => {
    test('should return paginated user list for super admin', async () => {
      const res = await makeRequest('/api/admin/users?page=1&per_page=10', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      })
      expect(res.status).toBe(200)
      const { data, meta } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(meta).toHaveProperty('total')
    })

    test('should return 403 for non-super-admin user', async () => {
      const res = await makeRequest('/api/admin/users', {
        headers: { Authorization: `Bearer ${regularUserToken}` },
      })
      expect(res.status).toBe(403)
    })

    test('should return 401 without auth token', async () => {
      const res = await makeRequest('/api/admin/users')
      expect(res.status).toBe(401)
    })

    test('should filter users by search query', async () => {
      const res = await makeRequest('/api/admin/users?search=superadmin_test', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.length).toBe(1)
      expect(data[0].email).toBe('superadmin_test@example.com')
    })
  })

  describe('PUT /api/admin/users/:id', () => {
    test('should suspend a user', async () => {
      const res = await makeRequest(`/api/admin/users/${regularUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({ is_suspended: true }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.is_suspended).toBe(true)
    })

    test('should return 404 for non-existent user', async () => {
      const res = await makeRequest('/api/admin/users/99999', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({ is_suspended: true }),
      })
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/export/:boardId', () => {
    test('should export board data as JSON', async () => {
      const res = await makeRequest(`/api/export/${boardId}?format=json`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.board).toHaveProperty('lists')
    })

    test('should export board data as CSV', async () => {
      const res = await makeRequest(`/api/export/${boardId}?format=csv`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('text/csv')
      const text = await res.text()
      expect(text).toContain('List Title,Card Title')
      expect(text).toContain('Admin List')
    })

    test('should return 400 for invalid format', async () => {
      const res = await makeRequest(`/api/export/${boardId}?format=xml`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(400)
    })
  })
})
