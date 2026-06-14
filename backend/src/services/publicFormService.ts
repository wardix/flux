import { db } from '../db'

export interface PublicForm {
  id: number
  board_id: number
  title: string
  description: string | null
  is_active: boolean
  created_at: Date
}

export async function createOrUpdateForm(
  boardId: number,
  title: string,
  description?: string | null,
  isActive?: boolean
): Promise<PublicForm> {
  const existing = await db`SELECT id FROM public_forms WHERE board_id = ${boardId}`
  
  if (existing.length > 0) {
    const updates: Record<string, any> = { title }
    if (description !== undefined) updates.description = description
    if (isActive !== undefined) updates.is_active = isActive

    const [form] = await db`
      UPDATE public_forms
      SET ${db(updates)}, updated_at = NOW()
      WHERE board_id = ${boardId}
      RETURNING *
    `
    return form as unknown as PublicForm
  } else {
    const [form] = await db`
      INSERT INTO public_forms (board_id, title, description, is_active)
      VALUES (${boardId}, ${title}, ${description || null}, ${isActive ?? true})
      RETURNING *
    `
    return form as unknown as PublicForm
  }
}

export async function getFormByBoard(boardId: number): Promise<PublicForm | null> {
  const [form] = await db`SELECT * FROM public_forms WHERE board_id = ${boardId}`
  return form ? (form as unknown as PublicForm) : null
}

export async function getFormById(id: number): Promise<PublicForm | null> {
  const [form] = await db`SELECT * FROM public_forms WHERE id = ${id}`
  return form ? (form as unknown as PublicForm) : null
}

export async function submitFormCard(formId: number, title: string, description?: string): Promise<any> {
  const form = await getFormById(formId)
  if (!form || !form.is_active) {
    throw new Error('Form not found or is inactive')
  }

  // Find the first list on this board
  const lists = await db`SELECT id FROM lists WHERE board_id = ${form.board_id} AND deleted_at IS NULL ORDER BY position ASC LIMIT 1`
  if (lists.length === 0) {
    throw new Error('Board has no columns to receive cards')
  }
  const listId = lists[0].id

  // Determine card position
  const maxPos = await db`SELECT MAX(position) as max_pos FROM cards WHERE list_id = ${listId}`
  const position = maxPos[0]?.max_pos !== null ? Number(maxPos[0].max_pos) + 1 : 0

  const [card] = await db`
    INSERT INTO cards (list_id, title, description, position)
    VALUES (${listId}, ${title}, ${description || null}, ${position})
    RETURNING *
  `
  return card
}
