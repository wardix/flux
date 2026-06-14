import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('Board Members & Roles API', () => {
  let adminUserId: number
  let observerUserId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let adminToken: string
  let observerToken: string

  beforeAll(async () => {
    // 1. Create admin user
    const adminUser = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('admin_collab_test@example.com', 'hashed')
      RETURNING id
    `
    adminUserId = adminUser[0].id

    // 2. Create observer user
    const observerUser = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('observer_collab_test@example.com', 'hashed')
      RETURNING id
    `
    observerUserId = observerUser[0].id

    // 3. Create workspace
    const workspace = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Collab Workspace', ${adminUserId})
      RETURNING id
    `
    workspaceId = workspace[0].id

    // 4. Create board
    const board = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Collab Board', ${adminUserId})
      RETURNING id
    `
    boardId = board[0].id

    // Creator is already added as 'admin' in boardService.create, but let's ensure it exists
    await db`
      INSERT INTO board_members (board_id, user_id, role)
      VALUES (${boardId}, ${adminUserId}, 'admin')
      ON CONFLICT DO NOTHING
    `

    // 5. Add observer user as observer
    await db`
      INSERT INTO board_members (board_id, user_id, role)
      VALUES (${boardId}, ${observerUserId}, 'observer')
    `

    // 6. Create list
    const list = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Todo')
      RETURNING id
    `
    listId = list[0].id

    // Generate tokens
    adminToken = await sign({ sub: adminUserId, email: 'admin_collab_test@example.com' }, 'your-jwt-secret-here-change-in-production', 'HS256')
    observerToken = await sign({ sub: observerUserId, email: 'observer_collab_test@example.com' }, 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id IN (${adminUserId}, ${observerUserId})`
  })

  test('GET /api/boards/:id/members > should get board members list', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}/members`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBe(2)
  })

  test('POST /api/boards/:id/members > should invite a new member', async () => {
    // Create another user to invite
    const invitedUser = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('invited_collab_test@example.com', 'hashed')
      RETURNING id, email
    `
    const invitedId = invitedUser[0].id

    const response = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}/members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invited_collab_test@example.com',
          role: 'member',
        }),
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.data.role).toBe('member')

    // Clean up
    await db`DELETE FROM users WHERE id = ${invitedId}`
  })

  test('PUT /api/boards/:id > Observer should NOT be allowed to update board details (Forbidden)', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${observerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Modified Title by Observer',
        }),
      }),
    )

    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toContain('Forbidden')
  })

  test('POST /api/lists > Observer should NOT be allowed to create a list on the board (Forbidden)', async () => {
    const response = await app.fetch(
      new Request('http://localhost/api/lists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${observerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board_id: boardId,
          title: 'Observer List',
        }),
      }),
    )

    expect(response.status).toBe(403)
  })
})
