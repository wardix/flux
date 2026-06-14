import { db } from '../db'

// Automation action recursion prevention
export const automationContext = {
  isAutomationAction: false,
}

export async function getRulesByBoard(boardId: number) {
  return await db`
    SELECT * FROM automation_rules
    WHERE board_id = ${boardId}
    ORDER BY created_at ASC
  `
}

export async function getRuleById(ruleId: number) {
  const [rule] = await db`SELECT * FROM automation_rules WHERE id = ${ruleId}`
  return rule || null
}

export async function createRule(
  boardId: number,
  userId: number,
  data: {
    name: string
    description?: string | null
    trigger_event: 'card_created' | 'card_moved' | 'card_assigned' | 'due_date_reached'
    trigger_config: Record<string, any>
    action_type: 'move_card' | 'assign_user' | 'add_label' | 'send_notification'
    action_config: Record<string, any>
    is_enabled?: boolean
  }
) {
  // Validate trigger_config & action_config
  validateRuleConfig(data.trigger_event, data.trigger_config, data.action_type, data.action_config)

  const isEnabled = data.is_enabled ?? true
  const triggerConfig = JSON.stringify(data.trigger_config)
  const actionConfig = JSON.stringify(data.action_config)

  const [rule] = await db`
    INSERT INTO automation_rules (
      board_id, name, description, trigger_event, trigger_config,
      action_type, action_config, is_enabled, created_by
    ) VALUES (
      ${boardId}, ${data.name}, ${data.description || null}, ${data.trigger_event}, ${triggerConfig},
      ${data.action_type}, ${actionConfig}, ${isEnabled}, ${userId}
    ) RETURNING *
  `
  return rule
}

export async function updateRule(
  ruleId: number,
  data: {
    name?: string
    description?: string | null
    trigger_event?: 'card_created' | 'card_moved' | 'card_assigned' | 'due_date_reached'
    trigger_config?: Record<string, any>
    action_type?: 'move_card' | 'assign_user' | 'add_label' | 'send_notification'
    action_config?: Record<string, any>
    is_enabled?: boolean
  }
) {
  const existing = await getRuleById(ruleId)
  if (!existing) {
    const error = new Error('Automation rule not found')
    ;(error as any).status = 404
    throw error
  }

  const newTriggerEvent = data.trigger_event ?? existing.trigger_event
  const newTriggerConfig = data.trigger_config ?? existing.trigger_config
  const newActionType = data.action_type ?? existing.action_type
  const newActionConfig = data.action_config ?? existing.action_config

  validateRuleConfig(newTriggerEvent, newTriggerConfig, newActionType, newActionConfig)

  const updates: Record<string, any> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.description !== undefined) updates.description = data.description
  if (data.trigger_event !== undefined) updates.trigger_event = data.trigger_event
  if (data.trigger_config !== undefined) updates.trigger_config = JSON.stringify(data.trigger_config)
  if (data.action_type !== undefined) updates.action_type = data.action_type
  if (data.action_config !== undefined) updates.action_config = JSON.stringify(data.action_config)
  if (data.is_enabled !== undefined) updates.is_enabled = data.is_enabled

  if (Object.keys(updates).length === 0) return existing

  const [rule] = await db`
    UPDATE automation_rules
    SET ${db(updates)}, updated_at = NOW()
    WHERE id = ${ruleId}
    RETURNING *
  `
  return rule
}

export async function deleteRule(ruleId: number) {
  const res = await db`
    DELETE FROM automation_rules WHERE id = ${ruleId}
    RETURNING id
  `
  return res.length > 0
}

function validateRuleConfig(
  triggerEvent: string,
  triggerConfig: any,
  actionType: string,
  actionConfig: any
) {
  const tConfig = typeof triggerConfig === 'string' ? JSON.parse(triggerConfig) : triggerConfig
  const aConfig = typeof actionConfig === 'string' ? JSON.parse(actionConfig) : actionConfig

  if (triggerEvent === 'card_moved') {
    if (tConfig?.to_list_id === undefined || tConfig?.to_list_id === null) {
      throw new Error('trigger_config.to_list_id is required for card_moved trigger')
    }
  }

  if (actionType === 'move_card') {
    if (aConfig?.list_id === undefined || aConfig?.list_id === null) {
      throw new Error('action_config.list_id is required for move_card action')
    }
  } else if (actionType === 'assign_user') {
    if (aConfig?.user_id === undefined || aConfig?.user_id === null) {
      throw new Error('action_config.user_id is required for assign_user action')
    }
  } else if (actionType === 'add_label') {
    if (aConfig?.label_id === undefined || aConfig?.label_id === null) {
      throw new Error('action_config.label_id is required for add_label action')
    }
  } else if (actionType === 'send_notification') {
    if (aConfig?.user_id === undefined || aConfig?.user_id === null) {
      throw new Error('action_config.user_id is required for send_notification action')
    }
    if (!aConfig?.message) {
      throw new Error('action_config.message is required for send_notification action')
    }
  }
}


export async function processAutomations(event: {
  type: 'card_created' | 'card_moved' | 'card_assigned' | 'due_date_reached'
  boardId: number
  cardId: number
  data?: Record<string, any>
}) {
  if (automationContext.isAutomationAction) {
    return // Guard against infinite loop recursion
  }

  // Get active rules for this event
  const rules = await db`
    SELECT * FROM automation_rules
    WHERE board_id = ${event.boardId} AND trigger_event = ${event.type} AND is_enabled = true
  `

  for (const rule of rules) {
    let matches = false

    if (event.type === 'card_created' || event.type === 'card_assigned' || event.type === 'due_date_reached') {
      matches = true
    } else if (event.type === 'card_moved') {
      const tConfig = typeof rule.trigger_config === 'string' ? JSON.parse(rule.trigger_config) : rule.trigger_config
      const ruleToListId = Number(tConfig?.to_list_id)
      const eventToListId = Number(event.data?.to_list_id)
      if (ruleToListId === eventToListId) {
        matches = true
      }
    }

    if (matches) {
      automationContext.isAutomationAction = true
      try {
        const aConfig = typeof rule.action_config === 'string' ? JSON.parse(rule.action_config) : rule.action_config
        await executeAction(rule.action_type, aConfig, event.cardId)
        // Update execution count and last executed stats
        await db`
          UPDATE automation_rules
          SET execution_count = execution_count + 1, last_executed_at = NOW()
          WHERE id = ${rule.id}
        `
      } catch (err) {
        console.error(`Failed to execute automation rule ${rule.id}:`, err)
      } finally {
        automationContext.isAutomationAction = false
      }
    }
  }
}

async function executeAction(actionType: string, actionConfig: any, cardId: number) {
  if (actionType === 'move_card') {
    const listId = Number(actionConfig.list_id)
    await db`
      UPDATE cards
      SET list_id = ${listId}, updated_at = NOW()
      WHERE id = ${cardId}
    `
  } else if (actionType === 'assign_user') {
    const userId = Number(actionConfig.user_id)
    await db`
      UPDATE cards
      SET assignee_id = ${userId}, updated_at = NOW()
      WHERE id = ${cardId}
    `
  } else if (actionType === 'add_label') {
    const labelId = Number(actionConfig.label_id)
    // Avoid duplicate inserts
    await db`
      INSERT INTO card_labels (card_id, label_id)
      VALUES (${cardId}, ${labelId})
      ON CONFLICT (card_id, label_id) DO NOTHING
    `
  } else if (actionType === 'send_notification') {
    // Insert into comment as a bot-like notification or system-generated comment as mock representation
    const userId = Number(actionConfig.user_id)
    const message = actionConfig.message
    await db`
      INSERT INTO comments (card_id, user_id, content)
      VALUES (${cardId}, ${userId}, ${message})
    `
  }
}
