import { db } from '../db'

export async function create(data: {
  list_id: number
  title: string
  description?: string
  position?: number
  due_date?: string
  assignee_id?: number
  story_points?: number
}) {
  let position = data.position
  if (position === undefined) {
    const maxPosition =
      await db`SELECT MAX(position) as max FROM cards WHERE list_id = ${data.list_id}`
    position = maxPosition[0].max !== null ? Number(maxPosition[0].max) + 1 : 0
  }

  const result = await db`
    INSERT INTO cards (list_id, title, description, position, due_date, assignee_id, story_points)
    VALUES (${data.list_id}, ${data.title}, ${data.description || null}, ${position}, ${data.due_date || null}, ${data.assignee_id || null}, ${data.story_points || null})
    RETURNING *
  `
  return result[0]
}

export async function update(
  id: number,
  data: {
    list_id?: number
    title?: string
    description?: string
    position?: number
    due_date?: string | null
    assignee_id?: number | null
    parent_card_id?: number | null
    story_points?: number | null
    archived_at?: string | null
  },
) {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  const allowedFields = [
    'list_id',
    'title',
    'description',
    'position',
    'due_date',
    'assignee_id',
    'parent_card_id',
    'story_points',
    'archived_at',
  ]

  for (const field of allowedFields) {
    if (data[field as keyof typeof data] !== undefined) {
      updates.push(`${field} = $${index++}`)
      values.push(data[field as keyof typeof data])
    }
  }

  if (updates.length === 0) {
    const current = await db`SELECT * FROM cards WHERE id = ${id}`
    return current[0] || null
  }

  values.push(id)
  const query = `
    UPDATE cards
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${index}
    RETURNING *
  `
  const result = await db.query(query, values)
  return result[0] || null
}

export async function remove(id: number) {
  const result = await db`DELETE FROM cards WHERE id = ${id} RETURNING *`
  return result[0] || null
}
