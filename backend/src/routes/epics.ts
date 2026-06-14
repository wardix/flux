import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as epicService from '../services/epicService'
import { ErrorSchema } from '../lib/schemas'

const epicRoutes = new OpenAPIHono()
epicRoutes.use('*', authMiddleware)

const getEpicsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Epics'],
  summary: 'Get all epics for a workspace',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
    }),
    query: z.object({
      status: z.enum(['open', 'done']).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of epics',
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

const getEpicDetailRoute = createRoute({
  method: 'get',
  path: '/{epicId}',
  tags: ['Epics'],
  summary: 'Get details of an epic',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
      epicId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Epic detail',
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
    404: {
      description: 'Epic not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const createEpicRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Epics'],
  summary: 'Create a new epic',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string(),
            description: z.string().nullable().optional(),
            color: z.string().optional(),
            status: z.enum(['open', 'done']).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Epic created successfully',
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

const updateEpicRoute = createRoute({
  method: 'put',
  path: '/{epicId}',
  tags: ['Epics'],
  summary: 'Update an epic',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
      epicId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().optional(),
            description: z.string().nullable().optional(),
            color: z.string().optional(),
            status: z.enum(['open', 'done']).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Epic updated successfully',
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
      description: 'Epic not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const deleteEpicRoute = createRoute({
  method: 'delete',
  path: '/{epicId}',
  tags: ['Epics'],
  summary: 'Delete an epic',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
      epicId: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Epic deleted successfully',
    },
    404: {
      description: 'Epic not found',
    },
  },
})

epicRoutes.openapi(getEpicsRoute, async (c) => {
  const workspaceId = Number(c.req.param('workspaceId'))
  if (Number.isNaN(workspaceId)) return c.json({ error: 'Invalid workspace ID' }, 400)

  const status = c.req.query('status')
  const epics = await epicService.getEpicsByWorkspace(workspaceId, status)
  return c.json({ data: epics }, 200)
})

epicRoutes.openapi(getEpicDetailRoute, async (c) => {
  const epicId = Number(c.req.param('epicId'))
  if (Number.isNaN(epicId)) return c.json({ error: 'Invalid epic ID' }, 400)

  const epic = await epicService.getEpicDetail(epicId)
  if (!epic) return c.json({ error: 'Epic not found' }, 404)

  return c.json({ data: epic }, 200)
})

epicRoutes.openapi(createEpicRoute, async (c) => {
  const workspaceId = Number(c.req.param('workspaceId'))
  if (Number.isNaN(workspaceId)) return c.json({ error: 'Invalid workspace ID' }, 400)

  const userId = c.get('userId')
  const body = await c.req.json()

  try {
    const epic = await epicService.createEpic(workspaceId, userId, body)
    return c.json({ data: epic }, 201)
  } catch (err: any) {
    const status = err.status || 400
    return c.json({ error: err.message }, status)
  }
})

epicRoutes.openapi(updateEpicRoute, async (c) => {
  const epicId = Number(c.req.param('epicId'))
  if (Number.isNaN(epicId)) return c.json({ error: 'Invalid epic ID' }, 400)

  const body = await c.req.json()

  try {
    const epic = await epicService.updateEpic(epicId, body)
    return c.json({ data: epic }, 200)
  } catch (err: any) {
    const status = err.status || 400
    return c.json({ error: err.message }, status)
  }
})

epicRoutes.openapi(deleteEpicRoute, async (c) => {
  const epicId = Number(c.req.param('epicId'))
  if (Number.isNaN(epicId)) return c.json({ error: 'Invalid epic ID' }, 400)

  const deleted = await epicService.deleteEpic(epicId)
  if (!deleted) return c.json({ error: 'Epic not found' }, 404)

  return c.body(null, 204)
})

export { epicRoutes }
