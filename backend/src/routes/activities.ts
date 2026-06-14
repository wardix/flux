import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as activityService from '../services/activityService'
import { ErrorSchema } from '../lib/schemas'

const activityRoutes = new OpenAPIHono()

const getActivitiesRoute = createRoute({
  method: 'get',
  path: '/cards/{id}/activities',
  tags: ['Cards'],
  summary: 'Get activity log of a card',
  description: 'Get all activity logs associated with a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'List of activities',
      content: {
        'application/json': {
          schema: z.array(z.any()),
        },
      },
    },
    400: {
      description: 'Invalid card ID',
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

activityRoutes.use('*', authMiddleware)

activityRoutes.openapi(getActivitiesRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)
    const result = await activityService.getActivities(cardId)
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

export { activityRoutes }
