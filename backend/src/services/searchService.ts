import { db } from '../db'

export async function searchCards(
  userId: number,
  query: string,
  filters: {
    assignee?: number
    label?: number
    due?: 'overdue' | 'due_today' | 'due_week' | 'no_date'
  } = {},
  page = 1,
  perPage = 10
) {
  const offset = (page - 1) * perPage
  const searchTerm = `%${query}%`

  // 1. First get all boards accessible by the user (either workspaces owned by the user or workspaces user is member of)
  const accessibleBoardsQuery = db`
    SELECT b.id FROM boards b
    JOIN workspaces w ON b.workspace_id = w.id
    LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = ${userId}
    WHERE w.owner_id = ${userId} OR wm.user_id = ${userId}
  `
  const boardsResult = await accessibleBoardsQuery
  const boardIds = boardsResult.map((b) => b.id)

  if (boardIds.length === 0) {
    return { data: [], total: 0 }
  }

  // Define components for building dynamic query parts
  let whereClauses = [
    db`c.deleted_at IS NULL`,
    db`l.board_id IN (${boardIds})`,
    db`(c.title ILIKE ${searchTerm} OR c.description ILIKE ${searchTerm})`
  ]

  if (filters.assignee) {
    whereClauses.push(db`c.assignee_id = ${filters.assignee}`)
  }

  if (filters.label) {
    whereClauses.push(
      db`c.id IN (SELECT card_id FROM card_labels WHERE label_id = ${filters.label})`
    )
  }

  if (filters.due) {
    const now = new Date().toISOString()
    if (filters.due === 'overdue') {
      whereClauses.push(db`c.due_date < ${now} AND c.is_completed = FALSE`)
    } else if (filters.due === 'due_today') {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      whereClauses.push(db`c.due_date BETWEEN ${todayStart.toISOString()} AND ${todayEnd.toISOString()}`)
    } else if (filters.due === 'due_week') {
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() + 7)
      whereClauses.push(db`c.due_date BETWEEN ${now} AND ${weekEnd.toISOString()}`)
    } else if (filters.due === 'no_date') {
      whereClauses.push(db`c.due_date IS NULL`)
    }
  }

  const combinedWhere = whereClauses.reduce((acc, curr) => db`${acc} AND ${curr}`)

  // Get total count
  const countRes = await db`
    SELECT COUNT(DISTINCT c.id) as count
    FROM cards c
    JOIN lists l ON c.list_id = l.id
    WHERE ${combinedWhere}
  `
  const total = Number(countRes[0]?.count || 0)

  if (total === 0) {
    return { data: [], total }
  }

  // Get paginated cards with details
  const cardsRes = await db`
    SELECT 
      c.id, c.title, c.description, c.due_date, c.list_id, c.is_completed,
      l.title as list_title,
      b.id as board_id, b.title as board_title,
      u.id as assignee_id, u.email as assignee_email, u.avatar_url as assignee_avatar
    FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    LEFT JOIN users u ON c.assignee_id = u.id
    WHERE ${combinedWhere}
    ORDER BY c.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `

  // For each card, fetch labels and format assignees/labels array
  const formattedData = await Promise.all(
    cardsRes.map(async (c) => {
      const labelsRes = await db`
        SELECT l.id, l.name, l.color 
        FROM labels l
        JOIN card_labels cl ON l.id = cl.label_id
        WHERE cl.card_id = ${c.id}
      `
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        due_date: c.due_date,
        list_id: c.list_id,
        list_title: c.list_title,
        board_id: c.board_id,
        board_title: c.board_title,
        labels: labelsRes,
        assignees: c.assignee_id
          ? [{ id: c.assignee_id, name: c.assignee_email.split('@')[0], avatar_url: c.assignee_avatar }]
          : [],
      }
    })
  )

  return { data: formattedData, total }
}
