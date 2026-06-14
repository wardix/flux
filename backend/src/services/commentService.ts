import { db } from '../db'
import { logActivity } from './activityService'

export async function getComments(cardId: number) {
  return await db`
    SELECT c.*, u.email as user_email, u.avatar_url as user_avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.card_id = ${cardId}
    ORDER BY c.created_at ASC
  `
}

export async function createComment(cardId: number, userId: number, content: string) {
  const result = await db`
    INSERT INTO comments (card_id, user_id, content)
    VALUES (${cardId}, ${userId}, ${content})
    RETURNING *
  `

  const comment = result[0]

  // Add details about the comment in the activity log
  await logActivity(cardId, userId, 'added_comment', content.slice(0, 100))

  // Return with user info
  const users = await db`SELECT email, avatar_url FROM users WHERE id = ${userId}`
  return {
    ...comment,
    user_email: users[0]?.email || '',
    user_avatar: users[0]?.avatar_url || null,
  }
}

export async function updateComment(
  cardId: number,
  commentId: number,
  userId: number,
  content: string,
) {
  const result = await db`
    UPDATE comments
    SET content = ${content}, updated_at = NOW()
    WHERE id = ${commentId} AND card_id = ${cardId} AND user_id = ${userId}
    RETURNING *
  `
  if (result.length === 0) return null

  const comment = result[0]
  const users = await db`SELECT email, avatar_url FROM users WHERE id = ${userId}`
  return {
    ...comment,
    user_email: users[0]?.email || '',
    user_avatar: users[0]?.avatar_url || null,
  }
}

export async function deleteComment(cardId: number, commentId: number, userId: number) {
  const result = await db`
    DELETE FROM comments
    WHERE id = ${commentId} AND card_id = ${cardId} AND user_id = ${userId}
    RETURNING *
  `
  return result[0] || null
}
