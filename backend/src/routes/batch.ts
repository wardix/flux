import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import { executeBatch } from '../services/batchService'
import { ErrorSchema } from '../lib/schemas'

const batchRoutes = new OpenAPIHono()

batchRoutes.use('*', authMiddleware)

const batchSchema = z.object({
  card_ids: z.array(z.number().int().positive()).min(1).max(100),
  action: z.enum(['move', 'assign', 'unassign', 'add_label', 'remove_label', 'set_due_date', 'archive', 'delete']),
  params: z.record(z.unknown()).optional().default({}),
})

const executeBatchRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Cards'],
  summary: 'Batch execute card operations',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: batchSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Batch actions executed successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              action: z.string(),
              affected_count: z.number(),
              card_ids: z.array(z.number()),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
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

batchRoutes.openapi(executeBatchRoute, async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const body = await c.req.json()
    // Manual/Zod validate just to be robust if middleware validation has issues
    const validation = batchSchema.safeParse(body)
    if (!validation.success) {
      return c.json({ error: 'Validation failed' }, 400)
    }

    const { card_ids, action, params } = validation.data
    const result = await executeBatch(userId, card_ids, action, params)
    return c.json({ data: result }, 200)
  } catch (error: any) {
    const status = error.status || 500
    return c.json({ error: error.message || 'Internal Server Error' }, status)
  }
})

export { batchRoutes }
