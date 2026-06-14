import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import { db } from '../db'
import * as cardService from '../services/cardService'
import { logActivity } from '../services/activityService'

import { ErrorSchema, CardSchema, CreateCardRequest } from '../lib/schemas'


const cardRoutes = new OpenAPIHono()

const getCardByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Cards'],
  summary: 'Get card by ID',
  description: 'Get details of a specific card by its ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Card details',
      content: {
        'application/json': {
          schema: z.object({
            data: CardSchema,
          }),
        },
      },
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
      description: 'Card not found',
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

const createCardRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Cards'],
  summary: 'Create card',
  description: 'Create a new card under a specific list',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateCardRequest.extend({
            story_points: z.number().nullable().optional().openapi({ example: 5 }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Card created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: CardSchema,
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

const updateCardPositionsRoute = createRoute({
  method: 'put',
  path: '/positions',
  tags: ['Cards'],
  summary: 'Update card positions',
  description: 'Update ordering positions of multiple cards in bulk (typically for drag and drop)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            cards: z.array(
              z.object({
                id: z.number().openapi({ example: 1 }),
                list_id: z.number().openapi({ example: 1 }),
                position: z.number().openapi({ example: 2 }),
              }),
            ),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Positions updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
          }),
        },
      },
    },
    400: {
      description: 'Bad request',
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

const updateCardRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Cards'],
  summary: 'Update card',
  description: 'Update the properties of an existing card (title, description, list, points, etc.)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().optional().openapi({ example: 'Updated Title' }),
            description: z
              .string()
              .nullable()
              .optional()
              .openapi({ example: 'Updated Description' }),
            list_id: z.number().optional().openapi({ example: 1 }),
            position: z.number().optional().openapi({ example: 1 }),
            due_date: z
              .string()
              .nullable()
              .optional()
              .openapi({ example: '2026-06-30T00:00:00.000Z' }),
            assignee_id: z.number().nullable().optional().openapi({ example: 1 }),
            is_completed: z.boolean().optional().openapi({ example: true }),
            story_points: z.number().nullable().optional().openapi({ example: 8 }),
            archived_at: z.string().nullable().optional(),
            deleted_at: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Card updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: CardSchema,
          }),
        },
      },
    },
    400: {
      description: 'Invalid input or ID',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Card not found',
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

const deleteCardRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Cards'],
  summary: 'Delete card',
  description: 'Soft-delete or permanently delete a card by its ID',
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
      description: 'Card deleted successfully (no content)',
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
      description: 'Card not found',
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

cardRoutes.use('*', authMiddleware)

cardRoutes.openapi(getCardByIdRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const card = await cardService.getById(id)
    if (!card) return c.json({ error: 'Card not found' }, 404)

    return c.json({ data: card }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

cardRoutes.openapi(createCardRoute, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    if (!body.list_id) return c.json({ error: 'list_id is required' }, 400)
    if (!body.title) return c.json({ error: 'Title is required' }, 400)

    if ('story_points' in body) {
      const sp = body.story_points
      if (sp !== null && sp !== undefined) {
        if (typeof sp !== 'number' || !Number.isInteger(sp) || sp < 0 || sp > 100) {
          return c.json({ error: 'story_points must be an integer between 0 and 100' }, 400)
        }
      }
    }

    const card = await cardService.create(body)
    await logActivity(card.id, userId, 'created', card.title)
    return c.json({ data: card }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

cardRoutes.openapi(updateCardPositionsRoute, async (c) => {
  try {
    const body = await c.req.json()
    if (!body.cards || !Array.isArray(body.cards)) {
      return c.json({ error: 'cards array is required' }, 400)
    }

    await cardService.updatePositions(body.cards)
    return c.json({ success: true }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

cardRoutes.openapi(updateCardRoute, async (c) => {
  try {
    const userId = c.get('userId')
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const oldCards = await db`SELECT * FROM cards WHERE id = ${id}`
    if (oldCards.length === 0) return c.json({ error: 'Card not found' }, 404)
    const oldCard = oldCards[0]

    const body = await c.req.json()
    if ('story_points' in body) {
      const sp = body.story_points
      if (sp !== null && sp !== undefined) {
        if (typeof sp !== 'number' || !Number.isInteger(sp) || sp < 0 || sp > 100) {
          return c.json({ error: 'story_points must be an integer between 0 and 100' }, 400)
        }
      }
    }
    const card = await cardService.update(id, body)
    if (!card) return c.json({ error: 'Card not found' }, 404)

    // Log what changed
    if (body.title && body.title !== oldCard.title) {
      await logActivity(id, userId, 'updated_title', body.title)
    }
    if (body.description !== undefined && body.description !== oldCard.description) {
      await logActivity(id, userId, 'updated_description', body.description)
    }
    if (body.due_date !== undefined && body.due_date !== oldCard.due_date) {
      await logActivity(id, userId, 'updated_due_date', body.due_date)
    }
    if (body.story_points !== undefined && body.story_points !== oldCard.story_points) {
      await logActivity(
        id,
        userId,
        'updated_story_points',
        body.story_points ? String(body.story_points) : 'removed',
      )
    }
    if (body.list_id !== undefined && body.list_id !== oldCard.list_id) {
      await logActivity(id, userId, 'moved_list', String(body.list_id))
    }
    if (body.assignee_id !== undefined && body.assignee_id !== oldCard.assignee_id) {
      await logActivity(id, userId, 'updated_assignee', body.assignee_id ? String(body.assignee_id) : 'unassigned')
    }
    if (body.archived_at !== undefined && body.archived_at !== oldCard.archived_at) {
      await logActivity(id, userId, body.archived_at ? 'archived' : 'restored')
    }

    return c.json({ data: card }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

cardRoutes.openapi(deleteCardRoute, async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const permanent = c.req.query('permanent') === 'true'
  const card = permanent
    ? await cardService.remove(id)
    : await cardService.update(id, { deleted_at: new Date().toISOString() })
  if (!card) return c.json({ error: 'Card not found' }, 404)

  if (!permanent) {
    await logActivity(id, userId, 'deleted')
  }

  return c.body(null, 204)
})

export { cardRoutes }
