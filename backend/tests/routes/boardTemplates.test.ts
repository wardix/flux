import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import server from '../../src/index'
import { db } from '../../src/db'

describe('Board Templates & Cloning API', () => {
  let userId: number
  let workspaceId: number
  let sourceBoardId: number
  let testToken: string

  beforeAll(async () => {
    // Seed user
    const [user] = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('templates_test@flux.com', 'hash')
      RETURNING id
    `
    userId = user.id

    // Generate token
    const { sign } = await import('hono/jwt')
    const secretKey = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
    testToken = await sign({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 }, secretKey, 'HS256')

    // Create workspace
    const [ws] = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('WS', ${userId})
      RETURNING id
    `
    workspaceId = ws.id

    // Create a source board to clone
    const [board] = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Source Board', ${userId})
      RETURNING id
    `
    sourceBoardId = board.id

    // Add list to source board
    const [list] = await db`
      INSERT INTO lists (board_id, title, position)
      VALUES (${sourceBoardId}, 'Todo', 0)
      RETURNING id
    `

    // Add card to source board list
    await db`
      INSERT INTO cards (list_id, title, description, story_points)
      VALUES (${list.id}, 'Source Card', 'Card details', 5)
    `
  })

  afterAll(async () => {
    await db`DELETE FROM workspaces WHERE owner_id = ${userId}`
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  describe('GET /api/boards/templates', () => {
    test('should return list of templates', async () => {
      const res = await server.fetch(
        new Request('http://localhost/api/boards/templates', {
          headers: { Authorization: `Bearer ${testToken}` },
        })
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.length).toBeGreaterThan(0)
      expect(data[0].key).toBeDefined()
    })
  })

  describe('POST /api/boards/templates/create', () => {
    test('should create board from template with corresponding columns', async () => {
      const res = await server.fetch(
        new Request('http://localhost/api/boards/templates/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({
            template_key: 'agile',
            workspace_id: workspaceId,
            title: 'Agile Plan',
          }),
        })
      )
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.title).toBe('Agile Plan')

      // Check lists created
      const lists = await db`SELECT title FROM lists WHERE board_id = ${data.id} ORDER BY position ASC`
      expect(lists.map(l => l.title)).toEqual(['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'])
    })
  })

  describe('POST /api/boards/:id/clone', () => {
    test('should clone board lists and cards successfully', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${sourceBoardId}/clone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({
            workspace_id: workspaceId,
            title: 'My Cloned Board',
          }),
        })
      )
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.title).toBe('My Cloned Board')

      // Verify lists cloned
      const lists = await db`SELECT id, title FROM lists WHERE board_id = ${data.id}`
      expect(lists.length).toBe(1)
      expect(lists[0].title).toBe('Todo')

      // Verify cards cloned
      const cards = await db`SELECT title, description, story_points FROM cards WHERE list_id = ${lists[0].id}`
      expect(cards.length).toBe(1)
      expect(cards[0].title).toBe('Source Card')
      expect(cards[0].story_points).toBe(5)
    })
  })
})
