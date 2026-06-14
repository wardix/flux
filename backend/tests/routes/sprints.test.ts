import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../src/db'
import server from '../../src/index'

describe('Sprints API', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let toDoListId: number
  let cardId: number
  let testToken: string
  let sprintId: number
  let activeSprintId: number

  beforeAll(async () => {
    // Seed test data
    const [user] = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('test_sprints@flux.com', 'hash')
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

    const [ws] = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Sprint Workspace', ${userId})
      RETURNING id
    `
    workspaceId = ws.id

    const [board] = await db`
      INSERT INTO boards (workspace_id, title)
      VALUES (${workspaceId}, 'Sprint Board')
      RETURNING id
    `
    boardId = board.id

    const [toDo] = await db`
      INSERT INTO lists (board_id, title, position)
      VALUES (${boardId}, 'To Do', 0)
      RETURNING id
    `
    toDoListId = toDo.id

    const [c] = await db`
      INSERT INTO cards (list_id, title, position)
      VALUES (${toDoListId}, 'Test Card', 0)
      RETURNING id
    `
    cardId = c.id
  })

  afterAll(async () => {
    await db`DELETE FROM workspaces WHERE id = ${workspaceId}`
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  describe('POST /api/boards/:boardId/sprints', () => {
    test('should create sprint with valid data', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/sprints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({
            title: 'Sprint 1',
            goal: 'Complete auth',
            start_date: '2026-01-06T00:00:00Z',
            end_date: '2026-01-20T00:00:00Z',
          }),
        }),
      )
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.title).toBe('Sprint 1')
      expect(data.status).toBe('planning')
      sprintId = data.id
    })

    test('should return 400 if end_date before start_date', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/sprints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({
            title: 'Bad Sprint',
            start_date: '2026-01-20T00:00:00Z',
            end_date: '2026-01-06T00:00:00Z',
          }),
        }),
      )
      expect(res.status).toBe(400)
    })

    test('should return 401 without auth', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/sprints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Test' }),
        }),
      )
      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/boards/:boardId/sprints/:sprintId/start', () => {
    test('should start a planning sprint', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/sprints/${sprintId}/start`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.status).toBe('active')
      activeSprintId = data.id
    })

    test('should return 409 if another sprint is active', async () => {
      // Create and start a second sprint
      const sprint2Res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/sprints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({
            title: 'Sprint 2',
            start_date: '2026-01-20T00:00:00Z',
            end_date: '2026-02-03T00:00:00Z',
          }),
        }),
      )
      const { data: sprint2 } = await sprint2Res.json()

      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/sprints/${sprint2.id}/start`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(409)
    })
  })

  describe('PUT /api/boards/:boardId/sprints/:sprintId/complete', () => {
    test('should complete an active sprint', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/sprints/${sprintId}/complete`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.status).toBe('completed')
      expect(data.stats.total_cards).toBeDefined()
    })
  })

  describe('PUT /api/cards/:cardId/sprint', () => {
    test('should assign card to sprint', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/cards/${cardId}/sprint`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ sprint_id: sprintId }),
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.sprint_id).toBe(sprintId)
    })

    test('should remove card from sprint', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/cards/${cardId}/sprint`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({ sprint_id: null }),
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.sprint_id).toBeNull()
    })
  })

  describe('GET /api/boards/:boardId/sprints/:sprintId/burndown', () => {
    test('should return burndown data', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/sprints/${sprintId}/burndown`, {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.ideal_line).toBeDefined()
      expect(data.actual_line).toBeDefined()
      expect(Array.isArray(data.ideal_line)).toBe(true)
    })
  })

  describe('DELETE /api/boards/:boardId/sprints/:sprintId', () => {
    test('should delete planning sprint', async () => {
      // Create a new planning sprint to delete
      const createRes = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/sprints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({
            title: 'To Delete',
            start_date: '2026-03-01T00:00:00Z',
            end_date: '2026-03-15T00:00:00Z',
          }),
        }),
      )
      const { data: newSprint } = await createRes.json()

      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/sprints/${newSprint.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(204)
    })

    test('should return 400 when deleting active sprint', async () => {
      // Let's create an active sprint to try to delete it
      const createRes = await db`
        INSERT INTO sprints (board_id, title, start_date, end_date, status)
        VALUES (${boardId}, 'Temp Active', NOW(), NOW() + interval '1 week', 'active')
        RETURNING id
      `
      const tempActiveId = createRes[0].id

      const res = await server.fetch(
        new Request(`http://localhost/api/boards/${boardId}/sprints/${tempActiveId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${testToken}` },
        }),
      )
      expect(res.status).toBe(400)
    })
  })
})
