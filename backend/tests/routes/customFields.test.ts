import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

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

describe('Custom Fields API', () => {
  let adminId: number
  let adminToken: string
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number

  let textFieldId: number
  let dropdownFieldId: number
  let numberFieldId: number
  let fieldId: number // for delete test

  beforeAll(async () => {
    // 1. Create admin user
    const user = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('cf_admin@example.com', 'hashed')
      RETURNING id
    `
    adminId = user[0].id

    // 2. Generate token
    adminToken = await sign(
      { sub: adminId, email: 'cf_admin@example.com' },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      'HS256',
    )

    // 3. Create workspace
    const workspace = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('CF Workspace', ${adminId})
      RETURNING id
    `
    workspaceId = workspace[0].id

    // 4. Create board
    const board = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'CF Board', ${adminId})
      RETURNING id
    `
    boardId = board[0].id

    // 5. Create list
    const list = await db`
      INSERT INTO lists (board_id, title, position)
      VALUES (${boardId}, 'CF List', 0)
      RETURNING id
    `
    listId = list[0].id

    // 6. Create card
    const card = await db`
      INSERT INTO cards (list_id, title, position)
      VALUES (${listId}, 'CF Card', 0)
      RETURNING id
    `
    cardId = card[0].id
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${adminId}`
  })

  describe('POST /api/boards/:boardId/custom-fields', () => {
    test('should create text custom field', async () => {
      const res = await makeRequest(`/api/boards/${boardId}/custom-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: 'Notes', field_type: 'text' }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.name).toBe('Notes')
      expect(data.field_type).toBe('text')
      textFieldId = data.id
    })

    test('should create dropdown field with options', async () => {
      const res = await makeRequest(`/api/boards/${boardId}/custom-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'Priority',
          field_type: 'dropdown',
          options: { choices: [{ value: 'low', label: 'Low', color: '#22c55e' }] },
        }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.options.choices).toHaveLength(1)
      dropdownFieldId = data.id
    })

    test('should create number field', async () => {
      const res = await makeRequest(`/api/boards/${boardId}/custom-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: 'Estimate', field_type: 'number' }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      numberFieldId = data.id
    })

    test('should create custom field for deletion', async () => {
      const res = await makeRequest(`/api/boards/${boardId}/custom-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: 'DeleteMe', field_type: 'text' }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      fieldId = data.id
    })

    test('should return 400 if dropdown has no options', async () => {
      const res = await makeRequest(`/api/boards/${boardId}/custom-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: 'Status', field_type: 'dropdown' }),
      })
      expect(res.status).toBe(400)
    })

    test('should return 409 for duplicate field name on same board', async () => {
      const res = await makeRequest(`/api/boards/${boardId}/custom-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: 'Notes', field_type: 'text' }),
      })
      expect(res.status).toBe(409)
    })

    test('should return 401 without auth', async () => {
      const res = await makeRequest(`/api/boards/${boardId}/custom-fields`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', field_type: 'text' }),
      })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/boards/:boardId/custom-fields', () => {
    test('should return all custom fields for board', async () => {
      const res = await makeRequest(`/api/boards/${boardId}/custom-fields`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.length).toBeGreaterThan(0)
    })
  })

  describe('PUT /api/cards/:cardId/custom-fields', () => {
    test('should set custom field values for card', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/custom-fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ values: [{ field_id: textFieldId, value: 'Some notes' }] }),
      })
      expect(res.status).toBe(200)
    })

    test('should validate dropdown value against choices', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/custom-fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ values: [{ field_id: dropdownFieldId, value: 'invalid_choice' }] }),
      })
      expect(res.status).toBe(400)
    })

    test('should validate number field value', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/custom-fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ values: [{ field_id: numberFieldId, value: 'not_a_number' }] }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /api/boards/:boardId/custom-fields/:fieldId', () => {
    test('should delete field and cascade values', async () => {
      // First set a value for the field to delete
      await makeRequest(`/api/cards/${cardId}/custom-fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ values: [{ field_id: fieldId, value: 'Delete this value' }] }),
      })

      const res = await makeRequest(`/api/boards/${boardId}/custom-fields/${fieldId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(204)

      // Verify values are also deleted
      const valuesRes = await makeRequest(`/api/cards/${cardId}/custom-fields`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      const { data } = await valuesRes.json()
      expect(data.find((v: any) => v.field_id === fieldId)).toBeUndefined()
    })
  })
})
