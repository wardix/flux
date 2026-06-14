import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { app } from '../../src/index'
import { db } from '../../src/db'

let testToken = ''
let boardId: number
let cardId1: number
let cardId2: number

beforeAll(async () => {
  await db`DELETE FROM users WHERE email = 'releases@example.com'`
  
  const userRes = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'releases@example.com', password: 'password123', name: 'Releases User' })
  })
  
  const loginRes = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'releases@example.com', password: 'password123' })
  })
  const loginData = await loginRes.json()
  testToken = loginData.data.token

  const wsRes = await app.request('/api/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
    body: JSON.stringify({ name: 'Releases Workspace' })
  })
  const ws = await wsRes.json()

  const boardRes = await app.request('/api/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
    body: JSON.stringify({ title: 'Releases Board', workspace_id: ws.data.id })
  })
  const board = await boardRes.json()
  boardId = board.data.id

  const listRes = await app.request('/api/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
    body: JSON.stringify({ title: 'Done', position: 1, board_id: boardId })
  })
  const list = await listRes.json()

  const cardRes1 = await app.request('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
    body: JSON.stringify({ title: 'Feature 1', list_id: list.data.id, position: 1, board_id: boardId })
  })
  const card1 = await cardRes1.json()
  cardId1 = card1.data.id

  const cardRes2 = await app.request('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
    body: JSON.stringify({ title: 'Bugfix 1', list_id: list.data.id, position: 2, board_id: boardId })
  })
  const card2 = await cardRes2.json()
  cardId2 = card2.data.id

  // Mark cards as completed
  await db`UPDATE cards SET is_completed = true WHERE id IN (${cardId1}, ${cardId2})`
})

afterAll(async () => {
  await db`DELETE FROM users WHERE email = 'releases@example.com'`
})

describe('POST /api/boards/:boardId/releases', () => {
  test('should create release with items', async () => {
    const res = await app.request(`/api/boards/${boardId}/releases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        version: '1.0.0',
        title: 'Initial Release',
        items: [
          { card_id: cardId1, category: 'feature', summary: 'Board management' },
          { card_id: cardId2, category: 'feature', summary: 'Card drag and drop' },
        ],
      }),
    })
    if (res.status !== 201) console.error('ERR', await res.text()); expect(res.status).toBe(201)
    const { data } = await res.json()
    expect(data.version).toBe('1.0.0')
    expect(data.status).toBe('draft')
    expect(data.body).toContain('# v1.0.0')
    expect(data.items.length).toBe(2)
  })

  test('should return 400 for invalid version format', async () => {
    const res = await app.request(`/api/boards/${boardId}/releases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        version: 'invalid',
        title: 'Bad Release',
        items: [{ card_id: cardId1, category: 'feature', summary: 'Summary' }],
      }),
    })
    expect(res.status).toBe(400)
  })

  test('should return 409 for duplicate version', async () => {
    const res = await app.request(`/api/boards/${boardId}/releases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        version: '1.0.0',
        title: 'Duplicate',
        items: [{ card_id: cardId1, category: 'feature', summary: 'Summary' }],
      }),
    })
    expect(res.status).toBe(409)
  })
})

describe('POST /api/boards/:boardId/releases/generate', () => {
  test('should generate release from completed cards', async () => {
    const res = await app.request(`/api/boards/${boardId}/releases/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        version: '1.1.0',
        title: 'Auto-generated Release',
        from_date: '2020-01-01T00:00:00.000Z',
        to_date: '2030-01-31T23:59:59.000Z',
      }),
    })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    expect(data.status).toBe('draft')
    expect(data.body).toContain('# v1.1.0')
  })
})

describe('PUT /api/boards/:boardId/releases/:id/publish', () => {
  let releaseId: number

  beforeAll(async () => {
    const [release] = await db`SELECT id FROM releases WHERE board_id = ${boardId} LIMIT 1`
    releaseId = release.id
  })

  test('should publish release', async () => {
    const res = await app.request(`/api/boards/${boardId}/releases/${releaseId}/publish`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${testToken}` },
    })
    if (res.status !== 200) console.error('ERR', await res.text()); if (res.status !== 200) console.error('ERR', await res.text()); expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.status).toBe('published')
    expect(data.published_at).toBeDefined()
  })
})

describe('GET /api/changelog/:boardId (public)', () => {
  test('should return published releases without auth', async () => {
    const res = await app.request(`/api/changelog/${boardId}`)
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.board).toBeDefined()
    expect(data.releases).toBeDefined()
    expect(Array.isArray(data.releases)).toBe(true)
    // Only published releases
    if (data.releases.length > 0) {
      expect(data.releases[0].body_html).toBeDefined()
    }
  })

  test('should not include draft releases', async () => {
    const res = await app.request(`/api/changelog/${boardId}`)
    expect(res.status).toBe(200)
    const { data } = await res.json()
    const drafts = data.releases.filter((r: any) => r.status === 'draft')
    expect(drafts.length).toBe(0)
  })
})

describe('GET /api/boards/:boardId/releases', () => {
  test('should return all releases (draft + published)', async () => {
    const res = await app.request(`/api/boards/${boardId}/releases`, {
      headers: { Authorization: `Bearer ${testToken}` },
    })
    if (res.status !== 200) console.error('ERR', await res.text()); expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })
})

describe('DELETE /api/boards/:boardId/releases/:id', () => {
  let releaseId: number

  beforeAll(async () => {
    const [release] = await db`SELECT id FROM releases WHERE board_id = ${boardId} LIMIT 1`
    releaseId = release.id
  })

  test('should delete release', async () => {
    const res = await app.request(`/api/boards/${boardId}/releases/${releaseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testToken}` },
    })
    if (res.status !== 200) console.error('ERR', await res.text()); expect(res.status).toBe(200)
    
    // Check if it's really deleted
    const check = await app.request(`/api/boards/${boardId}/releases/${releaseId}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    })
    expect(check.status).toBe(404)
  })
})
