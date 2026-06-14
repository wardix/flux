import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('Story Points', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let card1Id: number
  let card2Id: number
  let testToken: string

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('sp_test_user@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id

    const workspaceResult = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('SP Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspaceResult[0].id

    const boardResult = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'SP Board', ${userId})
      RETURNING id
    `
    boardId = boardResult[0].id

    const listResult = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'SP List')
      RETURNING id
    `
    listId = listResult[0].id

    const cardResult = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'SP Card')
      RETURNING id
    `
    cardId = cardResult[0].id

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
      email: 'sp_test_user@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    testToken = await sign(tokenPayload, 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('should update card with story_points', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ story_points: 5 }),
      }),
    )
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.story_points).toBe(5)
  })

  test('should set story_points to null', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ story_points: null }),
      }),
    )
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.story_points).toBeNull()
  })

  test('should return 400 for negative story_points', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ story_points: -1 }),
      }),
    )
    expect(res.status).toBe(400)
  })

  test('should return 400 for story_points > 100', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ story_points: 101 }),
      }),
    )
    expect(res.status).toBe(400)
  })

  test('should return 400 for non-integer story_points', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ story_points: 3.5 }),
      }),
    )
    expect(res.status).toBe(400)
  })

  test('should include total_story_points in board response', async () => {
    // Set story points on cards
    await app.fetch(
      new Request(`http://localhost/api/cards/${card1Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ story_points: 5 }),
      }),
    )
    await app.fetch(
      new Request(`http://localhost/api/cards/${card2Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ story_points: 8 }),
      }),
    )

    const res = await app.fetch(
      new Request(`http://localhost/api/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      }),
    )
    expect(res.status).toBe(200)
    const { data } = await res.json()
    const list = data.lists.find((l: { id: number; total_story_points: number }) => l.id === listId)
    expect(list.total_story_points).toBe(13)
  })
})
