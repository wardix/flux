import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { sign } from 'hono/jwt'
import { db } from '../../src/db/index'
import app from '../../src/index'

describe('Branding Routes', () => {
  let adminId: number
  let memberId: number
  let workspaceId: number
  let adminToken: string
  let memberToken: string

  beforeAll(async () => {
    // Create admin user
    const adminRes = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('branding_admin@example.com', 'hashed')
      RETURNING id
    `
    adminId = adminRes[0].id

    // Create member user
    const memberRes = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('branding_member@example.com', 'hashed')
      RETURNING id
    `
    memberId = memberRes[0].id

    // Create workspace
    const workspaceRes = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Branding Workspace', ${adminId})
      RETURNING id
    `
    workspaceId = workspaceRes[0].id

    // Insert workspace member roles
    await db`
      INSERT INTO workspace_members (user_id, workspace_id, role)
      VALUES 
        (${adminId}, ${workspaceId}, 'admin'),
        (${memberId}, ${workspaceId}, 'member')
    `

    // Generate tokens
    adminToken = await sign(
      { sub: adminId, email: 'branding_admin@example.com' },
      'your-jwt-secret-here-change-in-production'
    )
    memberToken = await sign(
      { sub: memberId, email: 'branding_member@example.com' },
      'your-jwt-secret-here-change-in-production'
    )
  })

  afterAll(async () => {
    await db`DELETE FROM users WHERE id IN (${adminId}, ${memberId})`
  })

  describe('GET /api/workspaces/:id/branding', () => {
    test('should return 404 if no branding configured', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/branding`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      )
      expect(res.status).toBe(404)
    })

    test('should return branding config after creation', async () => {
      // Create first
      await db`
        INSERT INTO workspace_branding (workspace_id, app_name, primary_color, secondary_color)
        VALUES (${workspaceId}, 'Flux Pro', '#111111', '#222222')
      `

      const res = await app.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/branding`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.app_name).toBe('Flux Pro')
      expect(body.data.primary_color).toBe('#111111')
    })
  })

  describe('PUT /api/workspaces/:id/branding', () => {
    test('should update branding config', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/branding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            app_name: 'MyCompany PM',
            primary_color: '#2563EB',
          }),
        })
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.app_name).toBe('MyCompany PM')
      expect(body.data.primary_color).toBe('#2563EB')
    })

    test('should return 400 for invalid color format', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/branding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ primary_color: 'not-a-color' }),
        })
      )
      expect(res.status).toBe(400)
    })

    test('should return 403 for non-admin user', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/branding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${memberToken}`,
          },
          body: JSON.stringify({ app_name: 'Hacked' }),
        })
      )
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /api/workspaces/:id/branding', () => {
    test('should reset branding to defaults (delete)', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/branding`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      )
      expect(res.status).toBe(204)

      // Verify it's gone (404)
      const getRes = await app.fetch(
        new Request(`http://localhost/api/workspaces/${workspaceId}/branding`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      )
      expect(getRes.status).toBe(404)
    })
  })
})
