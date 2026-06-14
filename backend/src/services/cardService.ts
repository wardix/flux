import { db } from '../db'

export async function create(data: {
  list_id: number
  title: string
  description?: string
  position?: number
  due_date?: string
  assignee_id?: number
  story_points?: number
  is_recurring?: boolean
}) {
  let position = data.position
  if (position === undefined) {
    const maxPosition =
      await db`SELECT MAX(position) as max FROM cards WHERE list_id = ${data.list_id}`
    position = maxPosition[0].max !== null ? Number(maxPosition[0].max) + 1 : 0
  }

  const result = await db`
    INSERT INTO cards (list_id, title, description, position, due_date, assignee_id, story_points, is_recurring)
    VALUES (${data.list_id}, ${data.title}, ${data.description || null}, ${position}, ${data.due_date || null}, ${data.assignee_id || null}, ${data.story_points || null}, ${data.is_recurring || false})
    RETURNING *
  `
  return result[0]
}

export async function getById(id: number) {
  const result = await db`
    SELECT c.*,
      u.email as assignee_email,
      u.avatar_url as assignee_avatar,
      COALESCE((
        SELECT json_build_object(
          'total', COUNT(*)::integer,
          'completed', COUNT(CASE WHEN is_completed = TRUE THEN 1 END)::integer
        )
        FROM cards sub
        WHERE sub.parent_card_id = c.id AND sub.deleted_at IS NULL
      ), json_build_object('total', 0, 'completed', 0)) as subtask_count,
      COALESCE((
        SELECT json_build_object(
          'total', COUNT(*)::integer,
          'completed', COUNT(CASE WHEN is_completed = TRUE THEN 1 END)::integer
        )
        FROM checklist_items ci
        JOIN checklists ch ON ci.checklist_id = ch.id
        WHERE ch.card_id = c.id
      ), json_build_object('total', 0, 'completed', 0)) as checklist_count,
      (
        SELECT file_path FROM attachments
        WHERE card_id = c.id AND is_cover = TRUE
        LIMIT 1
      ) as cover_file_path
    FROM cards c
    LEFT JOIN users u ON c.assignee_id = u.id
    WHERE c.id = ${id} AND c.deleted_at IS NULL
  `
  return result[0] || null
}

export async function update(
  id: number,
  data: {
    list_id?: number
    title?: string
    description?: string | null
    position?: number
    due_date?: string | null
    assignee_id?: number | null
    parent_card_id?: number | null
    story_points?: number | null
    archived_at?: string | null
    deleted_at?: string | null
    is_recurring?: boolean
  },

) {
  const current = await db`SELECT * FROM cards WHERE id = ${id}`
  if (current.length === 0) return null

  const row = current[0]
  const list_id = data.list_id !== undefined ? data.list_id : row.list_id
  const title = data.title !== undefined ? data.title : row.title
  const description = data.description !== undefined ? data.description : row.description
  const position = data.position !== undefined ? data.position : row.position
  const due_date = data.due_date !== undefined ? data.due_date : row.due_date
  const assignee_id = data.assignee_id !== undefined ? data.assignee_id : row.assignee_id
  const parent_card_id =
    data.parent_card_id !== undefined ? data.parent_card_id : row.parent_card_id
  const story_points = data.story_points !== undefined ? data.story_points : row.story_points
  const archived_at = data.archived_at !== undefined ? data.archived_at : row.archived_at
  const deleted_at = data.deleted_at !== undefined ? data.deleted_at : row.deleted_at
  const is_recurring = data.is_recurring !== undefined ? data.is_recurring : row.is_recurring


  const result = await db`
    UPDATE cards
    SET
      list_id = ${list_id},
      title = ${title},
      description = ${description},
      position = ${position},
      due_date = ${due_date},
      assignee_id = ${assignee_id},
      parent_card_id = ${parent_card_id},
      story_points = ${story_points},
      is_recurring = ${is_recurring},
      archived_at = ${archived_at},
      deleted_at = ${deleted_at},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] || null
}

export async function updatePositions(cards: { id: number; list_id: number; position: number }[]) {
  for (const card of cards) {
    await db`
      UPDATE cards
      SET list_id = ${card.list_id}, position = ${card.position}, updated_at = NOW()
      WHERE id = ${card.id}
    `
  }
}

export async function remove(id: number) {
  const result = await db`DELETE FROM cards WHERE id = ${id} RETURNING *`
  return result[0] || null
}
