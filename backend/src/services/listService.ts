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
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  if (data.title !== undefined) {
    updates.push(`title = $${index++}`)
    values.push(data.title)
  }
  if (data.position !== undefined) {
    updates.push(`position = $${index++}`)
    values.push(data.position)
  }

  if (updates.length === 0) {
    const current = await db`SELECT * FROM lists WHERE id = ${id}`
    return current[0] || null
  }

  values.push(id)
  const query = `
    UPDATE lists
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${index}
    RETURNING *
  `
  const result = await db.query(query, values)
  return result[0] || null
}

export async function remove(id: number) {
  const result = await db`DELETE FROM lists WHERE id = ${id} RETURNING *`
  return result[0] || null
}
