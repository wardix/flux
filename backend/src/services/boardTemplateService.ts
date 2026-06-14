import { db } from '../db'

export async function cloneBoard(boardId: number, targetWorkspaceId: number, userId: number, newTitle?: string) {
  const [board] = await db`SELECT * FROM boards WHERE id = ${boardId}`
  if (!board) {
    const error = new Error('Source board not found')
    ;(error as any).status = 404
    throw error
  }

  const title = newTitle || `${board.title} (Clone)`

  const clonedBoard = await db.begin(async (db) => {
    // 1. Clone the board record
    const [newBoard] = await db`
      INSERT INTO boards (workspace_id, title, visibility, background, created_by)
      VALUES (${targetWorkspaceId}, ${title}, ${board.visibility}, ${board.background}, ${userId})
      RETURNING *
    `

    // Add creator as admin
    await db`
      INSERT INTO board_members (board_id, user_id, role)
      VALUES (${newBoard.id}, ${userId}, 'admin')
    `

    // 2. Fetch lists on old board
    const lists = await db`SELECT * FROM lists WHERE board_id = ${boardId} AND deleted_at IS NULL ORDER BY position ASC`
    
    for (const list of lists) {
      // Clone the list record
      const [newList] = await db`
        INSERT INTO lists (board_id, title, position)
        VALUES (${newBoard.id}, ${list.title}, ${list.position})
        RETURNING *
      `

      // 3. Fetch cards in this list
      const cards = await db`SELECT * FROM cards WHERE list_id = ${list.id} AND parent_card_id IS NULL AND deleted_at IS NULL ORDER BY position ASC`
      
      for (const card of cards) {
        // Clone the card record
        const [newCard] = await db`
          INSERT INTO cards (list_id, title, description, position, due_date, assignee_id, story_points, epic_id, sprint_id, is_recurring)
          VALUES (${newList.id}, ${card.title}, ${card.description}, ${card.position}, ${card.due_date}, ${card.assignee_id}, ${card.story_points}, ${card.epic_id}, ${card.sprint_id}, ${card.is_recurring})
          RETURNING *
        `

        // 4. Fetch card labels
        const cardLabels = await db`SELECT label_id FROM card_labels WHERE card_id = ${card.id}`
        for (const cl of cardLabels) {
          await db`
            INSERT INTO card_labels (card_id, label_id)
            VALUES (${newCard.id}, ${cl.label_id})
            ON CONFLICT DO NOTHING
          `
        }

        // 5. Fetch subtasks (nested cards)
        const subtasks = await db`SELECT * FROM cards WHERE parent_card_id = ${card.id} AND deleted_at IS NULL ORDER BY position ASC`
        for (const sub of subtasks) {
          await db`
            INSERT INTO cards (list_id, title, description, position, due_date, assignee_id, parent_card_id, is_completed, story_points)
            VALUES (${newList.id}, ${sub.title}, ${sub.description}, ${sub.position}, ${sub.due_date}, ${sub.assignee_id}, ${newCard.id}, ${sub.is_completed}, ${sub.story_points})
          `
        }

        // 6. Fetch checklists
        const checklists = await db`SELECT * FROM checklists WHERE card_id = ${card.id} ORDER BY position ASC`
        for (const ch of checklists) {
          const [newCh] = await db`
            INSERT INTO checklists (card_id, title, position)
            VALUES (${newCard.id}, ${ch.title}, ${ch.position})
            RETURNING *
          `
          const items = await db`SELECT * FROM checklist_items WHERE checklist_id = ${ch.id} ORDER BY position ASC`
          for (const item of items) {
            await db`
              INSERT INTO checklist_items (checklist_id, title, is_completed, position)
              VALUES (${newCh.id}, ${item.title}, ${item.is_completed}, ${item.position})
            `
          }
        }

        // 7. Fetch custom field values
        const cfValues = await db`SELECT * FROM card_custom_field_values WHERE card_id = ${card.id}`
        for (const cfv of cfValues) {
          await db`
            INSERT INTO card_custom_field_values (card_id, field_id, value)
            VALUES (${newCard.id}, ${cfv.field_id}, ${cfv.value})
            ON CONFLICT (card_id, field_id) DO UPDATE SET value = EXCLUDED.value
          `
        }
      }
    }

    return newBoard
  })

  return clonedBoard
}

export const templates = [
  {
    key: 'agile',
    title: 'Agile Sprint Board',
    description: 'Sprint planning and execution template with Backlog, To Do, In Progress, In Review, and Done columns.',
    lists: ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'],
  },
  {
    key: 'marketing',
    title: 'Marketing Campaign',
    description: 'Track campaigns and assets from Idea, Research, Content Creation, Scheduled, to Published stages.',
    lists: ['Brainstorming', 'Research & Writing', 'Design & Assets', 'Scheduled', 'Published'],
  },
  {
    key: 'crm',
    title: 'Sales Pipeline (CRM)',
    description: 'Manage sales deals from Prospecting, Proposal, Negotiation, Won, to Lost stages.',
    lists: ['Leads / Prospects', 'Contact Made', 'Proposal Sent', 'Negotiation', 'Won / Closed'],
  },
]

export async function createBoardFromTemplate(templateKey: string, workspaceId: number, title: string, userId: number) {
  const template = templates.find(t => t.key === templateKey)
  if (!template) {
    const error = new Error('Template not found')
    ;(error as any).status = 404
    throw error
  }

  const newBoard = await db.begin(async (db) => {
    const [board] = await db`
      INSERT INTO boards (workspace_id, title, visibility, created_by)
      VALUES (${workspaceId}, ${title}, 'workspace-only', ${userId})
      RETURNING *
    `

    // Add creator as admin
    await db`
      INSERT INTO board_members (board_id, user_id, role)
      VALUES (${board.id}, ${userId}, 'admin')
    `

    // Create lists from template definition
    for (let i = 0; i < template.lists.length; i++) {
      await db`
        INSERT INTO lists (board_id, title, position)
        VALUES (${board.id}, ${template.lists[i]}, ${i})
      `
    }

    return board
  })

  return newBoard
}
