import { randomBytes } from 'node:crypto'
import { db } from '../db'

export interface PAT {
  id: number
  user_id: number
  name: string
  token: string
  created_at: Date
}

export async function createPAT(userId: number, name: string): Promise<PAT> {
  const token = 'flux_pat_' + randomBytes(24).toString('hex')
  const [pat] = await db`
    INSERT INTO personal_access_tokens (user_id, name, token)
    VALUES (${userId}, ${name}, ${token})
    RETURNING *
  `
  return pat as unknown as PAT
}

export async function listPATs(userId: number): Promise<PAT[]> {
  const pats = await db`
    SELECT id, user_id, name, token, created_at FROM personal_access_tokens
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
  return pats as unknown as PAT[]
}

export async function deletePAT(userId: number, id: number): Promise<boolean> {
  const res = await db`
    DELETE FROM personal_access_tokens
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `
  return res.length > 0
}

export async function validatePAT(token: string): Promise<number | null> {
  const [pat] = await db`
    SELECT user_id FROM personal_access_tokens
    WHERE token = ${token}
  `
  return pat ? Number(pat.user_id) : null
}
