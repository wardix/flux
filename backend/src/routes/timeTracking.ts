import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as timeTrackingService from '../services/timeTrackingService'

const timeTrackingRoutes = new OpenAPIHono()

const TimeLogSchema = z.object({
  id: z.number(),
  card_id: z.number(),
  user_id: z.number(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  description: z.string().nullable(),
  is_running: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

const startTimerRoute = createRoute({
  method: 'post',
  path: '/cards/{id}/timer/start',
  tags: ['Time Tracking'],
  summary: 'Start active timer',
  description: 'Start tracking time on a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            description: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Timer started successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: TimeLogSchema,
          }),
        },
      },
    },
    409: {
      description: 'Timer already running',
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

const stopTimerRoute = createRoute({
  method: 'post',
  path: '/cards/{id}/timer/stop',
  tags: ['Time Tracking'],
  summary: 'Stop active timer',
  description: 'Stop the running timer on a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Timer stopped successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: TimeLogSchema,
          }),
        },
      },
    },
    404: {
      description: 'No running timer found for this card',
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

const createManualLogRoute = createRoute({
  method: 'post',
  path: '/cards/{id}/time-logs',
  tags: ['Time Tracking'],
  summary: 'Log time manually',
  description: 'Manually add a time log to a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            started_at: z.string().min(1),
            ended_at: z.string().optional(),
            duration_seconds: z.number().optional(),
            description: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Manual log created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: TimeLogSchema,
          }),
        },
      },
    },
    400: {
      description: 'Validation failed (e.g., ended_at before started_at)',
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

const getCardTimeLogsRoute = createRoute({
  method: 'get',
  path: '/cards/{id}/time-logs',
  tags: ['Time Tracking'],
  summary: 'Get card time logs',
  description: 'List all time logs and summary for a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Time logs and summary retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              TimeLogSchema.extend({
                email: z.string(),
              }),
            ),
            meta: z.object({
              total_duration_seconds: z.number(),
              total_logs: z.number(),
              by_user: z.array(
                z.object({
                  user_id: z.number(),
                  email: z.string(),
                  duration_seconds: z.number(),
                }),
              ),
            }),
          }),
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

const getActiveTimerRoute = createRoute({
  method: 'get',
  path: '/users/me/active-timer',
  tags: ['Time Tracking'],
  summary: 'Get active running timer',
  description: 'Get the running timer details for the current user',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Active timer state',
      content: {
        'application/json': {
          schema: z.object({
            data: TimeLogSchema.extend({
              elapsed_seconds: z.number(),
            }).nullable(),
          }),
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

const deleteTimeLogRoute = createRoute({
  method: 'delete',
  path: '/time-logs/{id}',
  tags: ['Time Tracking'],
  summary: 'Delete time log',
  description: 'Delete a specific time log',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    204: {
      description: 'Time log deleted successfully',
    },
    403: {
      description: 'Forbidden (log belongs to another user)',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Time log not found',
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

timeTrackingRoutes.use('/cards/*', authMiddleware)
timeTrackingRoutes.use('/users/*', authMiddleware)
timeTrackingRoutes.use('/time-logs/*', authMiddleware)

timeTrackingRoutes.openapi(startTimerRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)
    const userId = c.get('userId')
    const body = await c.req.json()

    const timer = await timeTrackingService.startTimer(cardId, userId, body.description)
    return c.json({ data: timer }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    if (message.includes('running timer')) {
      return c.json({ error: message }, 409)
    }
    return c.json({ error: message }, 500)
  }
})

timeTrackingRoutes.openapi(stopTimerRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)
    const userId = c.get('userId')

    const timer = await timeTrackingService.stopTimer(cardId, userId)
    if (!timer) {
      return c.json({ error: 'No active timer found on this card for current user' }, 404)
    }
    return c.json({ data: timer }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

timeTrackingRoutes.openapi(createManualLogRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)
    const userId = c.get('userId')
    const body = await c.req.json()

    if (!body.started_at) {
      return c.json({ error: 'started_at is required' }, 400)
    }

    const log = await timeTrackingService.createManualLog(cardId, userId, body)
    return c.json({ data: log }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    if (message.includes('cannot be before')) {
      return c.json({ error: message }, 400)
    }
    return c.json({ error: message }, 500)
  }
})

timeTrackingRoutes.openapi(getCardTimeLogsRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)

    const logs = await timeTrackingService.getCardTimeLogs(cardId)
    return c.json(logs, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

timeTrackingRoutes.openapi(getActiveTimerRoute, async (c) => {
  try {
    const userId = c.get('userId')
    const timer = await timeTrackingService.getActiveTimer(userId)
    return c.json({ data: timer }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

timeTrackingRoutes.openapi(deleteTimeLogRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
    const userId = c.get('userId')

    const log = await timeTrackingService.getTimeLogById(id)
    if (!log) {
      return c.json({ error: 'Time log not found' }, 404)
    }

    if (log.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await timeTrackingService.deleteTimeLog(id)
    return c.body(null, 204)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

export { timeTrackingRoutes }
