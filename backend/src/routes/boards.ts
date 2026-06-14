import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { BoardSchema, CreateBoardRequest, ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as boardService from '../services/boardService'
import * as cardService from '../services/cardService'

const boardRoutes = new OpenAPIHono()

const listBoardsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Boards'],
  summary: 'List all boards',
  description: 'Get all boards accessible by the authenticated user',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of boards',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(BoardSchema),
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

const getBoardByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Boards'],
  summary: 'Get board details by ID',
  description: 'Get detailed information about a specific board including its lists and cards',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    query: z.object({
      sort: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Board details retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: BoardSchema.extend({
              lists: z.array(z.any()).optional(), // Detailed board info contains lists & cards
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
    404: {
      description: 'Board not found',
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

const createBoardRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Boards'],
  summary: 'Create a new board',
  description: 'Create a new project board in the specified workspace',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateBoardRequest,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Board created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: BoardSchema,
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

const updateBoardRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Boards'],
  summary: 'Update board details',
  description: 'Update the title, background, visibility, or other details of an existing board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().optional().openapi({ example: 'New Title' }),
            background: z.string().optional().openapi({ example: 'green' }),
            bg_image_url: z.string().nullable().optional().openapi({ example: 'https://example.com/bg.png' }),
            bg_color: z.string().nullable().optional().openapi({ example: '#ff0000' }),
            visibility: z.string().optional().openapi({ example: 'public' }),
            deleted_at: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Board updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: BoardSchema,
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
    404: {
      description: 'Board not found',
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

const getBoardArchiveRoute = createRoute({
  method: 'get',
  path: '/{id}/archive',
  tags: ['Boards'],
  summary: 'Get board archived items',
  description: 'Get all archived lists and cards for a specific board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Archived lists and cards',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              lists: z.array(z.any()),
              cards: z.array(z.any()),
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

const getBoardTrashRoute = createRoute({
  method: 'get',
  path: '/{id}/trash',
  tags: ['Boards'],
  summary: 'Get board trashed items',
  description: 'Get all soft-deleted lists and cards for a specific board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Trashed lists and cards',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              lists: z.array(z.any()),
              cards: z.array(z.any()),
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

const deleteBoardRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Boards'],
  summary: 'Delete board',
  description: 'Soft-delete or permanently delete a board by its ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    query: z.object({
      permanent: z.string().optional().openapi({ example: 'true' }),
    }),
  },
  responses: {
    204: {
      description: 'Board deleted successfully (no content)',
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
      description: 'Board not found',
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

// Apply authentication middleware to all sub-routes
boardRoutes.use('*', authMiddleware)

// Register route handlers
boardRoutes.openapi(listBoardsRoute, async (c) => {
  const userId = c.get('userId')
  const boards = await boardService.getAll(userId)
  return c.json({ data: boards }, 200)
})

boardRoutes.openapi(getBoardByIdRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const userId = c.get('userId')
  const sort = c.req.query('sort')
  const board = await boardService.getById(id, userId, sort)
  if (!board) return c.json({ error: 'Board not found' }, 404)

  return c.json({ data: board }, 200)
})

boardRoutes.openapi(createBoardRoute, async (c) => {
  try {
    const body = await c.req.json()
    if (!body.title) return c.json({ error: 'Title is required' }, 400)

    const userId = c.get('userId')
    const board = await boardService.create(userId, body)
    return c.json({ data: board }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

boardRoutes.openapi(updateBoardRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const body = await c.req.json()
    const board = await boardService.update(id, body)
    if (!board) return c.json({ error: 'Board not found' }, 404)

    return c.json({ data: board }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

boardRoutes.openapi(getBoardArchiveRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const { db } = await import('../db')
  const lists =
    await db`SELECT * FROM lists WHERE board_id = ${id} AND archived_at IS NOT NULL AND deleted_at IS NULL`
  const cards = await db`
    SELECT c.* FROM cards c
    JOIN lists l ON c.list_id = l.id
    WHERE l.board_id = ${id} AND c.archived_at IS NOT NULL AND c.deleted_at IS NULL
  `
  return c.json({ data: { lists, cards } }, 200)
})

boardRoutes.openapi(getBoardTrashRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const { db } = await import('../db')
  const lists = await db`SELECT * FROM lists WHERE board_id = ${id} AND deleted_at IS NOT NULL`
  const cards = await db`
    SELECT c.* FROM cards c
    JOIN lists l ON c.list_id = l.id
    WHERE l.board_id = ${id} AND c.deleted_at IS NOT NULL
  `
  return c.json({ data: { lists, cards } }, 200)
})

boardRoutes.openapi(deleteBoardRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const permanent = c.req.query('permanent') === 'true'
  const board = permanent
    ? await boardService.remove(id)
    : await boardService.update(id, { deleted_at: new Date().toISOString() })
  if (!board) return c.json({ error: 'Board not found' }, 404)

  return c.body(null, 204)
})

const getBoardMembersRoute = createRoute({
  method: 'get',
  path: '/{id}/members',
  tags: ['Boards'],
  summary: 'Get board members',
  description: 'Get list of users invited to this board along with their roles',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'List of members',
      content: {
        'application/json': {
          schema: z.array(z.any()),
        },
      },
    },
    400: {
      description: 'Invalid parameters',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const addBoardMemberRoute = createRoute({
  method: 'post',
  path: '/{id}/members',
  tags: ['Boards'],
  summary: 'Invite or update member on board',
  description: 'Add a user to a board by email and assign role (admin, observer, member)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email().openapi({ example: 'collab@example.com' }),
            role: z.enum(['admin', 'observer', 'member']).openapi({ example: 'observer' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Member added or updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Invalid parameters',
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
  },
})

const getBoardRoleRoute = createRoute({
  method: 'get',
  path: '/{id}/role',
  tags: ['Boards'],
  summary: 'Get user role on board',
  description: 'Check role of current logged-in user on a board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'User role',
      content: {
        'application/json': {
          schema: z.object({
            role: z.string().nullable().openapi({ example: 'observer' }),
          }),
        },
      },
    },
  },
})

boardRoutes.openapi(getBoardMembersRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
    const members = await boardService.getBoardMembers(id)
    return c.json(members, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

boardRoutes.openapi(addBoardMemberRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
    const body = await c.req.json()
    if (!body.email || !body.role) {
      return c.json({ error: 'Email and role are required' }, 400)
    }
    const member = await boardService.addBoardMember(id, body.email, body.role)
    return c.json({ data: member }, 200)
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return c.json({ error: 'User with this email not found' }, 404)
    }
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

boardRoutes.openapi(getBoardRoleRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
    const userId = c.get('userId')
    const role = await boardService.getBoardRole(id, userId)
    return c.json({ role }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

const starBoardRoute = createRoute({
  method: 'post',
  path: '/{id}/star',
  tags: ['Boards'],
  summary: 'Star a board',
  description: 'Add a board to user favorites',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Board starred successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
  },
})

const unstarBoardRoute = createRoute({
  method: 'delete',
  path: '/{id}/star',
  tags: ['Boards'],
  summary: 'Unstar a board',
  description: 'Remove a board from user favorites',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Board unstarred successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
  },
})

boardRoutes.openapi(starBoardRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
    const userId = c.get('userId')
    await boardService.starBoard(id, userId)
    return c.json({ success: true }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

boardRoutes.openapi(unstarBoardRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
    const userId = c.get('userId')
    await boardService.unstarBoard(id, userId)
    return c.json({ success: true }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})


const getBoardMapCardsRoute = createRoute({
  method: 'get',
  path: '/{id}/cards/map',
  tags: ['Boards'],
  summary: 'Get board cards with location',
  description: 'Get all cards on the board that have latitude and longitude',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    query: z.object({
      bounds: z.string().optional().openapi({ example: '-6.3,-6.1,106.7,107.0' })
    })
  },
  responses: {
    200: {
      description: 'Cards with location',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.any()),
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

boardRoutes.openapi(getBoardMapCardsRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
    
    let bounds
    const boundsStr = c.req.query('bounds')
    if (boundsStr) {
      const parts = boundsStr.split(',').map(Number)
      if (parts.length === 4 && parts.every(p => !isNaN(p))) {
        bounds = {
          minLat: parts[0],
          maxLat: parts[1],
          minLng: parts[2],
          maxLng: parts[3]
        }
      }
    }

    const cards = await cardService.getCardsWithLocation(id, bounds)
    return c.json({ data: cards }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

export { boardRoutes }
