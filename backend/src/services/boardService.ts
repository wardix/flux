import { db } from '../db'

export async function getAll(userId: number) {
  return await db`
    SELECT DISTINCT b.* FROM boards b
    LEFT JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
    WHERE (wm.user_id = ${userId} OR b.created_by = ${userId})
      AND b.archived_at IS NULL AND b.deleted_at IS NULL
    ORDER BY b.created_at DESC
  `
}

export async function getById(id: number) {
  const boards = await db`SELECT * FROM boards WHERE id = ${id} AND deleted_at IS NULL`
  if (boards.length === 0) return null
  const board = boards[0]

  const lists = await db`
    SELECT * FROM lists 
    WHERE board_id = ${id} AND archived_at IS NULL AND deleted_at IS NULL 
    ORDER BY position ASC, id ASC
  `

  const listIds = lists.map((l) => l.id)
  // biome-ignore lint/suspicious/noExplicitAny: cards variable type is dynamic from DB query
  let cards: any[] = []
  if (listIds.length > 0) {
    cards = await db`
      SELECT c.*,
        u.email as assignee_email,
        u.avatar_url as assignee_avatar,
        COALESCE((
          SELECT json_build_object(
            'total', COUNT(*)::integer,
            'completed', COUNT(CASE WHEN is_completed = TRUE THEN 1 END)::integer
          )
          FROM cards sub
          WHERE sub.parent_card_id = c.id AND sub.deleted_at IS NULL
        ), json_build_object('total', 0, 'completed', 0)) as subtask_count,
        COALESCE((
          SELECT json_build_object(
            'total', COUNT(*)::integer,
            'completed', COUNT(CASE WHEN is_completed = TRUE THEN 1 END)::integer
          )
          FROM checklist_items ci
          JOIN checklists ch ON ci.checklist_id = ch.id
          WHERE ch.card_id = c.id
        ), json_build_object('total', 0, 'completed', 0)) as checklist_count,
        (
          SELECT file_path FROM attachments
          WHERE card_id = c.id AND is_cover = TRUE
          LIMIT 1
        ) as cover_file_path
      FROM cards c
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.list_id IN (${listIds}) AND c.parent_card_id IS NULL AND c.archived_at IS NULL AND c.deleted_at IS NULL 
      ORDER BY c.position ASC, c.id ASC
    `
  }

  const listsWithCards = lists.map((list) => {
    // biome-ignore lint/suspicious/noExplicitAny: card type is dynamic from raw DB query
    const listCards = cards.filter((card: any) => card.list_id === list.id)
    const total_story_points = listCards.reduce(
      // biome-ignore lint/suspicious/noExplicitAny: card type is dynamic from raw DB query
      (sum, card: any) => sum + (card.story_points || 0),
      0,
    )
    return {
      ...list,
      total_story_points,
      cards: listCards,
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
  
  const board = result[0]
  
  // Add creator to board_members as 'admin'
  await db`
    INSERT INTO board_members (board_id, user_id, role)
    VALUES (${board.id}, ${userId}, 'admin')
  `

  return board
}

export async function update(
  id: number,
  data: {
    title?: string
    visibility?: string
    background?: string
    archived_at?: string | null
    deleted_at?: string | null
  },
) {
  const current = await db`SELECT * FROM boards WHERE id = ${id}`
  if (current.length === 0) return null

  const row = current[0]
  const title = data.title !== undefined ? data.title : row.title
  const visibility = data.visibility !== undefined ? data.visibility : row.visibility
  const background = data.background !== undefined ? data.background : row.background
  const archived_at = data.archived_at !== undefined ? data.archived_at : row.archived_at
  const deleted_at = data.deleted_at !== undefined ? data.deleted_at : row.deleted_at

  const result = await db`
    UPDATE boards
    SET title = ${title}, visibility = ${visibility}, background = ${background}, archived_at = ${archived_at}, deleted_at = ${deleted_at}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] || null
}

export async function remove(id: number) {
  const result = await db`DELETE FROM boards WHERE id = ${id} RETURNING *`
  return result[0] || null
}

export async function getBoardMembers(boardId: number) {
  return await db`
    SELECT bm.*, u.email, u.avatar_url
    FROM board_members bm
    JOIN users u ON bm.user_id = u.id
    WHERE bm.board_id = ${boardId}
    ORDER BY bm.created_at ASC
  `
}

export async function addBoardMember(boardId: number, email: string, role: string) {
  const users = await db`SELECT id FROM users WHERE email = ${email}`
  if (users.length === 0) {
    throw new Error('USER_NOT_FOUND')
  }
  const userId = users[0].id

  // Upsert board member
  const existing = await db`
    SELECT * FROM board_members WHERE board_id = ${boardId} AND user_id = ${userId}
  `
  
  if (existing.length > 0) {
    const result = await db`
      UPDATE board_members
      SET role = ${role}, updated_at = NOW()
      WHERE board_id = ${boardId} AND user_id = ${userId}
      RETURNING *
    `
    return result[0]
  }

  const result = await db`
    INSERT INTO board_members (board_id, user_id, role)
    VALUES (${boardId}, ${userId}, ${role})
    RETURNING *
  `
  return result[0]
}

export async function getBoardRole(boardId: number, userId: number): Promise<string | null> {
  const members = await db`
    SELECT role FROM board_members WHERE board_id = ${boardId} AND user_id = ${userId}
  `
  if (members.length > 0) {
    return members[0].role
  }

  // Fallback check if user is creator
  const boards = await db`SELECT created_by FROM boards WHERE id = ${boardId}`
  if (boards.length > 0 && boards[0].created_by === userId) {
    return 'admin'
  }

  return null
}

