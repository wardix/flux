import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as chatService from '../services/chatService'
import { ErrorSchema } from '../lib/schemas'

export const chatRoutes = new OpenAPIHono()

chatRoutes.use('/*', authMiddleware)

chatRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/channels',
    tags: ['Chat'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string().optional(),
              type: z.enum(['group', 'direct']),
              member_ids: z.array(z.number()),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Channel created',
        content: { 'application/json': { schema: z.object({ data: z.any() }) } },
      },
      400: {
        description: 'Bad Request',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { name, type, member_ids } = await c.req.json()
    if (type === 'group' && !name) {
      return c.json({ error: 'Name is required for group channel' }, 400)
    }
    const channel = await chatService.createChannel(name, type, null, member_ids)
    return c.json({ data: channel }, 201)
  }
)

chatRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/channels/direct',
    tags: ['Chat'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              user_id: z.number(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'DM Channel',
        content: { 'application/json': { schema: z.object({ data: z.any() }) } },
      },
      201: {
        description: 'DM Channel created',
        content: { 'application/json': { schema: z.object({ data: z.any() }) } },
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId')
    const { user_id } = await c.req.json()
    const channel = await chatService.getOrCreateDirectChannel(userId, user_id)
    return c.json({ data: channel }, channel.created_at === channel.updated_at ? 201 : 200)
  }
)

chatRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/channels',
    tags: ['Chat'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Get user channels',
        content: { 'application/json': { schema: z.object({ data: z.any() }) } },
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId')
    const channels = await chatService.getUserChannels(userId)
    return c.json({ data: channels }, 200)
  }
)

chatRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/channels/{channelId}/messages',
    tags: ['Chat'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ channelId: z.string() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({ content: z.string() }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Message sent',
        content: { 'application/json': { schema: z.object({ data: z.any() }) } },
      },
      400: {
        description: 'Bad request',
        content: { 'application/json': { schema: ErrorSchema } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId')
    const channelId = Number(c.req.param('channelId'))
    const { content } = await c.req.json()
    
    if (!content || content.trim() === '') {
      return c.json({ error: 'Message content cannot be empty' }, 400)
    }
    
    const isMem = await chatService.isMember(channelId, userId)
    if (!isMem) {
      return c.json({ error: 'Not a member of this channel' }, 403)
    }
    
    const msg = await chatService.createMessage(channelId, userId, content)
    return c.json({ data: msg }, 201)
  }
)

chatRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/channels/{channelId}/messages',
    tags: ['Chat'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ channelId: z.string() }),
      query: z.object({
        limit: z.string().optional(),
        cursor: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: 'Get messages',
        content: { 'application/json': { schema: z.object({ data: z.any(), meta: z.any() }) } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId')
    const channelId = Number(c.req.param('channelId'))
    const limit = Number(c.req.query('limit')) || 20
    const cursor = c.req.query('cursor') ? Number(c.req.query('cursor')) : undefined
    
    const isMem = await chatService.isMember(channelId, userId)
    if (!isMem) {
      return c.json({ error: 'Not a member of this channel' }, 403)
    }
    
    const { messages, hasMore, nextCursor } = await chatService.getMessages(channelId, limit, cursor)
    
    // Mark as read when fetching messages
    await chatService.markAsRead(channelId, userId)
    
    return c.json({ data: messages, meta: { has_more: hasMore, next_cursor: nextCursor } }, 200)
  }
)

chatRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/messages/{messageId}',
    tags: ['Chat'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ messageId: z.string() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({ content: z.string() }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Message updated',
        content: { 'application/json': { schema: z.object({ data: z.any() }) } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: ErrorSchema } },
      },
      404: {
        description: 'Not found',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId')
    const messageId = Number(c.req.param('messageId'))
    const { content } = await c.req.json()
    
    // Check if message is owned by user
    const { db } = await import('../db')
    const messages = await db`SELECT * FROM chat_messages WHERE id = ${messageId}`
    if (messages.length === 0) return c.json({ error: 'Not found' }, 404)
    if (messages[0].user_id !== userId) return c.json({ error: 'Forbidden' }, 403)
    
    const updated = await chatService.updateMessage(messageId, messages[0].channel_id, userId, content)
    return c.json({ data: updated }, 200)
  }
)

chatRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/messages/{messageId}',
    tags: ['Chat'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ messageId: z.string() }),
    },
    responses: {
      204: {
        description: 'Message deleted',
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: ErrorSchema } },
      },
      404: {
        description: 'Not found',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId')
    const messageId = Number(c.req.param('messageId'))
    
    const { db } = await import('../db')
    const messages = await db`SELECT * FROM chat_messages WHERE id = ${messageId}`
    if (messages.length === 0) return c.json({ error: 'Not found' }, 404)
    if (messages[0].user_id !== userId) return c.json({ error: 'Forbidden' }, 403)
    
    await chatService.deleteMessage(messageId, messages[0].channel_id, userId)
    return new Response(null, { status: 204 })
  }
)
