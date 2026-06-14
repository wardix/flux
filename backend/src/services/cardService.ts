import { db } from '../db'

export async function create(data: {
  list_id: number
  title: string
  description?: string
  description_json?: any
  position?: number
  start_date?: string
  due_date?: string
  assignee_id?: number
  story_points?: number
  is_recurring?: boolean
}) {
  if (data.start_date && data.due_date) {
    if (new Date(data.start_date) > new Date(data.due_date)) {
      throw new Error('start_date must be before or equal to due_date')
    }
  }
  let position = data.position
  if (position === undefined) {
    const maxPosition =
      await db`SELECT MAX(position) as max FROM cards WHERE list_id = ${data.list_id}`
    position = maxPosition[0].max !== null ? Number(maxPosition[0].max) + 1 : 0
  }

  let description_text = data.description || null
  if (data.description_json && !data.description) {
    description_text = extractTextFromTiptap(data.description_json)
  }

  const result = await db`
    INSERT INTO cards (list_id, title, description, description_json, position, start_date, due_date, assignee_id, story_points, is_recurring)
    VALUES (${data.list_id}, ${data.title}, ${description_text}, ${data.description_json || null}, ${position}, ${data.start_date || null}, ${data.due_date || null}, ${data.assignee_id || null}, ${data.story_points || null}, ${data.is_recurring || false})
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
    description_json?: any | null
    position?: number
    start_date?: string | null
    due_date?: string | null
    assignee_id?: number | null
    parent_card_id?: number | null
    story_points?: number | null
    cover_color?: string | null
    cover_image_url?: string | null
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
  const start_date = data.start_date !== undefined ? data.start_date : row.start_date
  const due_date = data.due_date !== undefined ? data.due_date : row.due_date

  if (start_date && due_date) {
    if (new Date(start_date) > new Date(due_date)) {
      throw new Error('start_date must be before or equal to due_date')
    }
  }
  const assignee_id = data.assignee_id !== undefined ? data.assignee_id : row.assignee_id
  const parent_card_id =
    data.parent_card_id !== undefined ? data.parent_card_id : row.parent_card_id
  const story_points = data.story_points !== undefined ? data.story_points : row.story_points
  const cover_color = data.cover_color !== undefined ? data.cover_color : row.cover_color
  const cover_image_url = data.cover_image_url !== undefined ? data.cover_image_url : row.cover_image_url
  const archived_at = data.archived_at !== undefined ? data.archived_at : row.archived_at
  const deleted_at = data.deleted_at !== undefined ? data.deleted_at : row.deleted_at
  const is_recurring = data.is_recurring !== undefined ? data.is_recurring : row.is_recurring

  let final_description = description
  const description_json = data.description_json !== undefined ? data.description_json : row.description_json

  if (data.description_json !== undefined) {
    if (data.description_json) {
      final_description = extractTextFromTiptap(data.description_json)
    } else {
      final_description = null
    }
  }

  const result = await db`
    UPDATE cards
    SET
      list_id = ${list_id},
      title = ${title},
      description = ${final_description},
      description_json = ${description_json},
      position = ${position},
      start_date = ${start_date},
      due_date = ${due_date},
      assignee_id = ${assignee_id},
      parent_card_id = ${parent_card_id},
      story_points = ${story_points},
      cover_color = ${cover_color},
      cover_image_url = ${cover_image_url},
      is_recurring = ${is_recurring},
      archived_at = ${archived_at},
      deleted_at = ${deleted_at},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `

  if (result.length > 0) {
    const { onCardUpdated } = await import('./mirrorSyncService')
    await onCardUpdated(id, data)
  }

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

export function extractTextFromTiptap(doc: any): string {
  if (!doc || !doc.content) return ''
  let text = ''
  for (const node of doc.content) {
    if (node.type === 'text') {
      text += node.text || ''
    } else if (node.content) {
      text += extractTextFromTiptap(node) + '\n'
    } else if (node.type === 'hardBreak') {
      text += '\n'
    } else if (node.type === 'image' && node.attrs && node.attrs.alt) {
      text += `[Image: ${node.attrs.alt}] `
    } else {
      // Just add a space for block elements without content if needed, but \n is better handled recursively
    }
  }
  // clean up extra newlines
  return text.trim().replace(/\n{3,}/g, '\n\n')
}

export async function remove(id: number) {
  const result = await db`DELETE FROM cards WHERE id = ${id} RETURNING *`
  return result[0] || null
}
