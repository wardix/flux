import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'

describe('Mirrors Route', () => {
  let userId1: number
  let userId2: number
  let workspaceId1: number
  let workspaceId2: number
  let boardId1: number
  let boardId2: number
  let boardIdNoAccess: number
  let listId1: number
  let listId2: number
  let listId3: number
  let listIdNoAccess: number
  let cardId1: number
  let token1: string
  let tokenNoAccess: string
  let createdMirrorId: number

  beforeAll(async () => {
    // Create users
    const u1 =
      await db`INSERT INTO users (email, password_hash) VALUES ('mirror_u1@example.com', 'hash') RETURNING id`
    userId1 = u1[0].id

    const u2 =
      await db`INSERT INTO users (email, password_hash) VALUES ('mirror_u2@example.com', 'hash') RETURNING id`
    userId2 = u2[0].id

    // Create workspaces
    const w1 =
      await db`INSERT INTO workspaces (name, owner_id) VALUES ('WS 1', ${userId1}) RETURNING id`
    workspaceId1 = w1[0].id

    const w2 =
      await db`INSERT INTO workspaces (name, owner_id) VALUES ('WS 2', ${userId2}) RETURNING id`
    workspaceId2 = w2[0].id

    // Create boards
    const b1 =
      await db`INSERT INTO boards (workspace_id, title, created_by) VALUES (${workspaceId1}, 'Board 1', ${userId1}) RETURNING id`
    boardId1 = b1[0].id

    const b2 =
      await db`INSERT INTO boards (workspace_id, title, created_by) VALUES (${workspaceId1}, 'Board 2', ${userId1}) RETURNING id`
    boardId2 = b2[0].id

    const b3 =
      await db`INSERT INTO boards (workspace_id, title, created_by) VALUES (${workspaceId2}, 'Board No Access', ${userId2}) RETURNING id`
    boardIdNoAccess = b3[0].id

    // Create lists
    const l1 =
      await db`INSERT INTO lists (board_id, title) VALUES (${boardId1}, 'List 1') RETURNING id`
    listId1 = l1[0].id

    const l2 =
      await db`INSERT INTO lists (board_id, title) VALUES (${boardId1}, 'List 2') RETURNING id`
    listId2 = l2[0].id

    const l3 =
      await db`INSERT INTO lists (board_id, title) VALUES (${boardId2}, 'List 3') RETURNING id`
    listId3 = l3[0].id

    const lNo =
      await db`INSERT INTO lists (board_id, title) VALUES (${boardIdNoAccess}, 'List No Access') RETURNING id`
    listIdNoAccess = lNo[0].id

    // Create a source card
    const c1 =
      await db`INSERT INTO cards (list_id, title, description, story_points) VALUES (${listId1}, 'Source Card', 'Desc', 5) RETURNING id`
    cardId1 = c1[0].id

    // Tokens
    const payload1 = {
      sub: userId1,
      email: 'mirror_u1@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }
    const secret = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
    token1 = await sign(payload1, secret, 'HS256')

    const payloadNo = {
      sub: userId2,
      email: 'mirror_u2@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }
    tokenNoAccess = await sign(payloadNo, secret, 'HS256')
  })

  afterAll(async () => {
    // Cleanup will cascade and delete boards, lists, cards, mirrors
    await db`DELETE FROM users WHERE id IN (${userId1}, ${userId2})`
  })

  describe('POST /api/cards/:id/mirror', () => {
    test('should create a mirror card', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${cardId1}/mirror`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token1}`,
          },
          body: JSON.stringify({
            target_board_id: boardId2,
            target_list_id: listId3,
            position: 0,
          }),
        }),
      )
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data).toBeDefined()
      expect(body.data.source_card_id).toBe(cardId1)
      expect(body.data.mirror_board_id).toBe(boardId2)
      expect(body.data.mirror_list_id).toBe(listId3)
      createdMirrorId = body.data.id
    })

    test('should return 400 when mirroring to own list', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${cardId1}/mirror`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token1}`,
          },
          body: JSON.stringify({
            target_board_id: boardId1,
            target_list_id: listId1, // Same list as source
            position: 0,
          }),
        }),
      )
      expect(res.status).toBe(400)
    })

    test('should return 409 when mirror already exists', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${cardId1}/mirror`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token1}`,
          },
          body: JSON.stringify({
            target_board_id: boardId2,
            target_list_id: listId3, // Already mirrored here
            position: 0,
          }),
        }),
      )
      expect(res.status).toBe(409)
    })

    test('should return 403 if user has no access to target board', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${cardId1}/mirror`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token1}`,
          },
          body: JSON.stringify({
            target_board_id: boardIdNoAccess,
            target_list_id: listIdNoAccess,
            position: 0,
          }),
        }),
      )
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/cards/:id/mirrors', () => {
    test('should return all mirrors for a card', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${cardId1}/mirrors`, {
          headers: {
            Authorization: `Bearer ${token1}`,
          },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBeGreaterThan(0)
      expect(body.data[0].mirror_board_title).toBe('Board 2')
      expect(body.data[0].mirror_list_title).toBe('List 3')
    })
  })

  describe('Mirror Sync', () => {
    test('updating source card should be visible in mirror', async () => {
      // Get the mirror card's ID first from mirrors mapping
      const mapping =
        await db`SELECT mirror_card_id FROM card_mirrors WHERE id = ${createdMirrorId}`
      const mirrorCardId = mapping[0].mirror_card_id

      // Update source card title
      const updateRes = await app.fetch(
        new Request(`http://localhost/api/cards/${cardId1}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token1}`,
          },
          body: JSON.stringify({
            title: 'Updated Source Title',
          }),
        }),
      )
      expect(updateRes.status).toBe(200)

      // Fetch mirror card from cards table
      const mirrorRes = await db`SELECT title FROM cards WHERE id = ${mirrorCardId}`
      expect(mirrorRes[0].title).toBe('Updated Source Title')
    })

    test('mirrored cards should appear in target list', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/boards/${boardId2}`, {
          headers: {
            Authorization: `Bearer ${token1}`,
          },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      const list3 = body.data.lists.find((l: any) => l.id === listId3)
      expect(list3).toBeDefined()
      const mirrorCard = list3.cards.find((c: any) => c.is_mirror === true)
      expect(mirrorCard).toBeDefined()
      expect(mirrorCard.source_board_title).toBe('Board 1')
    })
  })

  describe('DELETE /api/cards/:id/mirror/:mirrorId', () => {
    test('should delete mirror', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${cardId1}/mirror/${createdMirrorId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token1}`,
          },
        }),
      )
      expect(res.status).toBe(204)

      // Verify mirror card is deleted from cards table
      const mapping = await db`SELECT * FROM card_mirrors WHERE id = ${createdMirrorId}`
      expect(mapping.length).toBe(0)
    })

    test('should return 404 for non-existent mirror', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/cards/${cardId1}/mirror/99999`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token1}`,
          },
        }),
      )
      expect(res.status).toBe(404)
    })
  })
})
