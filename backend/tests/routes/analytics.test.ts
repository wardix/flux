import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { app } from '../../src/index'
import { db } from '../../src/db'

let testToken = ''
let boardId: number

beforeAll(async () => {
  await db`DELETE FROM users WHERE email = 'analytics@example.com'`
  // Create test user
  const userRes = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'analytics@example.com', password: 'password123', name: 'Analytics User' })
  })
  
  const loginRes = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'analytics@example.com', password: 'password123' })
  })
  const loginData = await loginRes.json()
  testToken = loginData.data.token;

  // Create workspace
  const wsRes = await app.request('/api/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
    body: JSON.stringify({ name: 'Analytics Workspace' })
  })
  const ws = await wsRes.json()

  // Create board
  const boardRes = await app.request('/api/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
    body: JSON.stringify({ title: 'Analytics Board', workspace_id: ws.data.id })
  })
  const board = await boardRes.json()
  boardId = board.data.id

  // Setup lists and cards
  const listRes = await app.request('/api/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
    body: JSON.stringify({ title: 'To Do', position: 1, board_id: boardId })
  })
  if (listRes.status !== 200 && listRes.status !== 201) console.error('LIST ERROR', listRes.status, await listRes.text()); const list = await listRes.json()

  // Create card
  await app.request('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
    body: JSON.stringify({ title: 'Task 1', list_id: list.data.id, position: 1, board_id: boardId })
  })
})

afterAll(async () => {
  await db`DELETE FROM users WHERE email = 'analytics@example.com'`
})

describe('Analytics API', () => {
  describe('GET /api/analytics/cards-by-status', () => {
    test('should return card counts grouped by status', async () => {
      const res = await app.request(`/api/analytics/cards-by-status?board_id=${boardId}&period=month`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toHaveProperty('status')
      expect(data[0]).toHaveProperty('count')
    })

    test('should return 400 without board_id', async () => {
      const res = await app.request('/api/analytics/cards-by-status', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(400)
    })

    test('should return 401 without auth', async () => {
      const res = await app.request(`/api/analytics/cards-by-status?board_id=${boardId}`)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/analytics/cards-by-member', () => {
    test('should return card counts grouped by member', async () => {
      const res = await app.request(`/api/analytics/cards-by-member?board_id=${boardId}&period=month`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('name')
        expect(data[0]).toHaveProperty('total')
        expect(data[0]).toHaveProperty('completed')
      }
    })
  })

  describe('GET /api/analytics/completion-rate', () => {
    test('should return daily completion rate data', async () => {
      const res = await app.request(`/api/analytics/completion-rate?board_id=${boardId}&period=month`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('date')
        expect(data[0]).toHaveProperty('rate')
      }
    })
  })

  describe('GET /api/analytics/velocity', () => {
    test('should return velocity data per period', async () => {
      const res = await app.request(`/api/analytics/velocity?board_id=${boardId}&period=month`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('period')
        expect(data[0]).toHaveProperty('completed')
        expect(data[0]).toHaveProperty('added')
      }
    })
  })

  describe('GET /api/analytics/summary', () => {
    test('should return summary metrics', async () => {
      const res = await app.request(`/api/analytics/summary?board_id=${boardId}&period=month`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data).toHaveProperty('total_cards')
      expect(data).toHaveProperty('completed_cards')
      expect(data).toHaveProperty('overdue_cards')
      expect(data).toHaveProperty('avg_completion_days')
      expect(data).toHaveProperty('completion_percentage')
      expect(typeof data.total_cards).toBe('number')
    })
  })
  describe('GET /api/analytics/workload', () => {
    test('should return workload data per member', async () => {
      const res = await app.request(`/api/analytics/workload?board_id=${boardId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('name')
        expect(data[0]).toHaveProperty('active_cards')
        expect(data[0]).toHaveProperty('capacity_level')
        expect(['underload', 'optimal', 'overload']).toContain(data[0].capacity_level)
      }
    })

    test('should return 400 without board_id', async () => {
      const res = await app.request('/api/analytics/workload', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/analytics/workload/:userId/cards', () => {
    test('should return cards assigned to specific member', async () => {
      // Just fetch for a dummy user ID or from the setup
      const res = await app.request(`/api/analytics/workload/1/cards?board_id=${boardId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })
})
