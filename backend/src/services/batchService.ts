import { db } from '../db'
import { getBoardRole } from './boardService'
import * as automationService from './automationService'


export async function executeBatch(
  userId: number,
  cardIds: number[],
  action: 'move' | 'assign' | 'unassign' | 'add_label' | 'remove_label' | 'set_due_date' | 'archive' | 'delete',
  params: Record<string, any>
) {
  if (!cardIds || cardIds.length === 0) {
    const error = new Error('card_ids is required and cannot be empty')
    ;(error as any).status = 400
    throw error
  }

  // Fetch cards and check if they exist using db.unsafe for array parameter compatibility
  const placeholders = cardIds.map((_, i) => `$${i + 1}`).join(',')
  const cards = await db.unsafe(
    `SELECT c.*, l.board_id FROM cards c
     JOIN lists l ON c.list_id = l.id
     WHERE c.id IN (${placeholders}) AND c.deleted_at IS NULL`,
    cardIds
  )

  if (cards.length === 0) {
    const error = new Error("You don't have permission to modify these cards")
    ;(error as any).status = 403
    throw error
  }

  // Ensure all cards belong to the same board
  const boardIds = Array.from(new Set(cards.map((c: any) => Number(c.board_id))))
  if (boardIds.length > 1) {
    const error = new Error('All cards must belong to the same board')
    ;(error as any).status = 400
    throw error
  }

  const boardId = boardIds[0]

  // Check board role / access
  const role = await getBoardRole(boardId, userId)
  if (!role || role === 'observer') {
    const error = new Error("You don't have permission to modify these cards")
    ;(error as any).status = 403
    throw error
  }

  // Perform action-specific validations and operations
  let affectedCount = 0

  switch (action) {
    case 'move': {
      const listId = Number(params.list_id)
      if (!listId) {
        const error = new Error('list_id is required for move action')
        ;(error as any).status = 400
        throw error
      }

      // Check if target list is on the same board
      const targetList = await db`
        SELECT board_id FROM lists WHERE id = ${listId} AND deleted_at IS NULL
      `
      if (targetList.length === 0 || Number(targetList[0].board_id) !== boardId) {
        const error = new Error('All cards must belong to the same board')
        ;(error as any).status = 400
        throw error
      }

      const maxPosRes = await db`
        SELECT COALESCE(MAX(position), 0) as max FROM cards WHERE list_id = ${listId} AND deleted_at IS NULL
      `
      let nextPos = Number(maxPosRes[0].max) + 1

      for (const cardId of cardIds) {
        const cardObj = cards.find((c: any) => Number(c.id) === cardId)
        const fromListId = cardObj ? Number(cardObj.list_id) : null

        const res = await db`
          UPDATE cards
          SET list_id = ${listId}, position = ${nextPos}, updated_at = NOW()
          WHERE id = ${cardId}
          RETURNING id
        `
        if (res.length > 0) {
          affectedCount++
          if (fromListId && fromListId !== listId) {
            await automationService.processAutomations({
              type: 'card_moved',
              boardId,
              cardId,
              data: { to_list_id: listId },
            })
          }
        }
        nextPos++
      }
      break
    }

    case 'assign': {
      const assigneeId = params.user_id !== undefined ? (params.user_id === null ? null : Number(params.user_id)) : null
      if (assigneeId) {
        // Validate assignee is workspace member
        const boardRes = await db`SELECT workspace_id FROM boards WHERE id = ${boardId}`
        const workspaceId = boardRes[0].workspace_id
        const member = await db`
          SELECT user_id FROM workspace_members
          WHERE workspace_id = ${workspaceId} AND user_id = ${assigneeId}
        `
        if (member.length === 0) {
          const error = new Error('User must be a member of the workspace')
          ;(error as any).status = 400
          throw error
        }
      }

      const cardPlaceholders = cardIds.map((_, i) => `$${i + 2}`).join(',')
      const res = await db.unsafe(
        `UPDATE cards
         SET assignee_id = $1, updated_at = NOW()
         WHERE id IN (${cardPlaceholders})
         RETURNING id`,
        [assigneeId, ...cardIds]
      )
      affectedCount = res.length
      break
    }

    case 'unassign': {
      const assigneeId = params.user_id !== undefined ? (params.user_id === null ? null : Number(params.user_id)) : null
      let res
      if (assigneeId) {
        const cardPlaceholders = cardIds.map((_, i) => `$${i + 2}`).join(',')
        res = await db.unsafe(
          `UPDATE cards
           SET assignee_id = NULL, updated_at = NOW()
           WHERE id IN (${cardPlaceholders}) AND assignee_id = $1
           RETURNING id`,
          [assigneeId, ...cardIds]
        )
      } else {
        const cardPlaceholders = cardIds.map((_, i) => `$${i + 1}`).join(',')
        res = await db.unsafe(
          `UPDATE cards
           SET assignee_id = NULL, updated_at = NOW()
           WHERE id IN (${cardPlaceholders})
           RETURNING id`,
          cardIds
        )
      }
      affectedCount = res.length
      break
    }

    case 'add_label': {
      const labelId = Number(params.label_id)
      if (!labelId) {
        const error = new Error('label_id is required for add_label action')
        ;(error as any).status = 400
        throw error
      }

      // Validate label is on the same board
      const label = await db`SELECT board_id FROM labels WHERE id = ${labelId}`
      if (label.length === 0 || Number(label[0].board_id) !== boardId) {
        const error = new Error('Label must belong to the same board')
        ;(error as any).status = 400
        throw error
      }

      for (const cardId of cardIds) {
        const res = await db`
          INSERT INTO card_labels (card_id, label_id)
          VALUES (${cardId}, ${labelId})
          ON CONFLICT DO NOTHING
          RETURNING card_id
        `
        if (res.length > 0) affectedCount++
      }
      break
    }

    case 'remove_label': {
      const labelId = Number(params.label_id)
      if (!labelId) {
        const error = new Error('label_id is required for remove_label action')
        ;(error as any).status = 400
        throw error
      }

      const cardPlaceholders = cardIds.map((_, i) => `$${i + 2}`).join(',')
      const res = await db.unsafe(
        `DELETE FROM card_labels
         WHERE card_id IN (${cardPlaceholders}) AND label_id = $1
         RETURNING card_id`,
        [labelId, ...cardIds]
      )
      affectedCount = res.length
      break
    }

    case 'set_due_date': {
      const dueDate = params.due_date || null
      const cardPlaceholders = cardIds.map((_, i) => `$${i + 2}`).join(',')
      const res = await db.unsafe(
        `UPDATE cards
         SET due_date = $1, updated_at = NOW()
         WHERE id IN (${cardPlaceholders})
         RETURNING id`,
        [dueDate, ...cardIds]
      )
      affectedCount = res.length
      break
    }

    case 'archive': {
      const cardPlaceholders = cardIds.map((_, i) => `$${i + 1}`).join(',')
      const res = await db.unsafe(
        `UPDATE cards
         SET archived_at = NOW(), updated_at = NOW()
         WHERE id IN (${cardPlaceholders})
         RETURNING id`,
        cardIds
      )
      affectedCount = res.length
      break
    }

    case 'delete': {
      const cardPlaceholders = cardIds.map((_, i) => `$${i + 1}`).join(',')
      const res = await db.unsafe(
        `DELETE FROM cards
         WHERE id IN (${cardPlaceholders})
         RETURNING id`,
        cardIds
      )
      affectedCount = res.length
      break
    }

    default: {
      const error = new Error('Invalid action')
      ;(error as any).status = 400
      throw error
    }
  }

  return {
    action,
    affected_count: affectedCount,
    card_ids: cardIds,
  }
}
