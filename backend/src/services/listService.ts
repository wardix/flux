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

export async function update(id: number, data: { title?: string; position?: number }) {
  const current = await db`SELECT * FROM lists WHERE id = ${id}`
  if (current.length === 0) return null

  const title = data.title !== undefined ? data.title : current[0].title
  const position = data.position !== undefined ? data.position : current[0].position

  const result = await db`
    UPDATE lists
    SET title = ${title}, position = ${position}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] || null
}

export async function remove(id: number) {
  const result = await db`DELETE FROM lists WHERE id = ${id} RETURNING *`
  return result[0] || null
}
