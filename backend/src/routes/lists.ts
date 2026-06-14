import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as listService from '../services/listService'
import { ErrorSchema, ListSchema } from '../lib/schemas'
import { db } from '../db'
import { broadcastToBoard } from '../websocket/events'

async function getUserName(userId: number): Promise<string> {
  const result = await db`SELECT email FROM users WHERE id = ${userId}`
  return result[0]?.email.split('@')[0] || 'User'
}

const listRoutes = new OpenAPIHono()

const createListRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Lists'],
  summary: 'Create list',
  description: 'Create a new list on a board',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            board_id: z.number().openapi({ example: 1 }),
            title: z.string().min(1).openapi({ example: 'To Do' }),
            position: z.number().optional().openapi({ example: 1 }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'List created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: ListSchema,
          }),
        },
      },
    },
    400: {
      description: 'Bad request (validation failed)',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const updateListRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Lists'],
  summary: 'Update list',
  description: 'Update an existing list title or position',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().optional().openapi({ example: 'In Progress' }),
            position: z.number().optional().openapi({ example: 2 }),
            archived_at: z.string().nullable().optional(),
            deleted_at: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'List updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: ListSchema,
          }),
        },
      },
    },
    400: {
      description: 'Invalid ID or input',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'List not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const deleteListRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Lists'],
  summary: 'Delete list',
  description: 'Soft-delete or permanently delete a list by its ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    query: z.object({
      permanent: z.string().optional().openapi({ example: 'true' }),
    }),
  },
  responses: {
    204: {
      description: 'List deleted successfully (no content)',
    },
    400: {
      description: 'Invalid ID',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'List not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

listRoutes.use('*', authMiddleware)

listRoutes.openapi(createListRoute, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    if (!body.board_id) return c.json({ error: 'board_id is required' }, 400)
    if (!body.title) return c.json({ error: 'Title is required' }, 400)

    const list = await listService.create(body)
    
    // Broadcast list creation
    const boardId = Number(list.board_id)
    if (boardId) {
      const userName = await getUserName(userId)
      broadcastToBoard(boardId, {
        type: 'list_created',
        payload: list,
        boardId,
        userId,
        userName,
        timestamp: new Date().toISOString(),
      })
    }

    return c.json({ data: list }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

listRoutes.openapi(updateListRoute, async (c) => {
  try {
    const userId = c.get('userId')
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const body = await c.req.json()
    const list = await listService.update(id, body)
    if (!list) return c.json({ error: 'List not found' }, 404)

    // Broadcast list update
    const boardId = Number(list.board_id)
    if (boardId) {
      const userName = await getUserName(userId)
      broadcastToBoard(boardId, {
        type: 'list_updated',
        payload: list,
        boardId,
        userId,
        userName,
        timestamp: new Date().toISOString(),
      })
    }

    return c.json({ data: list }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

listRoutes.openapi(deleteListRoute, async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const permanent = c.req.query('permanent') === 'true'
  const list = permanent
    ? await listService.remove(id)
    : await listService.update(id, { deleted_at: new Date().toISOString() })
  if (!list) return c.json({ error: 'List not found' }, 404)

  // Broadcast list deletion or archiving
  const boardId = Number(list.board_id)
  if (boardId) {
    const userName = await getUserName(userId)
    broadcastToBoard(boardId, {
      type: 'list_deleted',
      payload: { id: list.id },
      boardId,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    })
  }

  return c.body(null, 204)
})

export { listRoutes }
