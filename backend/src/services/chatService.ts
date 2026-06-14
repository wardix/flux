import { db } from '../db'
import { broadcastToChat } from '../websocket/events'
import * as notificationService from './notificationService'

export async function createChannel(name: string | null, type: 'group' | 'direct', workspaceId: number | null, memberIds: number[]) {
  const result = await db`
    INSERT INTO chat_channels (name, type, workspace_id)
    VALUES (${name}, ${type}, ${workspaceId})
    RETURNING *
  `
  const channel = result[0]
  
  if (memberIds.length > 0) {
    const values = memberIds.map(id => `(${channel.id}, ${id})`).join(',')
    await db.unsafe(`INSERT INTO chat_channel_members (channel_id, user_id) VALUES ${values}`)
  }
  
  return channel
}

export async function getOrCreateDirectChannel(user1Id: number, user2Id: number) {
  // Check if DM already exists between these two users
  const existing = await db`
    SELECT c.id, c.name, c.type, c.workspace_id, c.created_at, c.updated_at
    FROM chat_channels c
    JOIN chat_channel_members m1 ON c.id = m1.channel_id AND m1.user_id = ${user1Id}
    JOIN chat_channel_members m2 ON c.id = m2.channel_id AND m2.user_id = ${user2Id}
    WHERE c.type = 'direct' AND (
      SELECT COUNT(*) FROM chat_channel_members WHERE channel_id = c.id
    ) = 2
    LIMIT 1
  `
  
  if (existing.length > 0) {
    return existing[0]
  }
  
  return await createChannel(null, 'direct', null, [user1Id, user2Id])
}

export async function getUserChannels(userId: number) {
  return await db`
    SELECT 
      c.*,
      (
        SELECT COUNT(*) FROM chat_messages cm 
        WHERE cm.channel_id = c.id AND cm.created_at > m.last_read_at AND cm.deleted_at IS NULL
      ) as unread_count,
      (
        SELECT row_to_json(msg) FROM (
          SELECT m2.id, m2.content, m2.created_at, u.name as user_name 
          FROM chat_messages m2 
          JOIN users u ON m2.user_id = u.id 
          WHERE m2.channel_id = c.id AND m2.deleted_at IS NULL 
          ORDER BY m2.created_at DESC LIMIT 1
        ) msg
      ) as last_message,
      (
        SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'avatar_url', u.avatar_url, 'email', u.email))
        FROM chat_channel_members cmem
        JOIN users u ON cmem.user_id = u.id
        WHERE cmem.channel_id = c.id
      ) as members
    FROM chat_channels c
    JOIN chat_channel_members m ON c.id = m.channel_id
    WHERE m.user_id = ${userId}
    ORDER BY c.updated_at DESC
  `
}

export async function isMember(channelId: number, userId: number) {
  const result = await db`SELECT 1 FROM chat_channel_members WHERE channel_id = ${channelId} AND user_id = ${userId}`
  return result.length > 0
}

export async function createMessage(channelId: number, userId: number, content: string) {
  // Parse mentions (@user_id)
  const mentionMatches = content.match(/@(\d+)/g) || []
  const mentions = mentionMatches.map(m => Number(m.slice(1)))
  
  // Parse card links (#card_id)
  const cardMatches = content.match(/#(\d+)/g) || []
  const cardLinks = cardMatches.map(m => Number(m.slice(1)))
  
  const result = await db`
    INSERT INTO chat_messages (channel_id, user_id, content, mentions, card_links)
    VALUES (${channelId}, ${userId}, ${content}, ${JSON.stringify(mentions)}, ${JSON.stringify(cardLinks)})
    RETURNING *
  `
  const msg = result[0]
  
  // Update channel updated_at
  await db`UPDATE chat_channels SET updated_at = NOW() WHERE id = ${channelId}`
  
  // Fetch user details for the message
  const userResult = await db`SELECT id, name, avatar_url, email FROM users WHERE id = ${userId}`
  const user = userResult[0]
  const enrichedMsg = { ...msg, user }
  
  // We can broadcast to a global or workspace websocket channel, but here we can just use 0 as boardId for chat?
  // Or maybe each user listens on their own channel. The acceptance criteria mentions real-time chat via WS.
  // The existing broadcastToBoard requires boardId. Maybe we need broadcastToChannel or broadcastToUser.
  // For now, let's just trigger notifications.
  
  for (const mentionedId of mentions) {
    if (mentionedId !== userId) {
      // Find if they are in the channel
      const isMem = await isMember(channelId, mentionedId)
      if (isMem) {
        await notificationService.createNotification({
          user_id: mentionedId,
          actor_id: userId,
          type: 'mentioned',
          title: 'You were mentioned in chat',
          message: `Someone mentioned you in a chat channel`,
          card_id: null,
          board_id: null
        })
      }
    }
  }
  broadcastToChat(channelId, {
    type: 'chat_message',
    payload: enrichedMsg,
    channelId,
    timestamp: new Date().toISOString()
  })
  
  return enrichedMsg
}

export async function getMessages(channelId: number, limit: number = 20, cursor?: number) {
  let query
  if (cursor) {
    query = db`
      SELECT m.*, row_to_json(u) as user
      FROM chat_messages m
      JOIN (SELECT id, name, avatar_url, email FROM users) u ON m.user_id = u.id
      WHERE m.channel_id = ${channelId} AND m.id < ${cursor} AND m.deleted_at IS NULL
      ORDER BY m.id DESC
      LIMIT ${limit + 1}
    `
  } else {
    query = db`
      SELECT m.*, row_to_json(u) as user
      FROM chat_messages m
      JOIN (SELECT id, name, avatar_url, email FROM users) u ON m.user_id = u.id
      WHERE m.channel_id = ${channelId} AND m.deleted_at IS NULL
      ORDER BY m.id DESC
      LIMIT ${limit + 1}
    `
  }
  
  const messages = await query
  
  const hasMore = messages.length > limit
  if (hasMore) {
    messages.pop()
  }
  
  return {
    messages: messages.reverse(),
    hasMore,
    nextCursor: messages.length > 0 ? messages[0].id : null
  }
}

export async function updateMessage(id: number, channelId: number, userId: number, content: string) {
  const result = await db`
    UPDATE chat_messages
    SET content = ${content}, edited_at = NOW()
    WHERE id = ${id} AND channel_id = ${channelId} AND user_id = ${userId} AND deleted_at IS NULL
    RETURNING *
  `
  if (result.length === 0) return null
  
  const msg = result[0]
  const userResult = await db`SELECT id, name, avatar_url, email FROM users WHERE id = ${userId}`
  const enrichedMsg = { ...msg, user: userResult[0] }

  broadcastToChat(channelId, {
    type: 'chat_message_updated',
    payload: enrichedMsg,
    channelId,
    timestamp: new Date().toISOString()
  })

  return enrichedMsg
}

export async function deleteMessage(id: number, channelId: number, userId: number) {
  const result = await db`
    UPDATE chat_messages
    SET deleted_at = NOW()
    WHERE id = ${id} AND channel_id = ${channelId} AND user_id = ${userId}
    RETURNING id
  `
  if (result.length > 0) {
    broadcastToChat(channelId, {
      type: 'chat_message_deleted',
      payload: { id },
      channelId,
      timestamp: new Date().toISOString()
    })
    return true
  }
  return false
}

export async function markAsRead(channelId: number, userId: number) {
  await db`
    UPDATE chat_channel_members
    SET last_read_at = NOW()
    WHERE channel_id = ${channelId} AND user_id = ${userId}
  `
}
