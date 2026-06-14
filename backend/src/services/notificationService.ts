import { db } from '../db'

export async function createNotification(data: {
  user_id: number
  actor_id?: number | null
  type: 'assigned' | 'mentioned' | 'due_soon' | 'comment'
  title: string
  message: string
  card_id?: number | null
  board_id?: number | null
}) {
  if (data.user_id === data.actor_id) return null // Don't notify self
  
  const result = await db`
    INSERT INTO notifications (user_id, actor_id, type, title, message, card_id, board_id)
    VALUES (${data.user_id}, ${data.actor_id || null}, ${data.type}, ${data.title}, ${data.message}, ${data.card_id || null}, ${data.board_id || null})
    RETURNING *
  `
  return result[0]
}

export async function getNotifications(userId: number, unreadOnly: boolean = false) {
  let query = db`
    SELECT n.*,
      json_build_object('id', u.id, 'name', u.email, 'avatar_url', u.avatar_url) as actor
    FROM notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    WHERE n.user_id = ${userId}
  `
  if (unreadOnly) {
    query = db`${query} AND n.is_read = FALSE`
  }
  query = db`${query} ORDER BY n.created_at DESC LIMIT 50`
  return await query
}

export async function markAsRead(id: number, userId: number) {
  const result = await db`
    UPDATE notifications SET is_read = TRUE
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  return result[0] || null
}

export async function markAllAsRead(userId: number) {
  const result = await db`
    UPDATE notifications SET is_read = TRUE
    WHERE user_id = ${userId} AND is_read = FALSE
  `
  return { updated_count: result.count }
}

export async function getUnreadCount(userId: number) {
  const result = await db`
    SELECT COUNT(*)::integer as count
    FROM notifications
    WHERE user_id = ${userId} AND is_read = FALSE
  `
  return result[0]
}

export async function checkDueSoonItems(): Promise<void> {
  // 1. Cek cards yang due dalam 24 jam
  const cards = await db`
    SELECT id, title, assignee_id, due_date
    FROM cards
    WHERE due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
      AND assignee_id IS NOT NULL
      AND is_completed = FALSE
      AND deleted_at IS NULL
  `

  for (const card of cards) {
    if (card.assignee_id) {
      await createNotification({
        user_id: card.assignee_id,
        type: 'due_soon',
        title: 'Card Due Soon',
        message: `Card "${card.title}" is due soon.`,
        card_id: card.id,
      })
    }
  }

  // 2. Cek checklist_items yang due_date dalam 24 jam
  const checklistItems = await db`
    SELECT ci.id, ci.title, ci.assignee_id, ci.due_date, c.id as card_id, c.title as card_title
    FROM checklist_items ci
    JOIN checklists cl ON ci.checklist_id = cl.id
    JOIN cards c ON cl.card_id = c.id
    WHERE ci.due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
      AND ci.assignee_id IS NOT NULL
      AND ci.is_completed = FALSE
      AND c.deleted_at IS NULL
  `

  for (const item of checklistItems) {
    if (item.assignee_id) {
      await createNotification({
        user_id: item.assignee_id,
        type: 'due_soon',
        title: 'Checklist Item Due Soon',
        message: `Checklist item "${item.title}" in card "${item.card_title}" is due soon.`,
        card_id: item.card_id,
      })
    }
  }
}
