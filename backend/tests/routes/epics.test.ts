import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../src/db'
import server from '../../src/index'

describe('Epics API', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let linkedCardId: number
  let testToken: string
  let epicId: number
  let otherWorkspaceEpicId: number
  let epicToDeleteId: number

  beforeAll(async () => {
    // Seed user
    const [user] = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('test_epics@flux.com', 'hash')
      RETURNING id
    `
    userId = user.id

    // Generate token
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
      VALUES ('Epic Workspace', ${userId})
      RETURNING id
    `
    workspaceId = ws.id

    // Create board
    const [board] = await db`
      INSERT INTO boards (workspace_id, title)
      VALUES (${workspaceId}, 'Epic Board')
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

    // Create card
    const [card] = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'Test Epic Card')
      RETURNING id
    `
    cardId = card.id

    // Create second card for delete check
    const [c2] = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'Linked Epic Card')
      RETURNING id
    `
    linkedCardId = c2.id

    // Create other workspace and epic for validation checks
    const [ws2] = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Other WS', ${userId})
      RETURNING id
    `
    const [otherEpic] = await db`
      INSERT INTO epics (workspace_id, title, color)
      VALUES (${ws2.id}, 'Other WS Epic', '#ef4444')
      RETURNING id
    `
    otherWorkspaceEpicId = otherEpic.id
  })

  afterAll(async () => {
    await db`DELETE FROM workspaces WHERE owner_id = ${userId}`
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  describe('POST /api/workspaces/:workspaceId/epics', () => {
    test('should create epic with valid data', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/epics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({
            title: 'Rombak Login',
            description: 'Redesign login flow',
            color: '#6366f1',
          }),
        }),
      )
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.title).toBe('Rombak Login')
      expect(data.status).toBe('open')
      expect(data.color).toBe('#6366f1')
      epicId = data.id
    })

    test('should return 400 for invalid color format', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/epics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ title: 'Test', color: 'not-a-color' }),
        }),
      )
      expect(res.status).toBe(400)
    })

    test('should return 401 without auth', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/epics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Test' }),
        }),
      )
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/workspaces/:workspaceId/epics', () => {
    test('should return epics with progress', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/epics`, {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.length).toBeGreaterThan(0)
      expect(data[0].progress).toBeDefined()
      expect(data[0].progress.percentage).toBeGreaterThanOrEqual(0)
    })

    test('should filter by status', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/epics?status=open`, {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      data.forEach((epic: any) => expect(epic.status).toBe('open'))
    })
  })

  describe('GET /api/workspaces/:workspaceId/epics/:epicId', () => {
    test('should return epic detail with cards', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/epics/${epicId}`, {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.title).toBeDefined()
      expect(data.cards).toBeDefined()
      expect(Array.isArray(data.cards)).toBe(true)
    })

    test('should return 404 for non-existent epic', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/epics/99999`, {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/cards/:cardId/epic', () => {
    test('should assign card to epic', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/cards/${cardId}/epic`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ epic_id: epicId }),
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.epic_id).toBe(epicId)
    })

    test('should remove card from epic', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/cards/${cardId}/epic`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ epic_id: null }),
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.epic_id).toBeNull()
    })

    test('should return 400 if epic is from different workspace', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/cards/${cardId}/epic`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ epic_id: otherWorkspaceEpicId }),
        }),
      )
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /api/workspaces/:workspaceId/epics/:epicId', () => {
    test('should delete epic and set cards epic_id to null', async () => {
      // Create epic to delete
      const createRes = await db`
        INSERT INTO epics (workspace_id, title, color)
        VALUES (${workspaceId}, 'To Delete Epic', '#22c55e')
        RETURNING id
      `
      epicToDeleteId = createRes[0].id

      // Link card to it
      await db`UPDATE cards SET epic_id = ${epicToDeleteId} WHERE id = ${linkedCardId}`

      const res = await server.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/epics/${epicToDeleteId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(204)

      // Verify cards' epic_id is null
      const cardRes = await server.fetch(
        new Request(`http://localhost/api/cards/${linkedCardId}`, {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      const { data: card } = await cardRes.json()
      expect(card.epic_id).toBeNull()
    })
  })
})
