import { db } from '../db'

export interface TrelloBoard {
  name: string
  lists?: {
    id: string
    name: string
    closed: boolean
    pos: number
  }[]
  cards?: {
    id: string
    idList: string
    name: string
    desc: string
    closed: boolean
    pos: number
    due?: string | null
  }[]
}

export interface JiraCSVRow {
  summary: string
  description?: string
  status?: string
  storyPoints?: number
  dueDate?: string
  assignee?: string
}

export async function importTrello(
  workspaceId: number,
  userId: number,
  trelloData: TrelloBoard,
): Promise<any> {
  const board = await db.begin(async (db) => {
    // 1. Create Board
    const [newBoard] = await db`
      INSERT INTO boards (workspace_id, title, visibility, created_by)
      VALUES (${workspaceId}, ${trelloData.name}, 'workspace-only', ${userId})
      RETURNING *
    `

    // Add creator as admin
    await db`
      INSERT INTO board_members (board_id, user_id, role)
      VALUES (${newBoard.id}, ${userId}, 'admin')
    `

    // 2. Filter active lists & cards
    const activeLists = (trelloData.lists || []).filter((l) => !l.closed)
    const listIdMap: Record<string, number> = {}

    for (const list of activeLists) {
      const [newList] = await db`
        INSERT INTO lists (board_id, title, position)
        VALUES (${newBoard.id}, ${list.name}, ${Math.floor(list.pos)})
        RETURNING *
      `
      listIdMap[list.id] = newList.id
    }

    const activeCards = (trelloData.cards || []).filter((c) => !c.closed)
    for (const card of activeCards) {
      const targetListId = listIdMap[card.idList]
      if (targetListId) {
        await db`
          INSERT INTO cards (list_id, title, description, position, due_date)
          VALUES (${targetListId}, ${card.name}, ${card.desc || null}, ${Math.floor(card.pos)}, ${card.due || null})
        `
      }
    }

    return newBoard
  })

  return board
}

export async function importJira(
  workspaceId: number,
  userId: number,
  boardTitle: string,
  jiraRows: JiraCSVRow[],
): Promise<any> {
  const board = await db.begin(async (db) => {
    // 1. Create Board
    const [newBoard] = await db`
      INSERT INTO boards (workspace_id, title, visibility, created_by)
      VALUES (${workspaceId}, ${boardTitle}, 'workspace-only', ${userId})
      RETURNING *
    `

    // Add creator as admin
    await db`
      INSERT INTO board_members (board_id, user_id, role)
      VALUES (${newBoard.id}, ${userId}, 'admin')
    `

    // 2. Identify statuses/lists and insert them
    const statuses = Array.from(new Set(jiraRows.map((r) => r.status || 'To Do')))
    const listIdMap: Record<string, number> = {}

    for (let i = 0; i < statuses.length; i++) {
      const statusName = statuses[i]
      const [newList] = await db`
        INSERT INTO lists (board_id, title, position)
        VALUES (${newBoard.id}, ${statusName}, ${i})
        RETURNING *
      `
      listIdMap[statusName] = newList.id
    }

    // 3. Insert cards
    for (let i = 0; i < jiraRows.length; i++) {
      const row = jiraRows[i]
      const targetListId = listIdMap[row.status || 'To Do']
      if (targetListId) {
        // Try mapping assignee by email if match, otherwise leave empty
        let assigneeId: number | null = null
        if (row.assignee) {
          const users = await db`SELECT id FROM users WHERE email = ${row.assignee}`
          if (users.length > 0) {
            assigneeId = users[0].id
          }
        }

        await db`
          INSERT INTO cards (list_id, title, description, position, due_date, assignee_id, story_points)
          VALUES (
            ${targetListId}, 
            ${row.summary}, 
            ${row.description || null}, 
            ${i}, 
            ${row.dueDate || null}, 
            ${assigneeId}, 
            ${row.storyPoints || null}
          )
        `
      }
    }

    return newBoard
  })

  return board
}
