import { db } from '../db'

export async function getAll(userId: number) {
  return await db`
    SELECT DISTINCT b.* FROM boards b
    LEFT JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
    WHERE wm.user_id = ${userId} OR b.created_by = ${userId}
    ORDER BY b.created_at DESC
  `
}

export async function getById(id: number) {
  const boards = await db`SELECT * FROM boards WHERE id = ${id}`
  if (boards.length === 0) return null
  const board = boards[0]

  const lists = await db`SELECT * FROM lists WHERE board_id = ${id} ORDER BY position ASC, id ASC`

  const listIds = lists.map((l) => l.id)
  let cards: unknown[] = []
  if (listIds.length > 0) {
    cards =
      await db`SELECT * FROM cards WHERE list_id IN (${listIds}) ORDER BY position ASC, id ASC`
  }

  const listsWithCards = lists.map((list) => {
    return {
      ...list,
      cards: cards.filter((card) => card.list_id === list.id),
    }
  })

  return {
    ...board,
    lists: listsWithCards,
  }
}

export async function create(
  userId: number,
  data: { title: string; workspace_id?: number; visibility?: string; background?: string },
) {
  let workspaceId = data.workspace_id
  if (!workspaceId) {
    const workspaces = await db`SELECT id FROM workspaces WHERE owner_id = ${userId} LIMIT 1`
    if (workspaces.length > 0) {
      workspaceId = workspaces[0].id
    } else {
      const newWorkspace = await db`
        INSERT INTO workspaces (name, owner_id)
        VALUES ('Default Workspace', ${userId})
        RETURNING id
      `
      workspaceId = newWorkspace[0].id
      await db`
        INSERT INTO workspace_members (user_id, workspace_id, role)
        VALUES (${userId}, ${workspaceId}, 'owner')
      `
    }
  }

  const result = await db`
    INSERT INTO boards (workspace_id, title, visibility, background, created_by)
    VALUES (${workspaceId}, ${data.title}, ${data.visibility || 'private'}, ${data.background || null}, ${userId})
    RETURNING *
  `
  return result[0]
}

export async function update(
  id: number,
  data: { title?: string; visibility?: string; background?: string },
) {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  if (data.title !== undefined) {
    updates.push(`title = $${index++}`)
    values.push(data.title)
  }
  if (data.visibility !== undefined) {
    updates.push(`visibility = $${index++}`)
    values.push(data.visibility)
  }
  if (data.background !== undefined) {
    updates.push(`background = $${index++}`)
    values.push(data.background)
  }

  if (updates.length === 0) {
    const current = await db`SELECT * FROM boards WHERE id = ${id}`
    return current[0] || null
  }

  values.push(id)
  const query = `
    UPDATE boards
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${index}
    RETURNING *
  `
  const result = await db.query(query, values)
  return result[0] || null
}

export async function remove(id: number) {
  const result = await db`DELETE FROM boards WHERE id = ${id} RETURNING *`
  return result[0] || null
}
