import { db } from '../db'

export async function getEpicsByWorkspace(workspaceId: number, status?: string) {
  const epics = status
    ? await db`SELECT * FROM epics WHERE workspace_id = ${workspaceId} AND status = ${status} ORDER BY created_at DESC`
    : await db`SELECT * FROM epics WHERE workspace_id = ${workspaceId} ORDER BY created_at DESC`

  // Get computed progress for each epic
  const formattedEpics = []
  for (const epic of epics) {
    const cards = await db`
      SELECT c.id, c.is_completed
      FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE c.epic_id = ${epic.id} AND b.workspace_id = ${workspaceId}
    `
    const totalCards = cards.length
    const completedCards = cards.filter((c) => c.is_completed).length
    const percentage = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0

    formattedEpics.push({
      ...epic,
      progress: {
        total_cards: totalCards,
        completed_cards: completedCards,
        percentage,
      },
    })
  }

  return formattedEpics
}

export async function getEpicDetail(epicId: number) {
  const [epic] = await db`SELECT * FROM epics WHERE id = ${epicId}`
  if (!epic) return null

  // Get cards belonging to this epic, grouped by board
  const cards = await db`
    SELECT 
      c.id, 
      c.title, 
      c.due_date,
      c.is_completed,
      l.id as list_id,
      l.title as list_title,
      b.id as board_id,
      b.title as board_title,
      u.id as assignee_id,
      u.email as assignee_email
    FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    LEFT JOIN users u ON c.assignee_id = u.id
    WHERE c.epic_id = ${epicId}
    ORDER BY b.id ASC, c.position ASC
  `

  const formattedCards = cards.map((c) => ({
    id: c.id,
    title: c.title,
    board_id: c.board_id,
    board_title: c.board_title,
    list_id: c.list_id,
    list_title: c.list_title,
    due_date: c.due_date,
    is_completed: c.is_completed,
    assignees: c.assignee_id ? [{ id: c.assignee_id, name: c.assignee_email.split('@')[0] }] : [],
  }))

  const totalCards = formattedCards.length
  const completedCards = cards.filter((c) => c.is_completed).length
  const percentage = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0

  return {
    ...epic,
    progress: {
      total_cards: totalCards,
      completed_cards: completedCards,
      percentage,
    },
    cards: formattedCards,
  }
}

export async function createEpic(
  workspaceId: number,
  userId: number,
  data: { title: string; description?: string | null; color?: string; status?: string },
) {
  const color = data.color ?? '#6366f1'
  if (color && !color.startsWith('#')) {
    const error = new Error('Invalid color format')
    ;(error as any).status = 400
    throw error
  }

  const [epic] = await db`
    INSERT INTO epics (workspace_id, title, description, color, status, created_by)
    VALUES (${workspaceId}, ${data.title}, ${data.description || null}, ${color}, ${data.status || 'open'}, ${userId})
    RETURNING *
  `
  return epic
}

export async function updateEpic(
  epicId: number,
  data: { title?: string; description?: string | null; color?: string; status?: string },
) {
  const [existing] = await db`SELECT * FROM epics WHERE id = ${epicId}`
  if (!existing) {
    const error = new Error('Epic not found')
    ;(error as any).status = 404
    throw error
  }

  if (data.color && !data.color.startsWith('#')) {
    const error = new Error('Invalid color format')
    ;(error as any).status = 400
    throw error
  }

  const updates: Record<string, any> = {}
  if (data.title !== undefined) updates.title = data.title
  if (data.description !== undefined) updates.description = data.description
  if (data.color !== undefined) updates.color = data.color
  if (data.status !== undefined) updates.status = data.status

  if (Object.keys(updates).length === 0) return existing

  const [epic] = await db`
    UPDATE epics
    SET ${db(updates)}, updated_at = NOW()
    WHERE id = ${epicId}
    RETURNING *
  `
  return epic
}

export async function deleteEpic(epicId: number) {
  const res = await db`
    DELETE FROM epics WHERE id = ${epicId}
    RETURNING id
  `
  return res.length > 0
}

export async function assignCardToEpic(cardId: number, epicId: number | null) {
  // If assigning to an epic, validate card and epic belong to the same workspace
  if (epicId !== null) {
    const [cardWorkspace] = await db`
      SELECT b.workspace_id FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE c.id = ${cardId}
    `
    const [epicWorkspace] = await db`
      SELECT workspace_id FROM epics
      WHERE id = ${epicId}
    `
    if (
      !cardWorkspace ||
      !epicWorkspace ||
      cardWorkspace.workspace_id !== epicWorkspace.workspace_id
    ) {
      const error = new Error('Card and Epic must belong to the same workspace')
      ;(error as any).status = 400
      throw error
    }
  }

  const [card] = await db`
    UPDATE cards
    SET epic_id = ${epicId}, updated_at = NOW()
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
