import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('GET /api/search', () => {
  let userId: number
  let otherUserId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId1: number
  let cardId2: number
  let testToken: string
  let otherUserToken: string

  beforeAll(async () => {
    // 1. Create test user
    const userRes = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('search_test@example.com', 'hashed')
      RETURNING id
    `
    userId = userRes[0].id

    // 2. Create other user
    const otherUserRes = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('search_other@example.com', 'hashed')
      RETURNING id
    `
    otherUserId = otherUserRes[0].id

    // 3. Create workspace
    const workspaceRes = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Search Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspaceRes[0].id

    // Add search_test user as member
    await db`
      INSERT INTO workspace_members (user_id, workspace_id, role)
      VALUES (${userId}, ${workspaceId}, 'owner')
    `

    // 4. Create board
    const boardRes = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Search Board', ${userId})
      RETURNING id
    `
    boardId = boardRes[0].id

    // 5. Create list
    const listRes = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Search List')
      RETURNING id
    `
    listId = listRes[0].id

    // 6. Create cards with login and task titles
    const card1Res = await db`
      INSERT INTO cards (list_id, title, description, assignee_id, due_date)
      VALUES (${listId}, 'Fix login page issue', 'Button does not work on Safari', ${userId}, ${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()})
      RETURNING id
    `
    cardId1 = card1Res[0].id

    const card2Res = await db`
      INSERT INTO cards (list_id, title, description)
      VALUES (${listId}, 'Verify dashboard reports', 'Compare numbers with database')
      RETURNING id
    `
    cardId2 = card2Res[0].id

    // Create tokens
    testToken = await sign(
      { sub: userId, email: 'search_test@example.com' },
      'your-jwt-secret-here-change-in-production'
    )
    otherUserToken = await sign(
      { sub: otherUserId, email: 'search_other@example.com' },
      'your-jwt-secret-here-change-in-production'
    )
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id IN (${userId}, ${otherUserId})`
  })

  test('should return cards matching query', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/search?q=login', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
    )
    expect(res.status).toBe(200)
    const { data, meta } = await res.json()
    expect(data.length).toBeGreaterThan(0)
    expect(data[0].title.toLowerCase()).toContain('login')
    expect(meta.page).toBe(1)
  })

  test('should return 400 if query is less than 2 characters', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/search?q=a', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
    )
    expect(res.status).toBe(400)
  })

  test('should return 400 if query is missing', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/search', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
    )
    expect(res.status).toBe(400)
  })

  test('should return 401 without auth token', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/search?q=test')
    )
    expect(res.status).toBe(401)
  })

  test('should filter by assignee', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/api/search?q=login&assignee=${userId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
    )
    expect(res.status).toBe(200)
    const { data } = await res.json()
    data.forEach((card: any) => {
      expect(card.assignees.some((a: any) => a.id === userId)).toBe(true)
    })
  })

  test('should filter by due status overdue', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/search?q=login&due=overdue', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
    )
    expect(res.status).toBe(200)
    const { data } = await res.json()
    data.forEach((card: any) => {
      expect(new Date(card.due_date).getTime()).toBeLessThan(Date.now())
    })
  })

  test('should only return cards from boards user has access to', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/search?q=login', {
        headers: { Authorization: `Bearer ${otherUserToken}` },
      })
    )
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.length).toBe(0) // otherUser tidak punya akses
  })

  test('should paginate results', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/search?q=login&page=2&per_page=5', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
    )
    expect(res.status).toBe(200)
    const { meta } = await res.json()
    expect(meta.page).toBe(2)
    expect(meta.perPage).toBe(5)
  })
})
