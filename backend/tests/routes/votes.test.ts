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

describe('Voting API', () => {
  let userId: number
  let userId2: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let otherCardId: number
  let testToken: string
  let testToken2: string

  beforeAll(async () => {
    // 1. Create users
    const user = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('vote_test@example.com', 'hashed')
      RETURNING id
    `
    userId = user[0].id

    const user2 = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('vote_test2@example.com', 'hashed')
      RETURNING id
    `
    userId2 = user2[0].id

    // 2. Create workspace
    const workspace = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Vote Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspace[0].id

    // 3. Create board
    const board = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Vote Board', ${userId})
      RETURNING id
    `
    boardId = board[0].id

    // 4. Create list
    const list = await db`
      INSERT INTO lists (board_id, title, position)
      VALUES (${boardId}, 'Vote List', 0)
      RETURNING id
    `
    listId = list[0].id

    // 5. Create cards
    const card = await db`
      INSERT INTO cards (list_id, title, position)
      VALUES (${listId}, 'Card 1', 0)
      RETURNING id
    `
    cardId = card[0].id

    const otherCard = await db`
      INSERT INTO cards (list_id, title, position)
      VALUES (${listId}, 'Card 2', 1)
      RETURNING id
    `
    otherCardId = otherCard[0].id

    // 6. Generate tokens
    testToken = await sign(
      { sub: userId, email: 'vote_test@example.com' },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      'HS256',
    )

    testToken2 = await sign(
      { sub: userId2, email: 'vote_test2@example.com' },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      'HS256',
    )
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id IN (${userId}, ${userId2})`
  })

  describe('POST /api/cards/:id/vote', () => {
    test('should add vote to card', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = (await res.json()) as any
      expect(data.voted).toBe(true)
      expect(data.vote_count).toBe(1)
      expect(data.user_voted).toBe(true)
    })

    test('should remove vote on second click (toggle)', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = (await res.json()) as any
      expect(data.voted).toBe(false)
      expect(data.vote_count).toBe(0)
      expect(data.user_voted).toBe(false)
    })

    test('should allow multiple users to vote', async () => {
      // User 1 votes
      await makeRequest(`/api/cards/${cardId}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      // User 2 votes
      const res = await makeRequest(`/api/cards/${cardId}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testToken2}` },
      })
      expect(res.status).toBe(200)
      const { data } = (await res.json()) as any
      expect(data.vote_count).toBe(2)
    })

    test('should return 404 for non-existent card', async () => {
      const res = await makeRequest('/api/cards/99999/vote', {
        method: 'POST',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(404)
    })

    test('should return 401 without auth', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/vote`, {
        method: 'POST',
      })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/cards/:id/votes', () => {
    test('should return vote count and voter list', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/votes`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = (await res.json()) as any
      expect(data.vote_count).toBeGreaterThanOrEqual(0)
      expect(typeof data.user_voted).toBe('boolean')
      expect(Array.isArray(data.voters)).toBe(true)
    })

    test('should include voter details', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/votes`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      const { data } = (await res.json()) as any
      if (data.voters.length > 0) {
        expect(data.voters[0]).toHaveProperty('id')
        expect(data.voters[0]).toHaveProperty('name')
        expect(data.voters[0]).toHaveProperty('voted_at')
      }
    })

    test('should return user_voted=true if current user voted', async () => {
      const res = await makeRequest(`/api/cards/${cardId}/votes`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      const { data } = (await res.json()) as any
      expect(data.user_voted).toBe(true) // user 1 voted in previous test
    })
  })

  describe('Sort by votes', () => {
    test('should sort cards by vote count when sort=votes', async () => {
      // Vote for different cards with different counts
      // Card 1: 2 votes (testToken and testToken2)
      // Card 2 (otherCardId): 0 votes

      const res = await makeRequest(`/api/boards/${boardId}?sort=votes`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = (await res.json()) as any
      const cards = data.lists[0].cards
      if (cards.length >= 2) {
        expect(cards[0].vote_count).toBeGreaterThanOrEqual(cards[1].vote_count)
      }
    })
  })
})
