import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('POST /api/cards/batch', () => {
  let userId: number
  let otherUserId: number
  let workspaceId: number
  let boardId: number
  let list1Id: number
  let list2Id: number
  let label1Id: number
  let card1: any
  let card2: any
  let card3: any
  let card4: any
  let card5: any
  let testToken: string
  let otherUserToken: string

  beforeAll(async () => {
    // Clean up potentially leftover users from previous crashed runs
    await db`DELETE FROM users WHERE email IN ('batch_user@example.com', 'batch_other@example.com')`

    // Create users
    const userRes = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('batch_user@example.com', 'hashed')
      RETURNING id
    `
    userId = userRes[0].id

    const otherUserRes = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('batch_other@example.com', 'hashed')
      RETURNING id
    `
    otherUserId = otherUserRes[0].id

    // Workspace
    const wsRes = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Batch Workspace', ${userId})
      RETURNING id
    `
    workspaceId = wsRes[0].id

    // Board
    const boardRes = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Batch Board', ${userId})
      RETURNING id
    `
    boardId = boardRes[0].id

    // Add user as admin to board
    await db`
      INSERT INTO board_members (board_id, user_id, role)
      VALUES (${boardId}, ${userId}, 'admin')
    `

    // Lists
    const list1Res = await db`
      INSERT INTO lists (board_id, title, position)
      VALUES (${boardId}, 'List 1', 0)
      RETURNING id
    `
    list1Id = list1Res[0].id

    const list2Res = await db`
      INSERT INTO lists (board_id, title, position)
      VALUES (${boardId}, 'List 2', 1)
      RETURNING id
    `
    list2Id = list2Res[0].id

    // Labels
    const labelRes = await db`
      INSERT INTO labels (board_id, name, color)
      VALUES (${boardId}, 'Important', '#ff0000')
      RETURNING id
    `
    label1Id = labelRes[0].id

    // Cards
    const c1 = await db`
      INSERT INTO cards (list_id, title, position) VALUES (${list1Id}, 'Card 1', 0) RETURNING *
    `
    card1 = c1[0]

    const c2 = await db`
      INSERT INTO cards (list_id, title, position) VALUES (${list1Id}, 'Card 2', 1) RETURNING *
    `
    card2 = c2[0]

    const c3 = await db`
      INSERT INTO cards (list_id, title, position) VALUES (${list1Id}, 'Card 3', 2) RETURNING *
    `
    card3 = c3[0]

    const c4 = await db`
      INSERT INTO cards (list_id, title, position) VALUES (${list1Id}, 'Card 4', 3) RETURNING *
    `
    card4 = c4[0]

    const c5 = await db`
      INSERT INTO cards (list_id, title, position) VALUES (${list1Id}, 'Card 5', 4) RETURNING *
    `
    card5 = c5[0]

    // Tokens
    testToken = await sign({ sub: userId, email: 'batch_user@example.com' }, 'your-jwt-secret-here-change-in-production')
    otherUserToken = await sign({ sub: otherUserId, email: 'batch_other@example.com' }, 'your-jwt-secret-here-change-in-production')
  })

  afterAll(async () => {
    // Cleanup will cascade because of user deletion, but delete specifically to be clean
    await db`DELETE FROM users WHERE id IN (${[userId, otherUserId]})`
  })

  test('should batch move cards to another list', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          card_ids: [card1.id, card2.id, card3.id],
          action: 'move',
          params: { list_id: list2Id },
        }),
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.action).toBe('move')
    expect(body.data.affected_count).toBe(3)

    // Verify in db
    const moved = await db`SELECT list_id FROM cards WHERE id IN (${card1.id}, ${card2.id}, ${card3.id})`
    expect(moved.length).toBe(3)
    expect(moved.every((c) => Number(c.list_id) === list2Id)).toBe(true)
  })

  test('should batch assign user', async () => {
    // First make sure the user is in workspace
    await db`
      INSERT INTO workspace_members (user_id, workspace_id, role)
      VALUES (${userId}, ${workspaceId}, 'member')
      ON CONFLICT DO NOTHING
    `

    const res = await app.fetch(
      new Request('http://localhost/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          card_ids: [card1.id, card2.id],
          action: 'assign',
          params: { user_id: userId },
        }),
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.affected_count).toBe(2)

    // Verify db
    const assigned = await db`SELECT assignee_id FROM cards WHERE id IN (${card1.id}, ${card2.id})`
    expect(assigned.length).toBe(2)
    expect(assigned.every((c) => Number(c.assignee_id) === userId)).toBe(true)
  })

  test('should batch add label', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          card_ids: [card1.id, card2.id],
          action: 'add_label',
          params: { label_id: label1Id },
        }),
      })
    )
    expect(res.status).toBe(200)

    const labels = await db`SELECT * FROM card_labels WHERE card_id IN (${card1.id}, ${card2.id})`
    expect(labels.length).toBe(2)
  })

  test('should batch archive cards', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          card_ids: [card4.id, card5.id],
          action: 'archive',
          params: {},
        }),
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.affected_count).toBe(2)

    // Verify db
    const archived = await db`SELECT archived_at FROM cards WHERE id IN (${card4.id}, ${card5.id})`
    expect(archived.length).toBe(2)
    expect(archived.every((c) => c.archived_at !== null)).toBe(true)
  })

  test('should batch delete cards', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          card_ids: [card4.id, card5.id],
          action: 'delete',
          params: {},
        }),
      })
    )
    expect(res.status).toBe(200)

    // Verify db
    const remaining = await db`SELECT * FROM cards WHERE id IN (${card4.id}, ${card5.id})`
    expect(remaining.length).toBe(0)
  })

  test('should return 400 if card_ids is empty', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ card_ids: [], action: 'archive', params: {} }),
      })
    )
    expect(res.status).toBe(400)
  })

  test('should return 400 if card_ids exceeds 100', async () => {
    const tooMany = Array.from({ length: 101 }, (_, i) => i + 1)
    const res = await app.fetch(
      new Request('http://localhost/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ card_ids: tooMany, action: 'archive', params: {} }),
      })
    )
    expect(res.status).toBe(400)
  })

  test('should return 400 if action is invalid', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ card_ids: [1], action: 'invalid_action', params: {} }),
      })
    )
    expect(res.status).toBe(400)
  })

  test('should return 403 if user has no access to cards', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherUserToken}` },
        body: JSON.stringify({ card_ids: [card1.id], action: 'archive', params: {} }),
      })
    )
    expect(res.status).toBe(403)
  })

  test('should return 401 without auth', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/cards/batch', {
        method: 'POST',
        body: JSON.stringify({ card_ids: [1], action: 'archive', params: {} }),
      })
    )
    expect(res.status).toBe(401)
  })
})
