import { db } from '../db'

export async function getUsers(page: number = 1, perPage: number = 10, search?: string) {
  const offset = (page - 1) * perPage

  let countQuery
  let selectQuery

  if (search) {
    const searchPattern = `%${search}%`
    countQuery = await db`
      SELECT COUNT(*)::integer as count FROM users 
      WHERE email ILIKE ${searchPattern}
    `
    selectQuery = await db`
      SELECT id, email, avatar_url, is_super_admin, is_suspended, created_at, updated_at
      FROM users
      WHERE email ILIKE ${searchPattern}
      ORDER BY id ASC
      LIMIT ${perPage} OFFSET ${offset}
    `
  } else {
    countQuery = await db`
      SELECT COUNT(*)::integer as count FROM users
    `
    selectQuery = await db`
      SELECT id, email, avatar_url, is_super_admin, is_suspended, created_at, updated_at
      FROM users
      ORDER BY id ASC
      LIMIT ${perPage} OFFSET ${offset}
    `
  }

  const total = countQuery[0]?.count || 0

  return {
    data: selectQuery,
    meta: {
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    },
  }
}

export async function updateUser(id: number, data: { is_suspended?: boolean; is_super_admin?: boolean }) {
  const [existing] = await db`SELECT id FROM users WHERE id = ${id}`
  if (!existing) return null

  const updates: Record<string, any> = {}
  if (data.is_suspended !== undefined) updates.is_suspended = data.is_suspended
  if (data.is_super_admin !== undefined) updates.is_super_admin = data.is_super_admin

  if (Object.keys(updates).length === 0) {
    const [user] = await db`
      SELECT id, email, avatar_url, is_super_admin, is_suspended, created_at, updated_at
      FROM users WHERE id = ${id}
    `
    return user
  }

  const [user] = await db`
    UPDATE users
    SET ${db(updates)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, email, avatar_url, is_super_admin, is_suspended, created_at, updated_at
  `
  return user
}
