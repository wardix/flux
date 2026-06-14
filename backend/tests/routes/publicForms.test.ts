import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../src/db'
import server from '../../src/index'

describe('Public Forms API', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let testToken: string
  let formId: number

  beforeAll(async () => {
    // Seed user
    const [user] = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('forms_test@flux.com', 'hash')
      RETURNING id
    `
    userId = user.id

    // Generate JWT token
    const { sign } = await import('hono/jwt')
    const secretKey = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
    testToken = await sign(
      { sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 },
      secretKey,
      'HS256',
    )

    // Create workspace
    const [ws] = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Forms WS', ${userId})
      RETURNING id
    `
    workspaceId = ws.id

    // Create board
    const [board] = await db`
      INSERT INTO boards (workspace_id, title)
      VALUES (${workspaceId}, 'Forms Board')
      RETURNING id
    `
    boardId = board.id

    // Create list
    const [list] = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Inbox')
      RETURNING id
    `
    listId = list.id
  })

  afterAll(async () => {
    await db`DELETE FROM workspaces WHERE owner_id = ${userId}`
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('should create/configure public form successfully', async () => {
    const res = await server.fetch(
      new Request(`http://localhost/api/boards/${boardId}/form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          title: 'Customer Requests',
          description: 'Submit your bugs and feature requests here.',
          is_active: true,
        }),
      }),
    )
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.title).toBe('Customer Requests')
    expect(data.is_active).toBe(true)
    formId = data.id
  })

  test('should get public form configuration', async () => {
    const res = await server.fetch(
      new Request(`http://localhost/api/boards/${boardId}/form`, {
        headers: { Authorization: `Bearer ${testToken}` },
      }),
    )
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.id).toBe(formId)
  })

  test('should retrieve public form config publicly', async () => {
    const res = await server.fetch(new Request(`http://localhost/api/public-forms/${formId}`))
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.title).toBe('Customer Requests')
  })

  test('should submit card through public form', async () => {
    const res = await server.fetch(
      new Request(`http://localhost/api/public-forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'My Public Card Submission',
          description: 'This is the body of the submitted card.',
        }),
      }),
    )
    expect(res.status).toBe(201)
    const { data } = await res.json()
    expect(data.title).toBe('My Public Card Submission')

    // Verify card exists in list
    const cards = await db`SELECT id, title, description FROM cards WHERE list_id = ${listId}`
    expect(cards.some((c) => c.title === 'My Public Card Submission')).toBe(true)
  })
})
