import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as goalService from '../services/goalService'

const goalRoutes = new OpenAPIHono()

// Apply authentication middleware
goalRoutes.use('*', authMiddleware)

// Schemas
const CreateGoalRequestSchema = z
  .object({
    workspace_id: z.number().int().positive(),
    parent_id: z.number().int().positive().nullable().optional(),
    title: z.string().min(1).max(255),
    description: z.string().max(5000).optional().nullable(),
    type: z.enum(['objective', 'key_result']),
    target_value: z.number().positive().optional().nullable(),
    unit: z.string().max(50).optional().nullable(),
    due_date: z.string().optional().nullable(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.type === 'key_result' && !data.parent_id) return false
      if (data.type === 'objective' && data.parent_id) return false
      return true
    },
    {
      message: 'Key Result requires parent_id, Objective must not have parent_id',
      path: ['parent_id'],
    },
  )

// 1. GET /api/goals
const listGoalsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Goals'],
  summary: 'List workspace goals',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      workspace_id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Workspace goals retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.any()),
          }),
        },
      },
    },
  },
})

goalRoutes.openapi(listGoalsRoute, async (c) => {
  const workspaceId = Number(c.req.query('workspace_id'))
  if (Number.isNaN(workspaceId)) return c.json({ error: 'Invalid workspace_id' }, 400)

  const goals = await goalService.getAll(workspaceId)
  return c.json({ data: goals }, 200)
})

// 2. POST /api/goals
const createGoalRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Goals'],
  summary: 'Create goal',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateGoalRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Goal created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

goalRoutes.openapi(createGoalRoute, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  // Validate request schema refined logic manually to give 400
  if (body.type === 'key_result' && !body.parent_id) {
    return c.json({ error: 'Key Result requires parent_id' }, 400)
  }
  if (body.type === 'objective' && body.parent_id) {
    return c.json({ error: 'Objective must not have parent_id' }, 400)
  }

  try {
    const goal = await goalService.create(userId, body)
    return c.json({ data: goal }, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

// 3. GET /api/goals/:id
const getGoalRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Goals'],
  summary: 'Get goal details',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Goal details retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    404: {
      description: 'Goal not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

goalRoutes.openapi(getGoalRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const goal = await goalService.getById(id)
  if (!goal) return c.json({ error: 'Goal not found' }, 404)

  return c.json({ data: goal }, 200)
})

// 4. PUT /api/goals/:id
const updateGoalRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Goals'],
  summary: 'Update goal details',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().optional(),
            description: z.string().optional().nullable(),
            status: z.enum(['active', 'completed', 'cancelled']).optional(),
            target_value: z.number().optional().nullable(),
            current_value: z.number().optional().nullable(),
            unit: z.string().optional().nullable(),
            due_date: z.string().optional().nullable(),
            color: z.string().optional().nullable(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Goal updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    404: {
      description: 'Goal not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

goalRoutes.openapi(updateGoalRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json()
  const updated = await goalService.update(id, body)
  if (!updated) return c.json({ error: 'Goal not found' }, 404)

  return c.json({ data: updated }, 200)
})

// 5. PUT /api/goals/:id/progress
const updateProgressRoute = createRoute({
  method: 'put',
  path: '/{id}/progress',
  tags: ['Goals'],
  summary: 'Update goal progress',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            current_value: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Goal progress updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    404: {
      description: 'Goal not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

goalRoutes.openapi(updateProgressRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json()
  const result = await goalService.updateProgress(id, body.current_value)
  if (!result) return c.json({ error: 'Goal not found' }, 404)

  return c.json({ data: result }, 200)
})

// 6. DELETE /api/goals/:id
const deleteGoalRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Goals'],
  summary: 'Delete goal',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Goal deleted successfully',
    },
    404: {
      description: 'Goal not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

goalRoutes.openapi(deleteGoalRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const deleted = await goalService.remove(id)
  if (!deleted) return c.json({ error: 'Goal not found' }, 404)

  return c.body(null, 204)
})

// 7. POST /api/goals/:id/cards
const linkCardRoute = createRoute({
  method: 'post',
  path: '/{id}/cards',
  tags: ['Goals'],
  summary: 'Link card to goal',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            card_id: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Card linked successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    409: {
      description: 'Card already linked',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

goalRoutes.openapi(linkCardRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json()
  try {
    const result = await goalService.linkCard(id, body.card_id)
    return c.json({ data: result }, 201)
  } catch (err: any) {
    if (err.message === 'ALREADY_LINKED') {
      return c.json({ error: 'Card is already linked to this goal' }, 409)
    }
    return c.json({ error: err.message }, 500)
  }
})

// 8. DELETE /api/goals/:id/cards/:cardId
const unlinkCardRoute = createRoute({
  method: 'delete',
  path: '/{id}/cards/{cardId}',
  tags: ['Goals'],
  summary: 'Unlink card from goal',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
      cardId: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Card unlinked successfully',
    },
    404: {
      description: 'Link not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

goalRoutes.openapi(unlinkCardRoute, async (c) => {
  const id = Number(c.req.param('id'))
  const cardId = Number(c.req.param('cardId'))
  if (Number.isNaN(id) || Number.isNaN(cardId)) {
    return c.json({ error: 'Invalid ID' }, 400)
  }

  const unlinked = await goalService.unlinkCard(id, cardId)
  if (!unlinked) return c.json({ error: 'Link not found' }, 404)

  return c.body(null, 204)
})

export { goalRoutes }
