import { db } from '../db'

export async function getSprintsByBoard(boardId: number) {
  return await db`
    SELECT * FROM sprints
    WHERE board_id = ${boardId}
    ORDER BY created_at DESC
  `
}

export async function getSprintById(sprintId: number) {
  const [sprint] = await db`SELECT * FROM sprints WHERE id = ${sprintId}`
  return sprint || null
}

export async function createSprint(
  boardId: number,
  data: { title: string; goal?: string | null; start_date: string; end_date: string },
) {
  if (new Date(data.end_date) <= new Date(data.start_date)) {
    const error = new Error('End date must be after start date')
    ;(error as any).status = 400
    throw error
  }

  const [sprint] = await db`
    INSERT INTO sprints (board_id, title, goal, start_date, end_date, status)
    VALUES (${boardId}, ${data.title}, ${data.goal || null}, ${data.start_date}, ${data.end_date}, 'planning')
    RETURNING *
  `
  return sprint
}

export async function updateSprint(
  sprintId: number,
  data: { title?: string; goal?: string | null; start_date?: string; end_date?: string },
) {
  const existing = await getSprintById(sprintId)
  if (!existing) {
    const error = new Error('Sprint not found')
    ;(error as any).status = 404
    throw error
  }

  const newStartDate = data.start_date ?? existing.start_date
  const newEndDate = data.end_date ?? existing.end_date

  if (new Date(newEndDate) <= new Date(newStartDate)) {
    const error = new Error('End date must be after start date')
    ;(error as any).status = 400
    throw error
  }

  const updates: Record<string, any> = {}
  if (data.title !== undefined) updates.title = data.title
  if (data.goal !== undefined) updates.goal = data.goal
  if (data.start_date !== undefined) updates.start_date = data.start_date
  if (data.end_date !== undefined) updates.end_date = data.end_date

  if (Object.keys(updates).length === 0) return existing

  const [sprint] = await db`
    UPDATE sprints
    SET ${db(updates)}, updated_at = NOW()
    WHERE id = ${sprintId}
    RETURNING *
  `
  return sprint
}

export async function startSprint(sprintId: number, boardId: number) {
  const existing = await getSprintById(sprintId)
  if (!existing) {
    const error = new Error('Sprint not found')
    ;(error as any).status = 404
    throw error
  }

  const activeSprints = await db`
    SELECT id FROM sprints
    WHERE board_id = ${boardId} AND status = 'active'
  `
  if (activeSprints.length > 0) {
    const error = new Error('Another sprint is already active')
    ;(error as any).status = 409
    throw error
  }

  const [sprint] = await db`
    UPDATE sprints
    SET status = 'active', updated_at = NOW()
    WHERE id = ${sprintId}
    RETURNING *
  `
  return sprint
}

export async function completeSprint(sprintId: number, moveIncompleteToSprintId?: number | null) {
  const existing = await getSprintById(sprintId)
  if (!existing) {
    const error = new Error('Sprint not found')
    ;(error as any).status = 404
    throw error
  }

  // Get list status/categories or we assume lists named 'Done' or similar represents completion.
  // Wait, let's find lists belonging to this board. Typically, the completed cards are cards in the last column,
  // or card.is_completed = true. Let's fetch all cards belonging to this sprint:
  const cards = await db`
    SELECT id, is_completed, list_id FROM cards
    WHERE sprint_id = ${sprintId}
  `

  const totalCards = cards.length
  const completedCards = cards.filter((c) => c.is_completed).length
  const incompleteCards = cards.filter((c) => !c.is_completed)

  // Move incomplete cards to another sprint if specified
  if (moveIncompleteToSprintId && incompleteCards.length > 0) {
    const incompleteCardIds = incompleteCards.map((c) => c.id)
    await db`
      UPDATE cards
      SET sprint_id = ${moveIncompleteToSprintId}, updated_at = NOW()
      WHERE id IN (${incompleteCardIds})
    `
  }

  const [sprint] = await db`
    UPDATE sprints
    SET status = 'completed', updated_at = NOW()
    WHERE id = ${sprintId}
    RETURNING *
  `

  return {
    ...sprint,
    stats: {
      total_cards: totalCards,
      completed_cards: completedCards,
      incomplete_cards: totalCards - completedCards,
    },
  }
}

export async function deleteSprint(sprintId: number) {
  const existing = await getSprintById(sprintId)
  if (!existing) {
    const error = new Error('Sprint not found')
    ;(error as any).status = 404
    throw error
  }

  if (existing.status !== 'planning') {
    const error = new Error('Only sprints in planning status can be deleted')
    ;(error as any).status = 400
    throw error
  }

  await db`DELETE FROM sprints WHERE id = ${sprintId}`
  return true
}

export async function assignCardToSprint(cardId: number, sprintId: number | null) {
  const [card] = await db`
    UPDATE cards
    SET sprint_id = ${sprintId}, updated_at = NOW()
    WHERE id = ${cardId}
    RETURNING *
  `
  if (!card) {
    const error = new Error('Card not found')
    ;(error as any).status = 404
    throw error
  }
  return card
}

export async function getBurndownData(sprintId: number) {
  const sprint = await getSprintById(sprintId)
  if (!sprint) {
    const error = new Error('Sprint not found')
    ;(error as any).status = 404
    throw error
  }

  // Get all cards that are assigned to this sprint or were completed during the sprint.
  // Ideal line: linear decrease of total story points from start_date to end_date.
  const cards = await db`
    SELECT id, story_points, is_completed, created_at FROM cards
    WHERE sprint_id = ${sprintId}
  `
  const totalPoints = cards.reduce((sum, c) => sum + (c.story_points || 0), 0)

  // Calculate sprint duration in days
  const start = new Date(sprint.start_date)
  const end = new Date(sprint.end_date)
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1

  const idealLine = []
  for (let i = 0; i <= durationDays; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const remaining = Math.max(0, totalPoints - (totalPoints / durationDays) * i)
    idealLine.push({
      day: i,
      date: date.toISOString().split('T')[0],
      value: Number(remaining.toFixed(1)),
    })
  }

  // Actual line calculations based on completion logs / activity logs or cards updated_at when is_completed is true
  const actualLine = []
  // Let's populate actual remaining points for each day of the sprint up to today or end_date
  const today = new Date()
  const lastDayIndex =
    today < end
      ? Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      : durationDays

  // Let's check completed dates for cards
  const completedCards = await db`
    SELECT id, story_points, updated_at FROM cards
    WHERE sprint_id = ${sprintId} AND is_completed = true
  `

  for (let i = 0; i <= lastDayIndex; i++) {
    const dateLimit = new Date(start)
    dateLimit.setDate(start.getDate() + i)
    dateLimit.setHours(23, 59, 59, 999)

    // Completed points up to i-th day
    const completedPoints = completedCards
      .filter((c) => new Date(c.updated_at) <= dateLimit)
      .reduce((sum, c) => sum + (c.story_points || 0), 0)

    actualLine.push({
      day: i,
      date: dateLimit.toISOString().split('T')[0],
      value: Math.max(0, totalPoints - completedPoints),
    })
  }

  return {
    ideal_line: idealLine,
    actual_line: actualLine,
  }
}
