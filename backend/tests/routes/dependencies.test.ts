import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'

describe('Card Dependencies API', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let card1Id: number
  let card2Id: number
  let testToken: string
  let depId: number

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('dep_test_user@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id

    const workspaceResult = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Dep Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspaceResult[0].id

    const boardResult = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Dep Board', ${userId})
      RETURNING id
    `
    boardId = boardResult[0].id

    const listResult = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Dep List')
      RETURNING id
    `
    listId = listResult[0].id

    const card1Result = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'Card 1')
      RETURNING id
    `
    card1Id = card1Result[0].id

    const card2Result = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'Card 2')
      RETURNING id
    `
    card2Id = card2Result[0].id

    const tokenPayload = {
      sub: userId,
      email: 'dep_test_user@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    testToken = await sign(tokenPayload, process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  describe('POST /api/cards/:id/dependencies', () => {
    test('should create dependency between two cards', async () => {
      const res = await app.fetch(new Request(`http://localhost/api/cards/${card1Id}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ blocked_card_id: card2Id }),
      }))
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.blocking_card_id).toBe(card1Id)
      expect(data.blocked_card_id).toBe(card2Id)
      depId = data.id
    })

    test('should return 400 for self-dependency', async () => {
      const res = await app.fetch(new Request(`http://localhost/api/cards/${card1Id}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ blocked_card_id: card1Id }),
      }))
      expect(res.status).toBe(400)
    })

    test('should return 409 for duplicate dependency', async () => {
      const res = await app.fetch(new Request(`http://localhost/api/cards/${card1Id}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ blocked_card_id: card2Id }),
      }))
      expect(res.status).toBe(409)
    })

    test('should return 400 for circular dependency', async () => {
      // card1 blocks card2, now try card2 blocks card1 → circular
      const res = await app.fetch(new Request(`http://localhost/api/cards/${card2Id}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ blocked_card_id: card1Id }),
      }))
      expect(res.status).toBe(400)
    })

    test('should return 401 without auth', async () => {
      const res = await app.fetch(new Request(`http://localhost/api/cards/${card1Id}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked_card_id: card2Id }),
      }))
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/cards/:id/dependencies', () => {
    test('should return blocking and blocked_by lists', async () => {
      const res = await app.fetch(new Request(`http://localhost/api/cards/${card1Id}/dependencies`, {
        headers: { Authorization: `Bearer ${testToken}` },
      }))
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.blocking).toBeDefined()
      expect(data.blocked_by).toBeDefined()
      expect(Array.isArray(data.blocking)).toBe(true)
    })

    test('should return 404 for non-existent card', async () => {
      const res = await app.fetch(new Request('http://localhost/api/cards/99999/dependencies', {
        headers: { Authorization: `Bearer ${testToken}` },
      }))
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/cards/:id/dependencies/:depId', () => {
    test('should delete dependency', async () => {
      const res = await app.fetch(new Request(`http://localhost/api/cards/${card1Id}/dependencies/${depId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testToken}` },
      }))
      expect(res.status).toBe(204)
    })

    test('should return 404 for non-existent dependency', async () => {
      const res = await app.fetch(new Request(`http://localhost/api/cards/${card1Id}/dependencies/99999`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testToken}` },
      }))
      expect(res.status).toBe(404)
    })
  })
})
