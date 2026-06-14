import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { approvalService, approvalRuleSchema, approvalVoteSchema } from '../services/approvalService'
import { authMiddleware } from '../middleware/auth'
import * as notificationService from '../services/notificationService'
import { db } from '../db'

export const approvalsRoutes = new Hono()

// GET /api/boards/:boardId/approval-rules
approvalsRoutes.get('/boards/:boardId/approval-rules', authMiddleware, async (c) => {
  const boardId = parseInt(c.req.param('boardId'))
  // Check board membership (simplified, but usually you have a middleware for this)
  const rules = await approvalService.getRulesByBoard(boardId)
  return c.json({ data: rules })
})

// POST /api/boards/:boardId/approval-rules
approvalsRoutes.post(
  '/boards/:boardId/approval-rules',
  authMiddleware,
  zValidator('json', approvalRuleSchema),
  async (c) => {
    const boardId = parseInt(c.req.param('boardId'))
    const userId = c.get('userId')
    
    // check if user is admin of the workspace for this board
    const [isAdmin] = await db`
      SELECT 1 FROM workspace_members wm 
      JOIN boards b ON b.workspace_id = wm.workspace_id 
      WHERE b.id = ${boardId} AND wm.user_id = ${userId} AND wm.role = 'admin'
    `
    if (!isAdmin) return c.json({ error: 'Unauthorized' }, 403)

    const data = c.req.valid('json')
    try {
      const rule = await approvalService.createRule(boardId, data)
      return c.json({ data: rule }, 201)
    } catch (err: any) {
      if (err.message === 'Rule already exists for these lists') {
        return c.json({ error: err.message }, 409)
      }
      throw err
    }
  }
)

// POST /api/cards/:cardId/approval/request
approvalsRoutes.post(
  '/cards/:cardId/approval/request',
  authMiddleware,
  zValidator('json', z.object({ rule_id: z.number().int() })),
  async (c) => {
    const cardId = parseInt(c.req.param('cardId'))
    const data = c.req.valid('json')
    
    // Create notification
    const [card] = await db`SELECT c.title, c.list_id, l.board_id FROM cards c JOIN lists l ON l.id = c.list_id WHERE c.id = ${cardId}`
    if (card) {
      const boardMembers = await db`SELECT user_id FROM workspace_members wm JOIN boards b ON b.workspace_id = wm.workspace_id WHERE b.id = ${card.board_id}`
      for (const member of boardMembers) {
        await notificationService.createNotification({
          user_id: member.user_id,
          title: 'Approval Request',
          message: `Approval requested for card: ${card.title}`,
          type: 'mention',
          link_url: `/boards/${card.board_id}?card=${cardId}`
        })
      }
    }
    
    const result = await approvalService.createApprovalRequest(cardId, data.rule_id)
    return c.json({ data: result }, 201)
  }
)

// POST /api/cards/:cardId/approval/vote
approvalsRoutes.post(
  '/cards/:cardId/approval/vote',
  authMiddleware,
  zValidator('json', approvalVoteSchema),
  async (c) => {
    const cardId = parseInt(c.req.param('cardId'))
    const userId = c.get('userId')
    const data = c.req.valid('json')
    
    try {
      const vote = await approvalService.vote(cardId, userId, data)
      return c.json({ data: vote })
    } catch (err: any) {
      if (err.message === 'User has already voted for this rule on this card' || err.message === 'Duplicate vote') {
        return c.json({ error: err.message }, 409)
      }
      throw err
    }
  }
)

// GET /api/cards/:cardId/approval/status
approvalsRoutes.get('/cards/:cardId/approval/status', authMiddleware, async (c) => {
  const cardId = parseInt(c.req.param('cardId'))
  const status = await approvalService.getCardApprovalStatus(cardId)
  return c.json({ data: status })
})


