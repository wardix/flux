import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('Board Stars & Favorites API', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let token: string

  beforeAll(async () => {
    // 1. Create user
    const user = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('star_test@example.com', 'hashed')
      RETURNING id
    `
    userId = user[0].id

    // 2. Create workspace
    const workspace = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Star Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspace[0].id

    // 3. Create board
    const board = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Star Board', ${userId})
      RETURNING id
    `
    boardId = board[0].id

    // Generate token
    token = await sign({ sub: userId, email: 'star_test@example.com' }, 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('POST /api/boards/:id/star > should star a board', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}/star`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)

    // Check database
    const stars = await db`SELECT * FROM board_stars WHERE board_id = ${boardId} AND user_id = ${userId}`
    expect(stars.length).toBe(1)
  })

  test('GET /api/boards > should include is_starred=true in board list', async () => {
    const response = await app.fetch(
      new Request('http://localhost/api/boards', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    const targetBoard = json.data.find((b: any) => b.id === boardId)
    expect(targetBoard).toBeDefined()
    expect(targetBoard.is_starred).toBe(true)
  })

  test('DELETE /api/boards/:id/star > should unstar a board', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}/star`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)

    // Check database
    const stars = await db`SELECT * FROM board_stars WHERE board_id = ${boardId} AND user_id = ${userId}`
    expect(stars.length).toBe(0)
  })
})
