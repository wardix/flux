import { db } from '../db'

export async function getByBoardId(boardId: number) {
  return await db`SELECT * FROM labels WHERE board_id = ${boardId} ORDER BY id ASC`
}

export async function create(boardId: number, name: string, color: string) {
  const result = await db`
    INSERT INTO labels (board_id, name, color)
    VALUES (${boardId}, ${name}, ${color})
    RETURNING *
  `
  return result[0]
}

export async function remove(id: number) {
  const result = await db`DELETE FROM labels WHERE id = ${id} RETURNING *`
  return result[0] || null
}

export async function assignToCard(cardId: number, labelId: number) {
  const existing = await db`
    SELECT * FROM card_labels
    WHERE card_id = ${cardId} AND label_id = ${labelId}
  `
  if (existing.length > 0) return existing[0]

  const result = await db`
    INSERT INTO card_labels (card_id, label_id)
    VALUES (${cardId}, ${labelId})
    RETURNING *
  `
  return result[0]
}

export async function unassignFromCard(cardId: number, labelId: number) {
  const result = await db`
    DELETE FROM card_labels
    WHERE card_id = ${cardId} AND label_id = ${labelId}
    RETURNING *
  `
  return result[0] || null
}

export async function getByCardId(cardId: number) {
  return await db`
    SELECT l.* FROM labels l
    JOIN card_labels cl ON l.id = cl.label_id
    WHERE cl.card_id = ${cardId}
  `
}
