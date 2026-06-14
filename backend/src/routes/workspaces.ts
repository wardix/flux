import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { BoardSchema, ErrorSchema, WorkspaceMemberSchema, WorkspaceSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as workspaceService from '../services/workspaceService'

const workspaceRoutes = new OpenAPIHono()

const listWorkspacesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Workspaces'],
  summary: 'List user workspaces',
  description: 'Get all workspaces that the authenticated user is a member of',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of workspaces',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(WorkspaceSchema),
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

const createWorkspaceRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Workspaces'],
  summary: 'Create workspace',
  description: 'Create a new workspace with the authenticated user as owner',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).openapi({ example: 'My Workspace' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Workspace created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: WorkspaceSchema,
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

const getWorkspaceMembersRoute = createRoute({
  method: 'get',
  path: '/{id}/members',
  tags: ['Members'],
  summary: 'Get workspace members',
  description: 'Get all members of a specific workspace',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'List of workspace members',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              WorkspaceMemberSchema.extend({
                email: z.string().email().openapi({ example: 'member@example.com' }),
                avatar_url: z.string().nullable().openapi({ example: null }),
              }),
            ),
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

const inviteWorkspaceMemberRoute = createRoute({
  method: 'post',
  path: '/{id}/members',
  tags: ['Members'],
  summary: 'Invite member to workspace',
  description: 'Invite a user to join a workspace by their email address',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email().openapi({ example: 'newmember@example.com' }),
            role: z.string().optional().openapi({ example: 'member' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Member invited successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: WorkspaceMemberSchema,
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
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    409: {
      description: 'User is already a member',
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

const getWorkspaceTrashRoute = createRoute({
  method: 'get',
  path: '/{id}/trash',
  tags: ['Workspaces'],
  summary: 'Get workspace trashed boards',
  description: 'Get all soft-deleted boards for a specific workspace',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Trashed boards',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              boards: z.array(BoardSchema),
            }),
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

workspaceRoutes.use('*', authMiddleware)

workspaceRoutes.openapi(listWorkspacesRoute, async (c) => {
  const userId = c.get('userId')
  const list = await workspaceService.getAllForUser(userId)
  return c.json({ data: list }, 200)
})

workspaceRoutes.openapi(createWorkspaceRoute, async (c) => {
  try {
    const body = await c.req.json()
    if (!body.name) return c.json({ error: 'Name is required' }, 400)

    const userId = c.get('userId')
    const workspace = await workspaceService.create(userId, body.name)
    return c.json({ data: workspace }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

workspaceRoutes.openapi(getWorkspaceMembersRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const members = await workspaceService.getMembers(id)
  return c.json({ data: members }, 200)
})

workspaceRoutes.openapi(inviteWorkspaceMemberRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const body = await c.req.json()
    if (!body.email) return c.json({ error: 'Email is required' }, 400)

    const member = await workspaceService.inviteMember(id, body.email, body.role || 'member')
    return c.json({ data: member }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    if (message === 'User with this email does not exist') {
      return c.json({ error: message }, 404)
    }
    if (message === 'User is already a member of this workspace') {
      return c.json({ error: message }, 409)
    }
    return c.json({ error: message }, 500)
  }
})

workspaceRoutes.openapi(getWorkspaceTrashRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const { db } = await import('../db')
  const boards =
    await db`SELECT * FROM boards WHERE workspace_id = ${id} AND deleted_at IS NOT NULL`
  return c.json({ data: { boards } }, 200)
})

export { workspaceRoutes }
