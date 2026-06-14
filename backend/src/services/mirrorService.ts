import { db } from '../db'
import { onCardUpdated } from './mirrorSyncService'

export async function createMirror(
  sourceCardId: number,
  targetBoardId: number,
  targetListId: number,
  position: number = 0,
) {
  // Check if target list is the same as source card list
  const sourceCard =
    await db`SELECT list_id, title, description, due_date, assignee_id, story_points FROM cards WHERE id = ${sourceCardId}`
  if (sourceCard.length === 0) {
    throw new Error('NOT_FOUND')
  }

  if (sourceCard[0].list_id === targetListId) {
    throw new Error('SAME_LIST')
  }

  // Check if mirror already exists for this source card on the target list
  const existing =
    await db`SELECT id FROM card_mirrors WHERE source_card_id = ${sourceCardId} AND mirror_list_id = ${targetListId}`
  if (existing.length > 0) {
    throw new Error('ALREADY_EXISTS')
  }

  // Create a mirror card instance in the cards table
  const newCardResult = await db`
    INSERT INTO cards (list_id, title, description, position, due_date, assignee_id, story_points)
    VALUES (${targetListId}, ${sourceCard[0].title}, ${sourceCard[0].description}, ${position}, ${sourceCard[0].due_date}, ${sourceCard[0].assignee_id}, ${sourceCard[0].story_points})
    RETURNING id
  `
  const mirrorCardId = newCardResult[0].id

  // Create mapping entry in card_mirrors
  const mirrorResult = await db`
    INSERT INTO card_mirrors (source_card_id, mirror_board_id, mirror_list_id, mirror_card_id)
    VALUES (${sourceCardId}, ${targetBoardId}, ${targetListId}, ${mirrorCardId})
    RETURNING *
  `

  // Sync related data like labels, checklists, and comments
  await syncAssociations(sourceCardId, mirrorCardId)

  return mirrorResult[0]
}

export async function getMirrors(cardId: number) {
  return await db`
    SELECT cm.*, b.title as mirror_board_title, l.title as mirror_list_title
    FROM card_mirrors cm
    JOIN boards b ON cm.mirror_board_id = b.id
    JOIN lists l ON cm.mirror_list_id = l.id
    WHERE cm.source_card_id = ${cardId} OR cm.mirror_card_id = ${cardId}
  `
}

export async function deleteMirror(cardId: number, mirrorId: number) {
  // Locate mirror mapping
  const mirror = await db`SELECT * FROM card_mirrors WHERE id = ${mirrorId}`
  if (mirror.length === 0) {
    return null
  }

  const mirrorCardId = mirror[0].mirror_card_id

  // Delete mapping first
  const deleteResult = await db`DELETE FROM card_mirrors WHERE id = ${mirrorId} RETURNING *`
  // Now delete the mirror card instance
  await db`DELETE FROM cards WHERE id = ${mirrorCardId}`
  return deleteResult[0] || null
}

async function syncAssociations(sourceId: number, mirrorId: number) {
  // Sync labels
  const labels = await db`SELECT label_id FROM card_labels WHERE card_id = ${sourceId}`
  for (const lbl of labels) {
    await db`INSERT INTO card_labels (card_id, label_id) VALUES (${mirrorId}, ${lbl.label_id}) ON CONFLICT DO NOTHING`
  }

  // Sync checklists
  const checklists =
    await db`SELECT id, title, position FROM checklists WHERE card_id = ${sourceId}`
  for (const ch of checklists) {
    const newCh = await db`
      INSERT INTO checklists (card_id, title, position)
      VALUES (${mirrorId}, ${ch.title}, ${ch.position})
      RETURNING id
    `
    const items =
      await db`SELECT title, is_completed, position FROM checklist_items WHERE checklist_id = ${ch.id}`
    for (const item of items) {
      await db`
        INSERT INTO checklist_items (checklist_id, title, is_completed, position)
        VALUES (${newCh[0].id}, ${item.title}, ${item.is_completed}, ${item.position})
      `
    }
  }

  // Sync comments
  const comments =
    await db`SELECT user_id, content, created_at FROM comments WHERE card_id = ${sourceId}`
  for (const c of comments) {
    await db`
      INSERT INTO comments (card_id, user_id, content, created_at)
      VALUES (${mirrorId}, ${c.user_id}, ${c.content}, ${c.created_at})
    `
  }
}
