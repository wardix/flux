import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import server from '../../src/index'
import { db } from '../../src/db'

describe('Recurring Tasks API', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let testToken: string
  let ruleId: number

  beforeAll(async () => {
    // Seed user
    const [user] = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('test_recurring@flux.com', 'hash')
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

    // Create board
    const [board] = await db`
      INSERT INTO boards (workspace_id, title)
      VALUES (${workspaceId}, 'Board')
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
      VALUES (${listId}, 'Test Recurring Card')
      RETURNING id
    `
    cardId = card.id
  })

  afterAll(async () => {
    await db`DELETE FROM workspaces WHERE owner_id = ${userId}`
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  describe('POST /api/recurring-tasks', () => {
    test('should create a recurring rule for a card', async () => {
      const res = await server.fetch(
        new Request('http://localhost/api/recurring-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({
            card_id: cardId,
            frequency: 'weekly',
          }),
        })
      )
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.card_id).toBe(cardId)
      expect(data.frequency).toBe('weekly')
      expect(data.is_active).toBe(true)
      ruleId = data.id

      // Verify card was set as is_recurring
      const [cardData] = await db`SELECT is_recurring FROM cards WHERE id = ${cardId}`
      expect(cardData.is_recurring).toBe(true)
    })

    test('should return 400 if frequency is invalid', async () => {
      const res = await server.fetch(
        new Request('http://localhost/api/recurring-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({
            card_id: cardId,
            frequency: 'hourly',
          }),
        })
      )
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/recurring-tasks/card/:cardId', () => {
    test('should get recurring rule for card', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/recurring-tasks/card/${cardId}`, {
          headers: { Authorization: `Bearer ${testToken}` },
        })
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.id).toBe(ruleId)
    })
  })

  describe('PUT /api/recurring-tasks/:id', () => {
    test('should update recurring rule frequency and status', async () => {
      const res = await server.fetch(
        new Request(`http://localhost/api/recurring-tasks/${ruleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
          body: JSON.stringify({
            frequency: 'daily',
            is_active: false,
          }),
        })
      )
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.frequency).toBe('daily')
      expect(data.is_active).toBe(false)

      // Verify card table updated to false
      const [cardData] = await db`SELECT is_recurring FROM cards WHERE id = ${cardId}`
      expect(cardData.is_recurring).toBe(false)
    })
  })

  describe('DELETE /api/recurring-tasks/:id', () => {
    test('should delete recurring rule and set is_recurring to false', async () => {
      // Re-enable first
      await db`UPDATE cards SET is_recurring = TRUE WHERE id = ${cardId}`
      
      const res = await server.fetch(
        new Request(`http://localhost/api/recurring-tasks/${ruleId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${testToken}` },
        })
      )
      expect(res.status).toBe(204)

      // Verify rule is deleted
      const checkRule = await db`SELECT * FROM recurring_tasks WHERE id = ${ruleId}`
      expect(checkRule.length).toBe(0)

      // Verify card was toggled to false
      const [cardData] = await db`SELECT is_recurring FROM cards WHERE id = ${cardId}`
      expect(cardData.is_recurring).toBe(false)
    })
  })
})
