import type { Context, Next } from 'hono'
import { db } from '../db'
import { getBoardRole } from '../services/boardService'

export async function checkObserverPermission(c: Context, next: Next) {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  // Only enforce observer read-only mode on state-changing methods
  if (c.req.method === 'GET') {
    return await next()
  }

  let boardId: number | null = null

  // 1. Try param: boardId
  const paramBoardId = c.req.param('boardId')
  if (paramBoardId) {
    boardId = Number(paramBoardId)
  }

  // 2. Parse ID from path manually (Hono c.req.param can be empty in wildcard middleware)
  const path = c.req.path

  if (!boardId) {
    const boardMatch = path.match(/\/api\/boards\/(\d+)/)
    if (boardMatch) {
      boardId = Number(boardMatch[1])
    } else {
      const listMatch = path.match(/\/api\/lists\/(\d+)/)
      if (listMatch) {
        const listId = Number(listMatch[1])
        const lists = await db`SELECT board_id FROM lists WHERE id = ${listId}`
        if (lists.length > 0) boardId = lists[0].board_id
      } else {
        const cardMatch = path.match(/\/api\/cards\/(\d+)/)
        if (cardMatch) {
          const cardId = Number(cardMatch[1])
          const cards = await db`
            SELECT l.board_id FROM cards c
            JOIN lists l ON c.list_id = l.id
            WHERE c.id = ${cardId}
          `
          if (cards.length > 0) boardId = cards[0].board_id
        } else {
          const checklistMatch = path.match(/\/api\/checklists\/(\d+)/)
          if (checklistMatch) {
            const checklistId = Number(checklistMatch[1])
            const checklists = await db`
              SELECT l.board_id FROM checklists ch
              JOIN cards c ON ch.card_id = c.id
              JOIN lists l ON c.list_id = l.id
              WHERE ch.id = ${checklistId}
            `
            if (checklists.length > 0) boardId = checklists[0].board_id
          }
        }
      }
    }
  }

  // 3. Fallback: Parse cardId/boardId from request body if available
  if (!boardId && c.req.header('Content-Type')?.includes('application/json')) {
    try {
      const body = await c.req.raw.clone().json()
      if (body.board_id) {
        boardId = Number(body.board_id)
      } else if (body.list_id) {
        const lists = await db`SELECT board_id FROM lists WHERE id = ${body.list_id}`
        if (lists.length > 0) boardId = lists[0].board_id
      } else if (body.cards && Array.isArray(body.cards) && body.cards.length > 0) {
        const firstCardListId = body.cards[0].list_id
        if (firstCardListId) {
          const lists = await db`SELECT board_id FROM lists WHERE id = ${firstCardListId}`
          if (lists.length > 0) boardId = lists[0].board_id
        }
      } else if (body.card_ids && Array.isArray(body.card_ids) && body.card_ids.length > 0) {
        const firstCardId = body.card_ids[0]
        const cards = await db`
          SELECT l.board_id FROM cards c
          JOIN lists l ON c.list_id = l.id
          WHERE c.id = ${firstCardId}
        `
        if (cards.length > 0) boardId = cards[0].board_id
      }
    } catch (_) {}
  }

  if (boardId) {
    const role = await getBoardRole(boardId, userId)
    if (role === 'observer') {
      return c.json({ error: 'Forbidden: Observer cannot make modifications' }, 403)
    }
  }

  await next()
}
