import { db } from '../db'

export async function create(userId: number, name: string) {
  const result = await db`
    INSERT INTO workspaces (name, owner_id)
    VALUES (${name}, ${userId})
    RETURNING *
  `
  const workspace = result[0]

  await db`
    INSERT INTO workspace_members (user_id, workspace_id, role)
    VALUES (${userId}, ${workspace.id}, 'owner')
  `

  return workspace
}

export async function getAllForUser(userId: number) {
  return await db`
    SELECT w.* FROM workspaces w
    JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE wm.user_id = ${userId}
    ORDER BY w.created_at DESC
  `
}

export async function getById(id: number) {
  const result = await db`SELECT * FROM workspaces WHERE id = ${id}`
  return result[0] || null
}

export async function inviteMember(workspaceId: number, email: string, role = 'member') {
  const users = await db`SELECT id FROM users WHERE email = ${email}`
  if (users.length === 0) {
    throw new Error('User with this email does not exist')
  }
  const userId = users[0].id

  const existing = await db`
    SELECT * FROM workspace_members
    WHERE user_id = ${userId} AND workspace_id = ${workspaceId}
  `
  if (existing.length > 0) {
    throw new Error('User is already a member of this workspace')
  }

  const result = await db`
    INSERT INTO workspace_members (user_id, workspace_id, role)
    VALUES (${userId}, ${workspaceId}, ${role})
    RETURNING *
  `
  return result[0]
}

export async function getMembers(workspaceId: number) {
  return await db`
    SELECT u.id, u.email, u.avatar_url, wm.role FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    WHERE wm.workspace_id = ${workspaceId}
  `
}
