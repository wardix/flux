import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../src/db'
import server from '../../src/index'

describe('Import Projects API', () => {
  let userId: number
  let workspaceId: number
  let testToken: string

  beforeAll(async () => {
    // Seed user
    const [user] = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('import_test@flux.com', 'hash')
      RETURNING id
    `
    userId = user.id

    // Generate JWT token
    const { sign } = await import('hono/jwt')
    const secretKey = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
    testToken = await sign(
      { sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 },
      secretKey,
      'HS256',
    )

    // Create workspace
    const [ws] = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Import WS', ${userId})
      RETURNING id
    `
    workspaceId = ws.id
  })

  afterAll(async () => {
    await db`DELETE FROM workspaces WHERE owner_id = ${userId}`
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('should import Trello board successfully', async () => {
    const trelloJSON = {
      name: 'Trello Project',
      lists: [
        { id: 'l1', name: 'Backlog', closed: false, pos: 16384 },
        { id: 'l2', name: 'Done', closed: false, pos: 32768 },
        { id: 'l3', name: 'Archived List', closed: true, pos: 49152 },
      ],
      cards: [
        { id: 'c1', idList: 'l1', name: 'Feature A', desc: 'Detail A', closed: false, pos: 100 },
        { id: 'c2', idList: 'l2', name: 'Bug B', desc: 'Detail B', closed: false, pos: 200 },
        { id: 'c3', idList: 'l3', name: 'Card in archived', desc: 'No', closed: false, pos: 300 },
      ],
    }

    const res = await server.fetch(
      new Request('http://localhost/api/import/trello', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          workspace_id: workspaceId,
          trello_data: trelloJSON,
        }),
      }),
    )
    expect(res.status).toBe(201)
    const { data } = await res.json()
    expect(data.title).toBe('Trello Project')

    // Check columns and cards inserted
    const lists =
      await db`SELECT id, title FROM lists WHERE board_id = ${data.id} ORDER BY position ASC`
    expect(lists.length).toBe(2)
    expect(lists[0].title).toBe('Backlog')
    expect(lists[1].title).toBe('Done')

    const cards = await db`SELECT id, title, description FROM cards WHERE list_id = ${lists[0].id}`
    expect(cards.length).toBe(1)
    expect(cards[0].title).toBe('Feature A')
    expect(cards[0].description).toBe('Detail A')
  })

  test('should import Jira board successfully', async () => {
    const jiraCSVRows = [
      { summary: 'Jira Task 1', description: 'Desc 1', status: 'To Do', storyPoints: 5 },
      { summary: 'Jira Task 2', description: 'Desc 2', status: 'In Progress', storyPoints: 8 },
      { summary: 'Jira Task 3', description: 'Desc 3', status: 'To Do', storyPoints: 3 },
    ]

    const res = await server.fetch(
      new Request('http://localhost/api/import/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          workspace_id: workspaceId,
          board_title: 'Jira Import Board',
          jira_rows: jiraCSVRows,
        }),
      }),
    )
    expect(res.status).toBe(201)
    const { data } = await res.json()
    expect(data.title).toBe('Jira Import Board')

    // Check columns and cards
    const lists =
      await db`SELECT id, title FROM lists WHERE board_id = ${data.id} ORDER BY position ASC`
    expect(lists.length).toBe(2)
    expect(lists[0].title).toBe('To Do')
    expect(lists[1].title).toBe('In Progress')

    const cards =
      await db`SELECT id, title, story_points FROM cards WHERE list_id = ${lists[0].id} ORDER BY position ASC`
    expect(cards.length).toBe(2)
    expect(cards[0].title).toBe('Jira Task 1')
    expect(cards[0].story_points).toBe(5)
  })
})
