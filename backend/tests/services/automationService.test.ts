import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { db } from '../../src/db'
import * as automationService from '../../src/services/automationService'

describe('AutomationService', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let toDoListId: number
  let doneListId: number
  let inProgressListId: number
  let card1: any
  let completedLabelId: number

  beforeAll(async () => {
    // Clean tables if needed, then seed required records
    const [user] = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('test_auto@flux.com', 'hash')
      RETURNING id
    `
    userId = user.id

    const [ws] = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Auto Workspace', ${userId})
      RETURNING id
    `
    workspaceId = ws.id

    const [board] = await db`
      INSERT INTO boards (workspace_id, title)
      VALUES (${workspaceId}, 'Auto Board')
      RETURNING id
    `
    boardId = board.id

    const [toDo] = await db`
      INSERT INTO lists (board_id, title, position)
      VALUES (${boardId}, 'To Do', 0)
      RETURNING id
    `
    toDoListId = toDo.id

    const [inProgress] = await db`
      INSERT INTO lists (board_id, title, position)
      VALUES (${boardId}, 'In Progress', 1)
      RETURNING id
    `
    inProgressListId = inProgress.id

    const [done] = await db`
      INSERT INTO lists (board_id, title, position)
      VALUES (${boardId}, 'Done', 2)
      RETURNING id
    `
    doneListId = done.id

    const [label] = await db`
      INSERT INTO labels (board_id, name, color)
      VALUES (${boardId}, 'Completed', '#10b981')
      RETURNING id
    `
    completedLabelId = label.id
  })

  afterAll(async () => {
    await db`DELETE FROM workspaces WHERE id = ${workspaceId}`
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  beforeEach(async () => {
    await db`DELETE FROM automation_rules WHERE board_id = ${boardId}`
    await db`DELETE FROM cards WHERE list_id IN (${toDoListId}, ${inProgressListId}, ${doneListId})`

    const [c] = await db`
      INSERT INTO cards (list_id, title, position)
      VALUES (${toDoListId}, 'Test Card', 0)
      RETURNING id
    `
    card1 = c
  })

  describe('createRule', () => {
    test('should create a valid automation rule', async () => {
      const rule = await automationService.createRule(boardId, userId, {
        name: 'Auto-move to Done',
        trigger_event: 'card_moved',
        trigger_config: { to_list_id: doneListId },
        action_type: 'add_label',
        action_config: { label_id: completedLabelId },
      })
      expect(rule.id).toBeDefined()
      expect(rule.trigger_event).toBe('card_moved')
      expect(rule.is_enabled).toBe(true)
    })

    test('should reject invalid trigger_config for card_moved', async () => {
      await expect(
        automationService.createRule(boardId, userId, {
          name: 'Bad rule',
          trigger_event: 'card_moved',
          trigger_config: {}, // missing to_list_id
          action_type: 'add_label',
          action_config: { label_id: completedLabelId },
        }),
      ).rejects.toThrow()
    })
  })

  describe('processAutomations', () => {
    test('should execute matching automation on card_moved', async () => {
      // Create rule: when card moved to Done → add label "Completed"
      await automationService.createRule(boardId, userId, {
        name: 'Test rule',
        trigger_event: 'card_moved',
        trigger_config: { to_list_id: doneListId },
        action_type: 'add_label',
        action_config: { label_id: completedLabelId },
      })

      // Move card to Done
      await automationService.processAutomations({
        type: 'card_moved',
        boardId,
        cardId: card1.id,
        data: { to_list_id: doneListId },
      })

      // Verify label was added
      const links = await db`
        SELECT * FROM card_labels
        WHERE card_id = ${card1.id} AND label_id = ${completedLabelId}
      `
      expect(links.length).toBe(1)
    })

    test('should NOT execute disabled automation', async () => {
      // Create disabled rule
      const rule = await automationService.createRule(boardId, userId, {
        name: 'Disabled rule',
        trigger_event: 'card_moved',
        trigger_config: { to_list_id: doneListId },
        action_type: 'add_label',
        action_config: { label_id: completedLabelId },
      })
      await automationService.updateRule(rule.id, { is_enabled: false })

      await automationService.processAutomations({
        type: 'card_moved',
        boardId,
        cardId: card1.id,
        data: { to_list_id: doneListId },
      })

      // Verify label was NOT added
      const links = await db`
        SELECT * FROM card_labels
        WHERE card_id = ${card1.id} AND label_id = ${completedLabelId}
      `
      expect(links.length).toBe(0)
    })

    test('should NOT match rule with different trigger_config', async () => {
      await automationService.createRule(boardId, userId, {
        name: 'Test rule',
        trigger_event: 'card_moved',
        trigger_config: { to_list_id: doneListId },
        action_type: 'add_label',
        action_config: { label_id: completedLabelId },
      })

      // Rule triggers on move to Done, but card moved to In Progress
      await automationService.processAutomations({
        type: 'card_moved',
        boardId,
        cardId: card1.id,
        data: { to_list_id: inProgressListId }, // different list
      })

      // Verify no action was taken
      const links = await db`
        SELECT * FROM card_labels
        WHERE card_id = ${card1.id} AND label_id = ${completedLabelId}
      `
      expect(links.length).toBe(0)
    })

    test('should increment execution_count after successful execution', async () => {
      await automationService.createRule(boardId, userId, {
        name: 'Test rule stats',
        trigger_event: 'card_moved',
        trigger_config: { to_list_id: doneListId },
        action_type: 'add_label',
        action_config: { label_id: completedLabelId },
      })

      await automationService.processAutomations({
        type: 'card_moved',
        boardId,
        cardId: card1.id,
        data: { to_list_id: doneListId },
      })

      const rules = await automationService.getRulesByBoard(boardId)
      const rule = rules.find((r) => r.trigger_event === 'card_moved')
      expect(rule!.execution_count).toBeGreaterThan(0)
      expect(rule!.last_executed_at).toBeDefined()
    })

    test('should handle send_notification action', async () => {
      await automationService.createRule(boardId, userId, {
        name: 'Notify on assign',
        trigger_event: 'card_assigned',
        trigger_config: {},
        action_type: 'send_notification',
        action_config: { user_id: userId, message: 'Card assigned!' },
      })

      await automationService.processAutomations({
        type: 'card_assigned',
        boardId,
        cardId: card1.id,
        data: { user_id: userId },
      })

      // Verify notification (comment) was created
      const comments = await db`
        SELECT * FROM comments
        WHERE card_id = ${card1.id} AND user_id = ${userId} AND content = 'Card assigned!'
      `
      expect(comments.length).toBe(1)
    })
  })

  describe('deleteRule', () => {
    test('should delete automation rule', async () => {
      const rule = await automationService.createRule(boardId, userId, {
        name: 'Delete me',
        trigger_event: 'card_created',
        trigger_config: {},
        action_type: 'assign_user',
        action_config: { user_id: userId },
      })

      await automationService.deleteRule(rule.id)
      const rules = await automationService.getRulesByBoard(boardId)
      expect(rules.find((r) => r.id === rule.id)).toBeUndefined()
    })
  })
})
