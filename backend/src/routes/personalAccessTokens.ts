import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as patService from '../services/personalAccessService'

const personalAccessRoutes = new OpenAPIHono()
personalAccessRoutes.use('*', authMiddleware)

const createPATRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Personal Access Tokens'],
  summary: 'Create a personal access token',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(255).openapi({ example: 'My Token' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Personal Access Token created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              id: z.number(),
              user_id: z.number(),
              name: z.string(),
              token: z.string(),
              created_at: z.any(),
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

const listPATsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Personal Access Tokens'],
  summary: 'List personal access tokens',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of personal access tokens',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              z.object({
                id: z.number(),
                user_id: z.number(),
                name: z.string(),
                token: z.string(),
                created_at: z.any(),
              }),
            ),
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

const deletePATRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Personal Access Tokens'],
  summary: 'Delete a personal access token',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Token deleted successfully',
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Token not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

personalAccessRoutes.openapi(createPATRoute, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const pat = await patService.createPAT(userId, body.name)
  return c.json({ data: pat }, 201)
})

personalAccessRoutes.openapi(listPATsRoute, async (c) => {
  const userId = c.get('userId')
  const pats = await patService.listPATs(userId)
  return c.json({ data: pats }, 200)
})

personalAccessRoutes.openapi(deletePATRoute, async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const success = await patService.deletePAT(userId, id)
  if (!success) return c.json({ error: 'Token not found' }, 404)
  return c.body(null, 204)
})

export { personalAccessRoutes }
