import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as sprintService from '../services/sprintService'
import { ErrorSchema } from '../lib/schemas'

const sprintRoutes = new OpenAPIHono()
sprintRoutes.use('*', authMiddleware)

const getSprintsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Sprints'],
  summary: 'Get sprints for a board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'List of sprints',
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

const createSprintRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Sprints'],
  summary: 'Create a sprint',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string(),
            goal: z.string().nullable().optional(),
            start_date: z.string(),
            end_date: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Sprint created',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
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
  },
})

const updateSprintRoute = createRoute({
  method: 'put',
  path: '/{sprintId}',
  tags: ['Sprints'],
  summary: 'Update a sprint',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
      sprintId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().optional(),
            goal: z.string().nullable().optional(),
            start_date: z.string().optional(),
            end_date: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Sprint updated',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
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
    404: {
      description: 'Sprint not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const startSprintRoute = createRoute({
  method: 'put',
  path: '/{sprintId}/start',
  tags: ['Sprints'],
  summary: 'Start a sprint',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
      sprintId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Sprint started',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    409: {
      description: 'Another sprint is already active',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const completeSprintRoute = createRoute({
  method: 'put',
  path: '/{sprintId}/complete',
  tags: ['Sprints'],
  summary: 'Complete a sprint',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
      sprintId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            move_incomplete_to_sprint_id: z.number().nullable().optional(),
          }).optional(),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Sprint completed',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
  },
})

const deleteSprintRoute = createRoute({
  method: 'delete',
  path: '/{sprintId}',
  tags: ['Sprints'],
  summary: 'Delete a sprint',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
      sprintId: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Sprint deleted',
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const getBurndownRoute = createRoute({
  method: 'get',
  path: '/{sprintId}/burndown',
  tags: ['Sprints'],
  summary: 'Get burndown data',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
      sprintId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Burndown stats',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
  },
})

sprintRoutes.openapi(getSprintsRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid board ID' }, 400)

  const data = await sprintService.getSprintsByBoard(boardId)
  return c.json({ data }, 200)
})

sprintRoutes.openapi(createSprintRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid board ID' }, 400)

  const body = await c.req.json()
  try {
    const data = await sprintService.createSprint(boardId, body)
    return c.json({ data }, 201)
  } catch (err: any) {
    const status = err.status || 400
    return c.json({ error: err.message }, status)
  }
})

sprintRoutes.openapi(updateSprintRoute, async (c) => {
  const sprintId = Number(c.req.param('sprintId'))
  if (Number.isNaN(sprintId)) return c.json({ error: 'Invalid sprint ID' }, 400)

  const body = await c.req.json()
  try {
    const data = await sprintService.updateSprint(sprintId, body)
    return c.json({ data }, 200)
  } catch (err: any) {
    const status = err.status || 400
    return c.json({ error: err.message }, status)
  }
})

sprintRoutes.openapi(startSprintRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  const sprintId = Number(c.req.param('sprintId'))
  if (Number.isNaN(sprintId)) return c.json({ error: 'Invalid sprint ID' }, 400)

  try {
    const data = await sprintService.startSprint(sprintId, boardId)
    return c.json({ data }, 200)
  } catch (err: any) {
    const status = err.status || 400
    return c.json({ error: err.message }, status)
  }
})

sprintRoutes.openapi(completeSprintRoute, async (c) => {
  const sprintId = Number(c.req.param('sprintId'))
  if (Number.isNaN(sprintId)) return c.json({ error: 'Invalid sprint ID' }, 400)

  let body = {}
  try {
    body = await c.req.json()
  } catch {}

  const moveId = (body as any)?.move_incomplete_to_sprint_id || null
  const data = await sprintService.completeSprint(sprintId, moveId)
  return c.json({ data }, 200)
})

sprintRoutes.openapi(deleteSprintRoute, async (c) => {
  const sprintId = Number(c.req.param('sprintId'))
  if (Number.isNaN(sprintId)) return c.json({ error: 'Invalid sprint ID' }, 400)

  try {
    await sprintService.deleteSprint(sprintId)
    return c.body(null, 204)
  } catch (err: any) {
    const status = err.status || 400
    return c.json({ error: err.message }, status)
  }
})

sprintRoutes.openapi(getBurndownRoute, async (c) => {
  const sprintId = Number(c.req.param('sprintId'))
  if (Number.isNaN(sprintId)) return c.json({ error: 'Invalid sprint ID' }, 400)

  try {
    const data = await sprintService.getBurndownData(sprintId)
    return c.json({ data }, 200)
  } catch (err: any) {
    const status = err.status || 400
    return c.json({ error: err.message }, status)
  }
})

export { sprintRoutes }
