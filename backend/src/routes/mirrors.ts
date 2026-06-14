import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { db } from '../db'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as mirrorService from '../services/mirrorService'

const mirrorRoutes = new OpenAPIHono()

// Apply authentication middleware
mirrorRoutes.use('*', authMiddleware)

// 1. POST /api/cards/:id/mirror
const createMirrorRoute = createRoute({
  method: 'post',
  path: '/{id}/mirror',
  tags: ['Mirrors'],
  summary: 'Create card mirror',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            target_board_id: z.number().openapi({ example: 2 }),
            target_list_id: z.number().openapi({ example: 5 }),
            position: z.number().optional().default(0),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Mirror created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Bad request (e.g. mirroring to same list or invalid inputs)',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: 'No access to target board',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Card not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    409: {
      description: 'Mirror already exists',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

mirrorRoutes.openapi(createMirrorRoute, async (c) => {
  const cardId = Number(c.req.param('id'))
  if (Number.isNaN(cardId)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json()
  const { target_board_id, target_list_id, position } = body
  const userId = c.get('userId')

  // Check target board access
  const access = await db`
    SELECT 1 FROM boards b
    LEFT JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
    LEFT JOIN board_members bm ON b.id = bm.board_id
    WHERE b.id = ${target_board_id}
      AND b.deleted_at IS NULL
      AND (b.created_by = ${userId} OR wm.user_id = ${userId} OR bm.user_id = ${userId})
    LIMIT 1
  `
  if (access.length === 0) {
    return c.json({ error: 'No access to target board' }, 403)
  }

  try {
    const mirror = await mirrorService.createMirror(
      cardId,
      target_board_id,
      target_list_id,
      position || 0,
    )
    return c.json({ data: mirror }, 201)
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      return c.json({ error: 'Card not found' }, 404)
    }
    if (err.message === 'SAME_LIST') {
      return c.json({ error: 'Cannot mirror to the same list' }, 400)
    }
    if (err.message === 'ALREADY_EXISTS') {
      return c.json({ error: 'Mirror already exists on this list' }, 409)
    }
    return c.json({ error: err.message }, 500)
  }
})

// 2. GET /api/cards/:id/mirrors
const getMirrorsRoute = createRoute({
  method: 'get',
  path: '/{id}/mirrors',
  tags: ['Mirrors'],
  summary: 'Get card mirrors',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Card mirrors retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.any()),
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
  },
})

mirrorRoutes.openapi(getMirrorsRoute, async (c) => {
  const cardId = Number(c.req.param('id'))
  if (Number.isNaN(cardId)) return c.json({ error: 'Invalid ID' }, 400)

  const mirrors = await mirrorService.getMirrors(cardId)
  return c.json({ data: mirrors }, 200)
})

// 3. DELETE /api/cards/:id/mirror/:mirrorId
const deleteMirrorRoute = createRoute({
  method: 'delete',
  path: '/{id}/mirror/{mirrorId}',
  tags: ['Mirrors'],
  summary: 'Delete card mirror',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
      mirrorId: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    204: {
      description: 'Mirror deleted successfully',
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
      description: 'Mirror not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

mirrorRoutes.openapi(deleteMirrorRoute, async (c) => {
  const cardId = Number(c.req.param('id'))
  const mirrorId = Number(c.req.param('mirrorId'))
  if (Number.isNaN(cardId) || Number.isNaN(mirrorId)) {
    return c.json({ error: 'Invalid ID' }, 400)
  }

  const deleted = await mirrorService.deleteMirror(cardId, mirrorId)
  if (!deleted) {
    return c.json({ error: 'Mirror not found' }, 404)
  }

  return c.body(null, 204)
})

export { mirrorRoutes }
