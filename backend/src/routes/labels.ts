import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema, LabelSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as labelService from '../services/labelService'

const labelRoutes = new OpenAPIHono()

const listLabelsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Labels'],
  summary: 'List board labels',
  description: 'Get all labels created for a specific board',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      boardId: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'List of board labels',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(LabelSchema),
          }),
        },
      },
    },
    400: {
      description: 'boardId parameter is required or invalid',
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

const createLabelRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Labels'],
  summary: 'Create label',
  description: 'Create a new label on a board',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            board_id: z.number().openapi({ example: 1 }),
            name: z.string().min(1).openapi({ example: 'Bug' }),
            color: z.string().min(1).openapi({ example: '#ff0000' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Label created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: LabelSchema,
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

const deleteLabelRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Labels'],
  summary: 'Delete label',
  description: 'Delete a label permanently by its ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    204: {
      description: 'Label deleted successfully (no content)',
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
      description: 'Label not found',
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

const assignLabelToCardRoute = createRoute({
  method: 'post',
  path: '/card/{cardId}',
  tags: ['Labels'],
  summary: 'Assign label to card',
  description: 'Assign an existing label to a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            label_id: z.number().openapi({ example: 1 }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Label assigned successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              card_id: z.number().openapi({ example: 1 }),
              label_id: z.number().openapi({ example: 1 }),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Invalid parameters or validation failed',
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

const unassignLabelFromCardRoute = createRoute({
  method: 'delete',
  path: '/card/{cardId}/{labelId}',
  tags: ['Labels'],
  summary: 'Unassign label from card',
  description: 'Remove label assignment from a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string().openapi({ example: '1' }),
      labelId: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    204: {
      description: 'Label unassigned successfully (no content)',
    },
    400: {
      description: 'Invalid parameters',
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

labelRoutes.use('*', authMiddleware)

labelRoutes.openapi(listLabelsRoute, async (c) => {
  const boardId = Number(c.req.query('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'boardId query parameter is required' }, 400)

  const labels = await labelService.getByBoardId(boardId)
  return c.json({ data: labels }, 200)
})

labelRoutes.openapi(createLabelRoute, async (c) => {
  try {
    const body = await c.req.json()
    if (!body.board_id || !body.name || !body.color) {
      return c.json({ error: 'board_id, name, and color are required' }, 400)
    }

    const label = await labelService.create(body.board_id, body.name, body.color)
    return c.json({ data: label }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

labelRoutes.openapi(deleteLabelRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const label = await labelService.remove(id)
  if (!label) return c.json({ error: 'Label not found' }, 404)

  return c.body(null, 204)
})

labelRoutes.openapi(assignLabelToCardRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid cardId' }, 400)

    const body = await c.req.json()
    if (!body.label_id) return c.json({ error: 'label_id is required' }, 400)

    const association = await labelService.assignToCard(cardId, body.label_id)
    return c.json({ data: association }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

labelRoutes.openapi(unassignLabelFromCardRoute, async (c) => {
  const cardId = Number(c.req.param('cardId'))
  const labelId = Number(c.req.param('labelId'))
  if (Number.isNaN(cardId) || Number.isNaN(labelId)) return c.json({ error: 'Invalid IDs' }, 400)

  await labelService.unassignFromCard(cardId, labelId)
  return c.body(null, 204)
})

export { labelRoutes }
