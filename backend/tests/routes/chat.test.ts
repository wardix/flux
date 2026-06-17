import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { app } from '../../src/index'
import { db } from '../../src/db'

let testToken: string
let nonMemberToken: string
let user1Id: number
let user2Id: number
let channelId: number
let messageId: number
let otherUserMessageId: number

describe('Chat API', () => {
  beforeAll(async () => {
    // Clean up
    await db`DELETE FROM users WHERE email LIKE 'chat_test%'`
    
    // Create users
    const u1 = await db`INSERT INTO users (email, password_hash) VALUES ('chat_test1@example.com', 'hash') RETURNING id`
    user1Id = u1[0].id

    const u2 = await db`INSERT INTO users (email, password_hash) VALUES ('chat_test2@example.com', 'hash') RETURNING id`
    user2Id = u2[0].id

    const { sign } = await import('hono/jwt')
    testToken = await sign({ sub: String(user1Id), exp: Math.floor(Date.now() / 1000) + 3600 }, process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production', 'HS256')
    nonMemberToken = await sign({ sub: String(user2Id), exp: Math.floor(Date.now() / 1000) + 3600 }, process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production', 'HS256')
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE email LIKE 'chat_test%'`
  })

  describe('POST /api/chat/channels', () => {
    test('should create group channel', async () => {
      const res = await app.request('/api/chat/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          name: 'General',
          type: 'group',
          member_ids: [user1Id],
        }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.name).toBe('General')
      expect(data.type).toBe('group')
      channelId = data.id
    })

    test('should return 400 without name', async () => {
      const res = await app.request('/api/chat/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ type: 'group', member_ids: [user1Id] }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/chat/channels/direct', () => {
    test('should create DM channel', async () => {
      const res = await app.request('/api/chat/channels/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ user_id: user2Id }),
      })
      expect([200, 201]).toContain(res.status)
      const { data } = await res.json()
      expect(data.type).toBe('direct')
    })

    test('should return existing DM channel if already exists', async () => {
      const res = await app.request('/api/chat/channels/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ user_id: user2Id }),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/chat/channels', () => {
    test('should return all channels for user', async () => {
      const res = await app.request('/api/chat/channels', {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('POST /api/chat/channels/:channelId/messages', () => {
    test('should send message to channel', async () => {
      const res = await app.request(`/api/chat/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ content: 'Hello team!' }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.content).toBe('Hello team!')
      expect(data.channel_id).toBe(channelId)
      messageId = data.id
    })

    test('should parse @mention in message', async () => {
      const res = await app.request(`/api/chat/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ content: `Hey @${user2Id}, check this out` }),
      })
      expect(res.status).toBe(201)
      const { data } = await res.json()
      expect(data.mentions).toBeDefined()
      expect(data.mentions.length).toBeGreaterThanOrEqual(1)
      expect(data.mentions[0]).toBe(user2Id)
    })

    test('should return 400 for empty content', async () => {
      const res = await app.request(`/api/chat/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ content: '' }),
      })
      expect(res.status).toBe(400)
    })

    test('should return 403 for non-member', async () => {
      const res = await app.request(`/api/chat/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nonMemberToken}` },
        body: JSON.stringify({ content: 'Intruder!' }),
      })
      expect(res.status).toBe(403)
    })
    
    test('should allow other user to send message after added', async () => {
      // Direct channel message from user2
      const resDM = await app.request('/api/chat/channels/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nonMemberToken}` },
        body: JSON.stringify({ user_id: user1Id }),
      })
      const dmChannel = await resDM.json()
      
      const res = await app.request(`/api/chat/channels/${dmChannel.data.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nonMemberToken}` },
        body: JSON.stringify({ content: 'Hello user1' }),
      })
      expect(res.status).toBe(201)
      otherUserMessageId = (await res.json()).data.id
    })
  })

  describe('GET /api/chat/channels/:channelId/messages', () => {
    test('should return messages with pagination', async () => {
      const res = await app.request(`/api/chat/channels/${channelId}/messages?limit=10`, {
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(200)
      const { data, meta } = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(typeof meta.has_more).toBe('boolean')
    })
  })

  describe('PUT /api/chat/messages/:messageId', () => {
    test('should edit own message', async () => {
      const res = await app.request(`/api/chat/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ content: 'Updated message' }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.content).toBe('Updated message')
      expect(data.edited_at).toBeDefined()
    })

    test('should return 403 for editing other user message', async () => {
      const res = await app.request(`/api/chat/messages/${otherUserMessageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ content: 'Hacked!' }),
      })
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /api/chat/messages/:messageId', () => {
    test('should soft-delete own message', async () => {
      const res = await app.request(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testToken}` },
      })
      expect(res.status).toBe(204)
    })
  })
})
