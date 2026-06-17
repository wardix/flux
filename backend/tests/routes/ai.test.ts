import { afterAll, beforeAll, describe, expect, test, mock } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import { app } from '../../src/index'

// Mock OpenAI chat completions create method
const mockCreate = mock(() => Promise.resolve({
  choices: [{
    message: {
      content: JSON.stringify({
        suggested_labels: [
          { name: 'bug', confidence: 0.95 },
        ],
        suggested_assignees: [
          { name: 'Jane', confidence: 0.85, reason: 'Has handled similar mobile/UI bugs recently' },
        ],
        summary: 'Card summary from mocked AI',
        key_points: ['Point 1'],
        reasoning: 'Test reasoning',
      }),
    },
  }],
}))

mock.module('openai', () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: mockCreate
        }
      }
    }
  }
})

describe('AI Routes', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let token: string
  const originalKey = process.env.OPENAI_API_KEY

  beforeAll(async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    
    const userResult = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('ai_route_test@example.com', 'hashed')
      RETURNING id
    `
    userId = userResult[0].id

    const workspaceResult = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Route Workspace AI', ${userId})
      RETURNING id
    `
    workspaceId = workspaceResult[0].id

    const boardResult = await db`
      INSERT INTO boards (workspace_id, title, created_by)
      VALUES (${workspaceId}, 'Route Board AI', ${userId})
      RETURNING id
    `
    boardId = boardResult[0].id

    const listResult = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Route List AI')
      RETURNING id
    `
    listId = listResult[0].id

    const cardResult = await db`
      INSERT INTO cards (list_id, title, description)
      VALUES (${listId}, 'Bug: Login issues', 'Safari does not submit form')
      RETURNING id
    `
    cardId = cardResult[0].id

    const tokenPayload = {
      sub: userId,
      email: 'ai_route_test@example.com',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    token = await sign(tokenPayload, process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    process.env.OPENAI_API_KEY = originalKey
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('POST /api/ai/suggest-labels - should return 401 without auth', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/ai/suggest-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      })
    )
    expect(res.status).toBe(401)
  })

  test('POST /api/ai/suggest-labels - should return 400 if title is missing', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/ai/suggest-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description: 'Only description' }),
      })
    )
    expect(res.status).toBe(400)
  })

  test('POST /api/ai/suggest-labels - should return suggested labels', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/ai/suggest-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Bug: login issue',
          available_labels: [{ id: 1, name: 'bug', color: '#ff0000' }],
        }),
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.suggested_labels).toBeDefined()
    expect(body.data.suggested_labels[0].name).toBe('bug')
  })

  test('POST /api/ai/summarize - should summarize card', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ card_id: cardId }),
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.summary).toBeDefined()
    expect(body.data.key_points).toBeDefined()
  })

  test('POST /api/ai/suggest-assignee - should suggest assignees', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/ai/suggest-assignee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Fix Safari Login',
          available_members: [{ id: 1, name: 'Jane' }],
        }),
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.suggested_assignees).toBeDefined()
    expect(body.data.suggested_assignees[0].name).toBe('Jane')
  })

  test('POST /api/ai/suggest-labels - should return 503 if API key missing', async () => {
    delete process.env.OPENAI_API_KEY
    const res = await app.fetch(
      new Request('http://localhost/api/ai/suggest-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Bug: login issue',
          available_labels: [{ id: 1, name: 'bug', color: '#ff0000' }],
        }),
      })
    )
    expect(res.status).toBe(503)
    process.env.OPENAI_API_KEY = 'test-key'
  })
})
