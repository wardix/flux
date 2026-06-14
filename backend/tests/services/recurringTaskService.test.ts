import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '../../src/db'
import { processRecurringTasks } from '../../src/services/recurringTaskService'

describe('Recurring Tasks Cron / Background Job', () => {
  let userId: number
  let workspaceId: number
  let boardId: number
  let listId: number
  let cardId: number
  let ruleId: number

  beforeAll(async () => {
    // Seed user
    const [user] = await db`
      INSERT INTO users (email, password_hash)
      VALUES ('recurring_job@flux.com', 'hash')
      RETURNING id
    `
    userId = user.id

    // Create workspace
    const [ws] = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES ('WS', ${userId})
      RETURNING id
    `
    workspaceId = ws.id

    // Create board
    const [board] = await db`
      INSERT INTO boards (workspace_id, title)
      VALUES (${workspaceId}, 'Board')
      RETURNING id
    `
    boardId = board.id

    // Create list
    const [list] = await db`
      INSERT INTO lists (board_id, title)
      VALUES (${boardId}, 'Todo')
      RETURNING id
    `
    listId = list.id

    // Create card
    const [card] = await db`
      INSERT INTO cards (list_id, title, description, is_recurring)
      VALUES (${listId}, 'Routinal Task', 'Details of recurring action', TRUE)
      RETURNING id
    `
    cardId = card.id

    // Insert active recurring task rule set to run in past
    const past = new Date()
    past.setMinutes(past.getMinutes() - 10)
    const [rule] = await db`
      INSERT INTO recurring_tasks (card_id, frequency, next_run, is_active)
      VALUES (${cardId}, 'daily', ${past}, TRUE)
      RETURNING id
    `
    ruleId = rule.id
  })

  afterAll(async () => {
    await db`DELETE FROM workspaces WHERE owner_id = ${userId}`
    await db`DELETE FROM users WHERE id = ${userId}`
  })

  test('should duplicate card and update next_run when executing recurring task processing', async () => {
    // Check initial cards count
    const initialCards = await db`SELECT id FROM cards WHERE list_id = ${listId}`
    expect(initialCards.length).toBe(1)

    // Execute background job
    await processRecurringTasks()

    // Verify card was duplicated
    const finalCards = await db`SELECT id, title, description, is_recurring FROM cards WHERE list_id = ${listId}`
    expect(finalCards.length).toBe(2)

    // New card should NOT be marked as is_recurring itself
    const duplicatedCard = finalCards.find(c => c.id !== cardId)
    expect(duplicatedCard).toBeDefined()
    expect(duplicatedCard!.title).toBe('Routinal Task')
    expect(duplicatedCard!.description).toBe('Details of recurring action')
    expect(duplicatedCard!.is_recurring).toBe(false)

    // Verify next_run was updated to the future
    const [updatedRule] = await db`SELECT next_run FROM recurring_tasks WHERE id = ${ruleId}`
    expect(new Date(updatedRule.next_run).getTime()).toBeGreaterThan(Date.now())
  })
})
