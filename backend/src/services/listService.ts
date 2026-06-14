import { db } from '../db'

export async function create(data: { board_id: number; title: string; position?: number }) {
  let position = data.position
  if (position === undefined) {
    const maxPosition =
      await db`SELECT MAX(position) as max FROM lists WHERE board_id = ${data.board_id}`
    position = maxPosition[0].max !== null ? Number(maxPosition[0].max) + 1 : 0
  }

  const result = await db`
    INSERT INTO lists (board_id, title, position)
    VALUES (${data.board_id}, ${data.title}, ${position})
    RETURNING *
  `
  return result[0]
}

export async function update(
  id: number,
  data: {
    title?: string
    position?: number
    archived_at?: string | null
    deleted_at?: string | null
  },
) {
  const current = await db`SELECT * FROM lists WHERE id = ${id}`
  if (current.length === 0) return null

  const row = current[0]
  const title = data.title !== undefined ? data.title : row.title
  const position = data.position !== undefined ? data.position : row.position
  const archived_at = data.archived_at !== undefined ? data.archived_at : row.archived_at
  const deleted_at = data.deleted_at !== undefined ? data.deleted_at : row.deleted_at

  const result = await db`
    UPDATE lists
    SET title = ${title}, position = ${position}, archived_at = ${archived_at}, deleted_at = ${deleted_at}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] || null
}

export async function remove(id: number) {
  const result = await db`DELETE FROM lists WHERE id = ${id} RETURNING *`
  return result[0] || null
}
