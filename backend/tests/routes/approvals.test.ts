import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { app } from '../../src/index'
import { db } from '../../src/db/index'
import { sign } from 'hono/jwt'

describe('Approval Workflow API', () => {
  let adminId: number
  let memberId: number
  let reviewer1Id: number
  let adminToken: string
  let memberToken: string
  let reviewer1Token: string

  let workspaceId: number
  let boardId: number
  let todoListId: number
  let reviewListId: number
  let doneListId: number

  let ruleId: number
  let cardId: number
  let otherCardId: number
  let unapprovedCardId: number
  let approvedCardId: number

  beforeAll(async () => {
    // Users
    const [u1] = await db`INSERT INTO users (email, password_hash) VALUES ('app_admin@test.com', 'hash') RETURNING id`
    const [u2] = await db`INSERT INTO users (email, password_hash) VALUES ('app_member@test.com', 'hash') RETURNING id`
    const [u3] = await db`INSERT INTO users (email, password_hash) VALUES ('app_reviewer1@test.com', 'hash') RETURNING id`
    adminId = u1.id; memberId = u2.id; reviewer1Id = u3.id;

    adminToken = await sign({ sub: adminId, email: 'app_admin@test.com', exp: Math.floor(Date.now()/1000) + 3600 }, 'your-jwt-secret-here-change-in-production', 'HS256')
    memberToken = await sign({ sub: memberId, email: 'app_member@test.com', exp: Math.floor(Date.now()/1000) + 3600 }, 'your-jwt-secret-here-change-in-production', 'HS256')
    reviewer1Token = await sign({ sub: reviewer1Id, email: 'app_reviewer1@test.com', exp: Math.floor(Date.now()/1000) + 3600 }, 'your-jwt-secret-here-change-in-production', 'HS256')

    // Workspace & Board
    const [w] = await db`INSERT INTO workspaces (name, owner_id) VALUES ('App WS', ${adminId}) RETURNING id`
    workspaceId = w.id
    await db`INSERT INTO workspace_members (user_id, workspace_id, role) VALUES (${adminId}, ${workspaceId}, 'admin')`
    await db`INSERT INTO workspace_members (user_id, workspace_id, role) VALUES (${memberId}, ${workspaceId}, 'member')`
    await db`INSERT INTO workspace_members (user_id, workspace_id, role) VALUES (${reviewer1Id}, ${workspaceId}, 'member')`

    const [b] = await db`INSERT INTO boards (title, workspace_id, created_by) VALUES ('App Board', ${workspaceId}, ${adminId}) RETURNING id`
    boardId = b.id

    // Lists
    const [l1] = await db`INSERT INTO lists (title, board_id) VALUES ('To Do', ${boardId}) RETURNING id`
    const [l2] = await db`INSERT INTO lists (title, board_id) VALUES ('Review', ${boardId}) RETURNING id`
    const [l3] = await db`INSERT INTO lists (title, board_id) VALUES ('Done', ${boardId}) RETURNING id`
    todoListId = l1.id; reviewListId = l2.id; doneListId = l3.id;

    await db`DELETE FROM approval_rules`
    
    // Cards
    const [c1] = await db`INSERT INTO cards (title, list_id) VALUES ('C1', ${reviewListId}) RETURNING id`
    const [c2] = await db`INSERT INTO cards (title, list_id) VALUES ('C2', ${reviewListId}) RETURNING id`
    const [c3] = await db`INSERT INTO cards (title, list_id) VALUES ('C3 unapproved', ${reviewListId}) RETURNING id`
    const [c4] = await db`INSERT INTO cards (title, list_id) VALUES ('C4 approved', ${reviewListId}) RETURNING id`
    cardId = c1.id; otherCardId = c2.id; unapprovedCardId = c3.id; approvedCardId = c4.id;

    // Rule for C4 test (done in setup)
    const [r] = await db`INSERT INTO approval_rules (board_id, from_list_id, to_list_id, min_approvals) VALUES (${boardId}, ${reviewListId}, ${doneListId}, 2) RETURNING id`
    // votes for C4
    await db`INSERT INTO approval_votes (card_id, rule_id, user_id, status) VALUES (${approvedCardId}, ${r.id}, ${adminId}, 'approved')`
    await db`INSERT INTO approval_votes (card_id, rule_id, user_id, status) VALUES (${approvedCardId}, ${r.id}, ${reviewer1Id}, 'approved')`
  })

  afterAll(async () => {
    await db`DELETE FROM workspaces WHERE id = ${workspaceId}`
    await db`DELETE FROM users WHERE id IN (${adminId}, ${memberId}, ${reviewer1Id})`
  })

  describe('POST /api/boards/:boardId/approval-rules', () => {
    test('should create approval rule (admin)', async () => {
      const res = await app.request(`/api/boards/${boardId}/approval-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          from_list_id: todoListId,
          to_list_id: reviewListId,
          min_approvals: 2,
        }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      ruleId = data.id
      expect(data.min_approvals).toBe(2)
    })

    test('should return 403 for non-admin', async () => {
      const res = await app.request(`/api/boards/${boardId}/approval-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify({
          from_list_id: todoListId,
          to_list_id: reviewListId,
          min_approvals: 1,
        }),
      })
      expect(res.status).toBe(403)
    })

    test('should return 409 for duplicate rule', async () => {
      const res = await app.request(`/api/boards/${boardId}/approval-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          from_list_id: reviewListId,
          to_list_id: doneListId,
          min_approvals: 3,
        }),
      })
      expect(res.status).toBe(409)
    })
  })

  describe('GET /api/boards/:boardId/approval-rules', () => {
    test('should return all approval rules for board', async () => {
      const res = await app.request(`/api/boards/${boardId}/approval-rules`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('POST /api/cards/:cardId/approval/request', () => {
    test('should create approval request for card', async () => {
      const res = await app.request(`/api/cards/${cardId}/approval/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify({ rule_id: ruleId }),
      })
      if (res.status !== 201) console.log(await res.text())
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.status).toBe('pending')
    })
  })

  describe('POST /api/cards/:cardId/approval/vote', () => {
    test('should approve card', async () => {
      const res = await app.request(`/api/cards/${cardId}/approval/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${reviewer1Token}` },
        body: JSON.stringify({ rule_id: ruleId, status: 'approved', comment: 'LGTM' }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.status).toBe('approved')
    })

    test('should return 409 for duplicate vote', async () => {
      const res = await app.request(`/api/cards/${cardId}/approval/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${reviewer1Token}` },
        body: JSON.stringify({ rule_id: ruleId, status: 'approved' }),
      })
      expect(res.status).toBe(409)
    })

    test('should reject card', async () => {
      const res = await app.request(`/api/cards/${otherCardId}/approval/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${reviewer1Token}` },
        body: JSON.stringify({ rule_id: ruleId, status: 'rejected', comment: 'Needs more tests' }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.status).toBe('rejected')
    })
  })

  describe('GET /api/cards/:cardId/approval/status', () => {
    test('should return approval status with votes', async () => {
      const res = await app.request(`/api/cards/${cardId}/approval/status`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.rules).toBeDefined()
      expect(Array.isArray(data.rules)).toBe(true)
    })
  })

  describe('Card move with approval', () => {
    test('should block card move without sufficient approvals', async () => {
      const res = await app.request(`/api/cards/${unapprovedCardId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify({ list_id: doneListId, position: 0 }),
      })
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toContain('approval')
    })

    test('should allow card move with sufficient approvals', async () => {
      const res = await app.request(`/api/cards/${approvedCardId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify({ list_id: doneListId, position: 0 }),
      })
      expect(res.status).toBe(200)
    })
  })
})
