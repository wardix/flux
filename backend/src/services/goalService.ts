import { db } from '../db'

export function calculateKeyResultProgress(goal: any, linkedCards: any[]): number {
  if (goal.target_value && Number(goal.target_value) !== 0) {
    return Math.min((Number(goal.current_value) / Number(goal.target_value)) * 100, 100)
  }
  if (linkedCards.length === 0) return 0
  const completedCards = linkedCards.filter((c) => c.is_completed)
  return (completedCards.length / linkedCards.length) * 100
}

export function calculateObjectiveProgress(keyResults: any[]): number {
  if (keyResults.length === 0) return 0
  const total = keyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0)
  return total / keyResults.length
}

export async function getAll(workspaceId: number) {
  const objectives = await db`
    SELECT * FROM goals 
    WHERE workspace_id = ${workspaceId} AND type = 'objective'
    ORDER BY created_at DESC
  `

  const result = []

  for (const obj of objectives) {
    const keyResults = await db`
      SELECT * FROM goals 
      WHERE parent_id = ${obj.id} AND type = 'key_result'
      ORDER BY created_at ASC
    `

    const krsWithProgress = []
    for (const kr of keyResults) {
      const linkedCards = await db`
        SELECT c.* 
        FROM cards c
        JOIN goal_card_links gcl ON c.id = gcl.card_id
        WHERE gcl.goal_id = ${kr.id}
      `

      const krProgress = calculateKeyResultProgress(kr, linkedCards)
      const completedCards = linkedCards.filter((c) => c.is_completed)

      krsWithProgress.push({
        ...kr,
        progress: krProgress,
        linked_cards_count: linkedCards.length,
        completed_cards_count: completedCards.length,
      })
    }

    const objProgress = calculateObjectiveProgress(krsWithProgress)

    result.push({
      ...obj,
      progress: objProgress,
      key_results: krsWithProgress,
    })
  }

  return result
}

export async function getById(id: number) {
  const goalResult = await db`SELECT * FROM goals WHERE id = ${id}`
  if (goalResult.length === 0) return null
  const goal = goalResult[0]

  if (goal.type === 'objective') {
    const keyResults = await db`
      SELECT * FROM goals 
      WHERE parent_id = ${id} AND type = 'key_result'
      ORDER BY created_at ASC
    `
    const krsWithProgress = []
    for (const kr of keyResults) {
      const linkedCards = await db`
        SELECT c.* 
        FROM cards c
        JOIN goal_card_links gcl ON c.id = gcl.card_id
        WHERE gcl.goal_id = ${kr.id}
      `
      const krProgress = calculateKeyResultProgress(kr, linkedCards)
      krsWithProgress.push({
        ...kr,
        progress: krProgress,
        linked_cards_count: linkedCards.length,
      })
    }
    const objProgress = calculateObjectiveProgress(krsWithProgress)
    return {
      ...goal,
      progress: objProgress,
      key_results: krsWithProgress,
    }
  }

  const linkedCards = await db`
    SELECT c.*, b.title as board_title
    FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    JOIN goal_card_links gcl ON c.id = gcl.card_id
    WHERE gcl.goal_id = ${id}
  `
  const progress = calculateKeyResultProgress(goal, linkedCards)
  return {
    ...goal,
    progress,
    linked_cards: linkedCards,
  }
}

export async function create(userId: number, data: any) {
  if (data.type === 'objective' && data.parent_id) {
    throw new Error('OBJECTIVE_CANNOT_HAVE_PARENT')
  }
  if (data.type === 'key_result' && !data.parent_id) {
    throw new Error('KEY_RESULT_REQUIRES_PARENT')
  }

  if (data.parent_id) {
    const parent = await db`SELECT type FROM goals WHERE id = ${data.parent_id}`
    if (parent.length === 0) {
      throw new Error('PARENT_NOT_FOUND')
    }
    if (parent[0].type !== 'objective') {
      throw new Error('PARENT_MUST_BE_OBJECTIVE')
    }
  }

  const result = await db`
    INSERT INTO goals (
      workspace_id, parent_id, title, description, type, 
      target_value, current_value, unit, due_date, color, created_by
    )
    VALUES (
      ${data.workspace_id}, ${data.parent_id || null}, ${data.title}, ${data.description || null}, ${data.type},
      ${data.target_value || null}, ${data.current_value || 0}, ${data.unit || null}, ${data.due_date || null}, ${data.color || null}, ${userId}
    )
    RETURNING *
  `
  return result[0]
}

export async function update(id: number, data: any) {
  const current = await db`SELECT * FROM goals WHERE id = ${id}`
  if (current.length === 0) return null

  const row = current[0]
  const title = data.title !== undefined ? data.title : row.title
  const description = data.description !== undefined ? data.description : row.description
  const status = data.status !== undefined ? data.status : row.status
  const target_value = data.target_value !== undefined ? data.target_value : row.target_value
  const current_value = data.current_value !== undefined ? data.current_value : row.current_value
  const unit = data.unit !== undefined ? data.unit : row.unit
  const due_date = data.due_date !== undefined ? data.due_date : row.due_date
  const color = data.color !== undefined ? data.color : row.color

  const result = await db`
    UPDATE goals
    SET
      title = ${title},
      description = ${description},
      status = ${status},
      target_value = ${target_value},
      current_value = ${current_value},
      unit = ${unit},
      due_date = ${due_date},
      color = ${color},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return result[0]
}

export async function updateProgress(id: number, currentValue: number) {
  const updated = await db`
    UPDATE goals
    SET current_value = ${currentValue}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  if (updated.length === 0) return null
  const goal = updated[0]

  let progress = 0
  if (goal.type === 'key_result') {
    const linkedCards = await db`
      SELECT c.* 
      FROM cards c
      JOIN goal_card_links gcl ON c.id = gcl.card_id
      WHERE gcl.goal_id = ${id}
    `
    progress = calculateKeyResultProgress(goal, linkedCards)
  }
  return {
    ...goal,
    progress,
  }
}

export async function remove(id: number) {
  const result = await db`DELETE FROM goals WHERE id = ${id} RETURNING *`
  return result[0] || null
}

export async function linkCard(goalId: number, cardId: number) {
  const existing = await db`
    SELECT id FROM goal_card_links WHERE goal_id = ${goalId} AND card_id = ${cardId}
  `
  if (existing.length > 0) {
    throw new Error('ALREADY_LINKED')
  }

  const result = await db`
    INSERT INTO goal_card_links (goal_id, card_id)
    VALUES (${goalId}, ${cardId})
    RETURNING *
  `
  return result[0]
}

export async function unlinkCard(goalId: number, cardId: number) {
  const result = await db`
    DELETE FROM goal_card_links 
    WHERE goal_id = ${goalId} AND card_id = ${cardId}
    RETURNING *
  `
  return result[0] || null
}

export async function getGoalsByCardId(cardId: number) {
  const links = await db`
    SELECT g.*
    FROM goals g
    JOIN goal_card_links gcl ON g.id = gcl.goal_id
    WHERE gcl.card_id = ${cardId}
  `
  const result = []
  for (const goal of links) {
    let progress = 0
    if (goal.type === 'key_result') {
      const linkedCards = await db`
        SELECT c.* 
        FROM cards c
        JOIN goal_card_links gcl ON c.id = gcl.card_id
        WHERE gcl.goal_id = ${goal.id}
      `
      progress = calculateKeyResultProgress(goal, linkedCards)
    }
    result.push({
      ...goal,
      progress,
    })
  }
  return result
}
