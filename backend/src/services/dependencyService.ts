import { db } from '../db'

export async function getDependencies(cardId: number) {
  const blocking = await db`
    SELECT cd.id, cd.blocking_card_id, cd.blocked_card_id, cd.created_at,
           json_build_object('id', c.id, 'title', c.title, 'list_id', c.list_id, 'is_completed', c.is_completed) as card
    FROM card_dependencies cd
    JOIN cards c ON cd.blocked_card_id = c.id
    WHERE cd.blocking_card_id = ${cardId}
  `

  const blocked_by = await db`
    SELECT cd.id, cd.blocking_card_id, cd.blocked_card_id, cd.created_at,
           json_build_object('id', c.id, 'title', c.title, 'list_id', c.list_id, 'is_completed', c.is_completed) as card
    FROM card_dependencies cd
    JOIN cards c ON cd.blocking_card_id = c.id
    WHERE cd.blocked_card_id = ${cardId}
  `

  return {
    blocking,
    blocked_by,
  }
}

export async function hasCircularDependency(blockingCardId: number, blockedCardId: number): Promise<boolean> {
  // If card A blocks card B, can B block A? 
  // We use CTE to find all descendants of blockedCardId. If blockingCardId is in the descendants, it's circular.
  const result = await db`
    WITH RECURSIVE dependency_tree AS (
      SELECT blocked_card_id
      FROM card_dependencies
      WHERE blocking_card_id = ${blockedCardId}
      
      UNION ALL
      
      SELECT cd.blocked_card_id
      FROM card_dependencies cd
      JOIN dependency_tree dt ON dt.blocked_card_id = cd.blocking_card_id
    )
    SELECT 1 FROM dependency_tree WHERE blocked_card_id = ${blockingCardId} LIMIT 1
  `
  return result.length > 0
}

export async function createDependency(blockingCardId: number, blockedCardId: number) {
  if (blockingCardId === blockedCardId) {
    throw new Error('SELF_DEPENDENCY')
  }

  const circular = await hasCircularDependency(blockingCardId, blockedCardId)
  if (circular) {
    throw new Error('CIRCULAR_DEPENDENCY')
  }

  try {
    const result = await db`
      INSERT INTO card_dependencies (blocking_card_id, blocked_card_id)
      VALUES (${blockingCardId}, ${blockedCardId})
      RETURNING *
    `
    return result[0]
  } catch (error: any) {
    if (error.message?.includes('duplicate key') || error.code === '23505') {
      throw new Error('DUPLICATE_DEPENDENCY')
    }
    throw error
  }
}

export async function removeDependency(depId: number) {
  const result = await db`
    DELETE FROM card_dependencies
    WHERE id = ${depId}
    RETURNING *
  `
  return result[0] || null
}

export async function isCardBlocked(cardId: number): Promise<{ isBlocked: boolean; blockers: any[] }> {
  // Card is blocked if any of its blocking_card_id (cards that it is blocked by) is NOT completed.
  const blockers = await db`
    SELECT c.id, c.title
    FROM card_dependencies cd
    JOIN cards c ON cd.blocking_card_id = c.id
    WHERE cd.blocked_card_id = ${cardId} AND c.is_completed = FALSE
  `
  return {
    isBlocked: blockers.length > 0,
    blockers,
  }
}
