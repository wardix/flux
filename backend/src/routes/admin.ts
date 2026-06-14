import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import { superAdminMiddleware } from '../middleware/superAdmin'
import * as adminService from '../services/adminService'
import { ErrorSchema } from '../lib/schemas'

const adminRoutes = new OpenAPIHono()

adminRoutes.use('/admin/*', authMiddleware)
adminRoutes.use('/admin/*', superAdminMiddleware())

const getUsersRoute = createRoute({
  method: 'get',
  path: '/admin/users',
  tags: ['Admin'],
  summary: 'List users (Admin only)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional().default('1'),
      per_page: z.string().optional().default('10'),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Users list retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.any()),
            meta: z.object({
              total: z.number(),
              page: z.number(),
              per_page: z.number(),
              total_pages: z.number(),
            }),
          }),
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

const updateUserRoute = createRoute({
  method: 'put',
  path: '/admin/users/{id}',
  tags: ['Admin'],
  summary: 'Update user status (Admin only)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            is_suspended: z.boolean().optional(),
            is_super_admin: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    404: {
      description: 'User not found',
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
  },
})

adminRoutes.openapi(getUsersRoute, async (c) => {
  const page = Number(c.req.query('page') || '1')
  const perPage = Number(c.req.query('per_page') || '10')
  const search = c.req.query('search')

  const result = await adminService.getUsers(page, perPage, search)
  return c.json(result, 200)
})

adminRoutes.openapi(updateUserRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid user ID' }, 400)

  const body = await c.req.json()
  const user = await adminService.updateUser(id, body)
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ data: user }, 200)
})

export { adminRoutes }
