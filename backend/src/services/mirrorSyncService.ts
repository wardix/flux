import { db } from '../db'

let isSyncing = false

export async function syncMirrors(cardId: number, updates: any) {
  if (isSyncing) return
  isSyncing = true

  try {
    // Find if the updated card is a source or a mirror instance
    const sourceRelation = await db`SELECT * FROM card_mirrors WHERE source_card_id = ${cardId}`
    const mirrorRelation = await db`SELECT * FROM card_mirrors WHERE mirror_card_id = ${cardId}`

    const relatedCardIds: number[] = []

    if (sourceRelation.length > 0) {
      // It is a source card, update all mirrors
      for (const rel of sourceRelation) {
        relatedCardIds.push(rel.mirror_card_id)
      }
    }

    if (mirrorRelation.length > 0) {
      // It is a mirror card, update source card and all sibling mirrors
      const sourceCardId = mirrorRelation[0].source_card_id
      relatedCardIds.push(sourceCardId)

      const siblingMirrors = await db`
        SELECT mirror_card_id FROM card_mirrors 
        WHERE source_card_id = ${sourceCardId} AND mirror_card_id != ${cardId}
      `
      for (const sib of siblingMirrors) {
        relatedCardIds.push(sib.mirror_card_id)
      }
    }

    if (relatedCardIds.length === 0) {
      return
    }

    // Fetch the updated card's current values for the syncable fields
    const currentCard = await db`
      SELECT title, description, due_date, assignee_id, story_points 
      FROM cards WHERE id = ${cardId}
    `
    if (currentCard.length === 0) {
      return
    }

    const { title, description, due_date, assignee_id, story_points } = currentCard[0]

    // Run updates on all related cards
    for (const targetId of relatedCardIds) {
      await db`
        UPDATE cards
        SET
          title = ${title},
          description = ${description},
          due_date = ${due_date},
          assignee_id = ${assignee_id},
          story_points = ${story_points},
          updated_at = NOW()
        WHERE id = ${targetId}
      `
    }
  } catch (err) {
    console.error('Failed to sync mirrors:', err)
  } finally {
    isSyncing = false
  }
}

export async function onCardUpdated(cardId: number, updates: any) {
  await syncMirrors(cardId, updates)
}

function getSyncableFields(updates: any) {
  const syncable = ['title', 'description', 'due_date', 'assignee_id', 'story_points']
  const fields: any = {}
  for (const key of syncable) {
    if (key in updates) {
      fields[key] = updates[key] === undefined ? null : updates[key]
    }
  }
  return fields
}
