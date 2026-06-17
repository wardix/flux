import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'

describe('Checklists API', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let checklistId: number
  let itemId: number
  let testToken: string
  let user2Id: number

  beforeAll(async () => {
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('checklist_test_user@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id

    const user2Result = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('checklist_test_user2@example.com', 'hashed')
      RETURNING id
    `
    user2Id = user2Result[0].id

    const workspaceResult = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Checklist Workspace', ${userId})
      RETURNING id
    `
    workspaceId = workspaceResult[0].id

    const boardResult = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Checklist Board', ${userId})
      RETURNING id
    `
    boardId = boardResult[0].id

    const listResult = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Checklist List')
      RETURNING id
    `
    listId = listResult[0].id

    const cardResult = await db`
      INSERT INTO cards (list_id, title)
      VALUES (${listId}, 'Card with Checklists')
      RETURNING id
    `
    cardId = cardResult[0].id

    const tokenPayload = {
      sub: userId,
      email: 'checklist_test_user@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    testToken = await sign(tokenPayload, process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id IN (${userId}, ${user2Id})`
  })

  test('POST /api/cards/:id/checklists > should create a checklist', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/checklists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'My Checklist',
        }),
      }),
    )

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.data.title).toBe('My Checklist')
    expect(json.data.card_id).toBe(cardId)
    checklistId = json.data.id
  })

  test('GET /api/cards/:id/checklists > should get checklists', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/checklists`, {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBe(1)
    expect(json[0].title).toBe('My Checklist')
  })

  test('PUT /api/cards/:cardId/checklists/:checklistId > should update checklist title', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/checklists/${checklistId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Checklist Name',
        }),
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.data.title).toBe('Updated Checklist Name')
  })

  test('POST /api/checklists/:checklistId/items > should create checklist item', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/checklists/${checklistId}/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Do task 1',
        }),
      }),
    )

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.data.title).toBe('Do task 1')
    expect(json.data.is_completed).toBe(false)
    itemId = json.data.id
  })

  test('PUT /api/checklists/:checklistId/items/:itemId > should update checklist item', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/checklists/${checklistId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_completed: true,
        }),
      }),
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.data.is_completed).toBe(true)
  })

  describe('Advanced Checklist Items (assignee & due_date)', () => {
    test('PUT /api/checklists/:checklistId/items/:itemId > should assign user to checklist item', async () => {
      const response = await app.fetch(
        new Request(`http://localhost/api/checklists/${checklistId}/items/${itemId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${testToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignee_id: user2Id,
          }),
        }),
      )
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.assignee).toBeDefined()
      expect(json.data.assignee.id).toBe(user2Id)
    })

    test('PUT /api/checklists/:checklistId/items/:itemId > should unassign user from checklist item', async () => {
      const response = await app.fetch(
        new Request(`http://localhost/api/checklists/${checklistId}/items/${itemId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${testToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignee_id: null,
          }),
        }),
      )
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.assignee).toBeNull()
    })

    test('PUT /api/checklists/:checklistId/items/:itemId > should set due date on checklist item', async () => {
      const response = await app.fetch(
        new Request(`http://localhost/api/checklists/${checklistId}/items/${itemId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${testToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            due_date: '2026-01-20T17:00:00Z',
          }),
        }),
      )
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.due_date).toBe('2026-01-20T17:00:00.000Z') // DB returns formatted
    })

    test('PUT /api/checklists/:checklistId/items/:itemId > should set assignee and due_date simultaneously', async () => {
      const response = await app.fetch(
        new Request(`http://localhost/api/checklists/${checklistId}/items/${itemId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${testToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignee_id: user2Id,
            due_date: '2026-01-25T10:00:00.000Z',
          }),
        }),
      )
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.assignee.id).toBe(user2Id)
      expect(json.data.due_date).toBe('2026-01-25T10:00:00.000Z')
    })

    test('GET /api/cards/:id/checklists > should include assignee and due_date', async () => {
      const response = await app.fetch(
        new Request(`http://localhost/api/cards/${cardId}/checklists`, {
          headers: {
            Authorization: `Bearer ${testToken}`,
          },
        }),
      )
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.length).toBeGreaterThanOrEqual(1)
      const items = json[0].items
      expect(items.length).toBeGreaterThanOrEqual(1)
      const assignedItem = items.find((i: any) => i.id === itemId)
      expect(assignedItem).toBeDefined()
      expect(assignedItem.assignee.id).toBe(user2Id)
      expect(assignedItem.due_date).toBe('2026-01-25T10:00:00.000Z')
    })
  })

  test('DELETE /api/checklists/:checklistId/items/:itemId > should delete checklist item', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/checklists/${checklistId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      }),
    )

    expect(response.status).toBe(204)
  })

  test('DELETE /api/cards/:cardId/checklists/:checklistId > should delete checklist', async () => {
    const response = await app.fetch(
      new Request(`http://localhost/api/cards/${cardId}/checklists/${checklistId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      }),
    )

    expect(response.status).toBe(204)
  })
})
