import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { sign } from 'hono/jwt'
import { app } from '../../src/index'
import { db } from '../../src/db/index'

describe('Map Cards API', () => {
  let testToken: string
  let userId: number
  let boardId: number
  let cardId1: number
  let cardId2: number

  beforeAll(async () => {
    // Create user and token
    const [user] = await db`INSERT INTO users (email, password_hash) VALUES ('map_test@example.com', 'hashed') RETURNING id`
    userId = user.id
    
    const tokenPayload = {
      sub: userId,
      email: 'map_test@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    testToken = await sign(tokenPayload, process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production', 'HS256')

    // Setup basic board and list
    const [workspace] = await db`INSERT INTO workspaces (name, owner_id) VALUES ('Map Workspace', ${userId}) RETURNING id`
    const [board] = await db`INSERT INTO boards (title, workspace_id) VALUES ('Map Board', ${workspace.id}) RETURNING id`
    boardId = board.id
    const [list] = await db`INSERT INTO lists (title, board_id, position) VALUES ('To Do', ${board.id}, 0) RETURNING id`

    // Create cards
    const [card1] = await db`
      INSERT INTO cards (title, list_id, position, latitude, longitude, address) 
      VALUES ('Card 1', ${list.id}, 0, -6.1578, 106.9046, 'Kelapa Gading') 
      RETURNING id
    `
    const [card2] = await db`
      INSERT INTO cards (title, list_id, position) 
      VALUES ('Card 2', ${list.id}, 1) 
      RETURNING id
    `
    cardId1 = card1.id
    cardId2 = card2.id
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  describe('GET /api/boards/:boardId/cards/map', () => {
    test('should return cards with location data', async () => {
      const req = new Request(`http://localhost/api/boards/${boardId}/cards/map`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      const res = await app.fetch(req)
      if (res.status !== 200) {
        console.error('GET map cards error:', await res.text())
      }
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1) // Only card 1 has location
      expect(data[0].id).toBe(cardId1)
      expect(data[0].latitude).toBe('-6.15780000')
      expect(data[0].longitude).toBe('106.90460000')
    })

    test('should filter by map bounds', async () => {
      // Out of bounds
      const req1 = new Request(`http://localhost/api/boards/${boardId}/cards/map?bounds=-7.0,-6.5,106.0,106.5`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      const res1 = await app.fetch(req1)
      expect(res1.status).toBe(200)
      const data1 = await res1.json()
      expect(data1.data.length).toBe(0)

      // In bounds
      const req2 = new Request(`http://localhost/api/boards/${boardId}/cards/map?bounds=-6.2,-6.1,106.8,107.0`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      const res2 = await app.fetch(req2)
      expect(res2.status).toBe(200)
      const data2 = await res2.json()
      expect(data2.data.length).toBe(1)
    })

    test('should return 401 without auth', async () => {
      const req = new Request(`http://localhost/api/boards/${boardId}/cards/map`)
      const res = await app.fetch(req)
      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/cards/:id (location)', () => {
    test('should update card with location', async () => {
      const req = new Request(`http://localhost/api/cards/${cardId2}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          latitude: -6.2088,
          longitude: 106.8456,
          address: 'Jakarta Pusat',
        }),
      })
      const res = await app.fetch(req)
      if (res.status !== 200) {
        console.error('PUT card error:', await res.text())
      }
      expect(res.status).toBe(200)
      const data = await res.json()
      
      const [updatedCard] = await db`SELECT * FROM cards WHERE id = ${cardId2}`
      expect(updatedCard.latitude).toBe('-6.20880000')
      expect(updatedCard.longitude).toBe('106.84560000')
      expect(updatedCard.address).toBe('Jakarta Pusat')
    })
  })
})
