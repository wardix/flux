import { db } from '../db'

export async function logActivity(
  cardId: number,
  userId: number | null,
  action: string,
  details?: string | null,
) {
  try {
    await db`
      INSERT INTO activity_logs (card_id, user_id, action, details)
      VALUES (${cardId}, ${userId}, ${action}, ${details || null})
    `
  } catch (err) {
    console.error('Failed to log activity:', err)
  }
}

export async function getActivities(cardId: number) {
  return await db`
    SELECT al.*, u.email as user_email, u.avatar_url as user_avatar
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.card_id = ${cardId}
    ORDER BY al.created_at DESC
  `
}
