import { db } from '../db'
import { z } from 'zod'

export const approvalRuleSchema = z.object({
  from_list_id: z.number().int(),
  to_list_id: z.number().int(),
  min_approvals: z.number().int().min(1)
})

export type ApprovalRuleInput = z.infer<typeof approvalRuleSchema>

export const approvalVoteSchema = z.object({
  rule_id: z.number().int(),
  status: z.enum(['approved', 'rejected']),
  comment: z.string().optional().nullable()
})

export type ApprovalVoteInput = z.infer<typeof approvalVoteSchema>

export const approvalService = {
  async createRule(boardId: number, data: ApprovalRuleInput) {
    try {
      const [rule] = await db`
        INSERT INTO approval_rules (board_id, from_list_id, to_list_id, min_approvals)
        VALUES (${boardId}, ${data.from_list_id}, ${data.to_list_id}, ${data.min_approvals})
        RETURNING *
      `
      return rule
    } catch (err: any) {
      if (err.code === '23505' || err.errno === '23505') { // unique violation
        throw new Error('Rule already exists for these lists')
      }
      throw err
    }
  },

  async getRulesByBoard(boardId: number) {
    return await db`
      SELECT ar.*, fl.title as from_list, tl.title as to_list
      FROM approval_rules ar
      JOIN lists fl ON fl.id = ar.from_list_id
      JOIN lists tl ON tl.id = ar.to_list_id
      WHERE ar.board_id = ${boardId}
    `
  },

  async deleteRule(ruleId: number) {
    await db`DELETE FROM approval_rules WHERE id = ${ruleId}`
  },

  async createApprovalRequest(cardId: number, ruleId: number) {
    // Actually requests are just indicated by votes existing, 
    // but the spec says "should create approval request for card" and returns status "pending".
    // We can just verify rule exists and return pending if no votes exist yet.
    // Wait, the API spec says `POST /api/cards/:cardId/approval/request`, and it returns `status: pending`.
    // Does it create anything in DB? No specific table for requests, just a way to notify maybe.
    return { status: 'pending' }
  },

  async vote(cardId: number, userId: number, data: ApprovalVoteInput) {
    try {
      const [vote] = await db`
        INSERT INTO approval_votes (card_id, rule_id, user_id, status, comment)
        VALUES (${cardId}, ${data.rule_id}, ${userId}, ${data.status}, ${data.comment})
        RETURNING *
      `
      return vote
    } catch (err: any) {
      if (err.code === '23505' || err.errno === '23505') {
        throw new Error('User has already voted for this rule on this card')
      }
      throw err
    }
  },

  async getCardApprovalStatus(cardId: number) {
    const rules = await db`
      SELECT ar.*, fl.title as from_list, tl.title as to_list
      FROM approval_rules ar
      JOIN lists fl ON fl.id = ar.from_list_id
      JOIN lists tl ON tl.id = ar.to_list_id
      JOIN cards c ON c.list_id = ar.from_list_id
      WHERE c.id = ${cardId}
    `
    // get votes for this card
    const votes = await db`
      SELECT av.*, u.email as name
      FROM approval_votes av
      JOIN users u ON u.id = av.user_id
      WHERE av.card_id = ${cardId}
    `
    
    return {
      rules: rules.map(rule => {
        const ruleVotes = votes.filter(v => v.rule_id === rule.id)
        const approvals = ruleVotes.filter(v => v.status === 'approved').length
        const rejections = ruleVotes.filter(v => v.status === 'rejected').length
        return {
          ...rule,
          votes: ruleVotes,
          approvals_received: approvals,
          rejections,
          is_approved: approvals >= rule.min_approvals
        }
      })
    }
  },

  async canMoveCard(cardId: number, toListId: number) {
    const [card] = await db`SELECT list_id FROM cards WHERE id = ${cardId}`
    if (!card) return true

    const [rule] = await db`
      SELECT * FROM approval_rules 
      WHERE from_list_id = ${card.list_id} AND to_list_id = ${toListId}
    `
    if (!rule) return true

    const votes = await db`
      SELECT status FROM approval_votes 
      WHERE card_id = ${cardId} AND rule_id = ${rule.id} AND status = 'approved'
    `
    return votes.length >= rule.min_approvals
  }
}
