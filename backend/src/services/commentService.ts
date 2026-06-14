import { db } from '../db'
import { logActivity } from './activityService'
import * as notificationService from './notificationService'

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

  // Fetch card details for notification
  const cardData = await db`
    SELECT c.title, c.assignee_id, l.board_id 
    FROM cards c 
    JOIN lists l ON c.list_id = l.id 
    WHERE c.id = ${cardId}
  `
  if (cardData.length > 0) {
    const { title, assignee_id, board_id } = cardData[0]

    // Notify assignee
    if (assignee_id && assignee_id !== userId) {
      await notificationService.createNotification({
        user_id: assignee_id,
        actor_id: userId,
        type: 'comment',
        title: 'New comment on your card',
        message: `A new comment was added to "${title}"`,
        card_id: cardId,
        board_id: board_id,
      })
    }

    // Parse mentions
    const mentions = content.match(/@([a-zA-Z0-9_.-]+)/g)
    if (mentions) {
      const usernames = mentions.map(m => m.slice(1))
      for (const username of usernames) {
        const mentionedUsers = await db`SELECT id FROM users WHERE email LIKE ${username + '@%'}`
        if (mentionedUsers.length > 0) {
          const mentionedId = mentionedUsers[0].id
          if (mentionedId !== userId) {
            await notificationService.createNotification({
              user_id: mentionedId,
              actor_id: userId,
              type: 'mentioned',
              title: 'You were mentioned',
              message: `You were mentioned in a comment on "${title}"`,
              card_id: cardId,
              board_id: board_id,
            })
          }
        }
      }
    }
  }

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
