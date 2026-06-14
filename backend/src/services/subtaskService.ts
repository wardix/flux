import { db } from '../db'

export async function getSubtasks(parentCardId: number) {
  const data = await db`
    SELECT * FROM cards
    WHERE parent_card_id = ${parentCardId} AND deleted_at IS NULL
    ORDER BY position ASC, id ASC
  `
  const total = data.length
  const completed = data.filter((c) => c.is_completed).length
  return { data, meta: { total, completed } }
}

export async function validateNestingDepth(cardId: number): Promise<boolean> {
  const cards = await db`SELECT parent_card_id FROM cards WHERE id = ${cardId}`
  if (cards.length === 0) return false
  return cards[0].parent_card_id === null
}

export async function createSubtask(
  parentCardId: number,
  data: { title: string; description?: string; due_date?: string },
) {
  const parents = await db`SELECT * FROM cards WHERE id = ${parentCardId} AND deleted_at IS NULL`
  if (parents.length === 0) {
    throw new Error('NOT_FOUND')
  }
  const parent = parents[0]
  if (parent.parent_card_id !== null) {
    throw new Error('NESTING_DEPTH_EXCEEDED')
  }

  const maxPosition = await db`
    SELECT MAX(position) as max FROM cards WHERE parent_card_id = ${parentCardId}
  `
  const position = maxPosition[0].max !== null ? Number(maxPosition[0].max) + 1 : 0

  const result = await db`
    INSERT INTO cards (list_id, title, description, position, due_date, parent_card_id, is_completed)
    VALUES (${parent.list_id}, ${data.title}, ${data.description || null}, ${position}, ${data.due_date || null}, ${parentCardId}, FALSE)
    RETURNING *
  `
  return result[0]
}

export async function updateSubtask(
  parentCardId: number,
  subtaskId: number,
  data: {
    title?: string
    description?: string | null
    due_date?: string | null
    is_completed?: boolean
  },
) {
  const current = await db`
    SELECT * FROM cards
    WHERE id = ${subtaskId} AND parent_card_id = ${parentCardId} AND deleted_at IS NULL
  `
  if (current.length === 0) return null

  const row = current[0]
  const title = data.title !== undefined ? data.title : row.title
  const description = data.description !== undefined ? data.description : row.description
  const due_date = data.due_date !== undefined ? data.due_date : row.due_date
  const is_completed = data.is_completed !== undefined ? data.is_completed : row.is_completed
  let list_id = row.list_id

  if (data.is_completed !== undefined) {
    if (data.is_completed) {
      const lastList = await db`
        SELECT id FROM lists 
        WHERE board_id = (
          SELECT board_id FROM lists WHERE id = ${row.list_id}
        ) AND archived_at IS NULL AND deleted_at IS NULL
        ORDER BY position DESC, id DESC LIMIT 1
      `
      if (lastList.length > 0) {
        list_id = lastList[0].id
      }
    } else {
      const parentCard = await db`SELECT list_id FROM cards WHERE id = ${parentCardId}`
      if (parentCard.length > 0) {
        list_id = parentCard[0].list_id
      }
    }
  }

  const result = await db`
    UPDATE cards
    SET
      title = ${title},
      description = ${description},
      due_date = ${due_date},
      is_completed = ${is_completed},
      list_id = ${list_id},
      updated_at = NOW()
    WHERE id = ${subtaskId} AND parent_card_id = ${parentCardId}
    RETURNING *
  `
  return result[0] || null
}

export async function removeSubtask(parentCardId: number, subtaskId: number) {
  const result = await db`
    DELETE FROM cards
    WHERE id = ${subtaskId} AND parent_card_id = ${parentCardId}
    RETURNING *
  `
  return result[0] || null
}
