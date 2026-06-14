import { db } from '../db'

export async function getChecklists(cardId: number) {
  const checklists = await db`
    SELECT * FROM checklists
    WHERE card_id = ${cardId}
    ORDER BY position ASC, id ASC
  `
  
  if (checklists.length === 0) return []

  const checklistIds = checklists.map((c) => c.id)
  const items = await db`
    SELECT * FROM checklist_items
    WHERE checklist_id IN (${checklistIds})
    ORDER BY position ASC, id ASC
  `

  return checklists.map((c) => {
    return {
      ...c,
      items: items.filter((item) => item.checklist_id === c.id),
    }
  })
}

export async function createChecklist(cardId: number, title: string) {
  const maxPosition = await db`
    SELECT MAX(position) as max FROM checklists WHERE card_id = ${cardId}
  `
  const position = maxPosition[0].max !== null ? Number(maxPosition[0].max) + 1 : 0

  const result = await db`
    INSERT INTO checklists (card_id, title, position)
    VALUES (${cardId}, ${title}, ${position})
    RETURNING *
  `
  return {
    ...result[0],
    items: [],
  }
}

export async function updateChecklist(cardId: number, checklistId: number, title: string) {
  const result = await db`
    UPDATE checklists
    SET title = ${title}, updated_at = NOW()
    WHERE id = ${checklistId} AND card_id = ${cardId}
    RETURNING *
  `
  return result[0] || null
}

export async function deleteChecklist(cardId: number, checklistId: number) {
  const result = await db`
    DELETE FROM checklists
    WHERE id = ${checklistId} AND card_id = ${cardId}
    RETURNING *
  `
  return result[0] || null
}

export async function createChecklistItem(checklistId: number, title: string) {
  const checklists = await db`SELECT id FROM checklists WHERE id = ${checklistId}`
  if (checklists.length === 0) {
    throw new Error('NOT_FOUND')
  }

  const maxPosition = await db`
    SELECT MAX(position) as max FROM checklist_items WHERE checklist_id = ${checklistId}
  `
  const position = maxPosition[0].max !== null ? Number(maxPosition[0].max) + 1 : 0

  const result = await db`
    INSERT INTO checklist_items (checklist_id, title, position, is_completed)
    VALUES (${checklistId}, ${title}, ${position}, FALSE)
    RETURNING *
  `
  return result[0]
}

export async function updateChecklistItem(
  checklistId: number,
  itemId: number,
  data: {
    title?: string
    is_completed?: boolean
    position?: number
  },
) {
  const current = await db`
    SELECT * FROM checklist_items
    WHERE id = ${itemId} AND checklist_id = ${checklistId}
  `
  if (current.length === 0) return null

  const row = current[0]
  const title = data.title !== undefined ? data.title : row.title
  const is_completed = data.is_completed !== undefined ? data.is_completed : row.is_completed
  const position = data.position !== undefined ? data.position : row.position

  const result = await db`
    UPDATE checklist_items
    SET
      title = ${title},
      is_completed = ${is_completed},
      position = ${position},
      updated_at = NOW()
    WHERE id = ${itemId} AND checklist_id = ${checklistId}
    RETURNING *
  `
  return result[0] || null
}

export async function deleteChecklistItem(checklistId: number, itemId: number) {
  const result = await db`
    DELETE FROM checklist_items
    WHERE id = ${itemId} AND checklist_id = ${checklistId}
    RETURNING *
  `
  return result[0] || null
}
