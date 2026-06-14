import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { BoardSchema, ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as templateService from '../services/boardTemplateService'

const boardTemplateRoutes = new OpenAPIHono()
boardTemplateRoutes.use('*', authMiddleware)

const getTemplatesRoute = createRoute({
  method: 'get',
  path: '/templates',
  tags: ['Board Templates'],
  summary: 'List available board templates',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of templates',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              z.object({
                key: z.string(),
                title: z.string(),
                description: z.string(),
                lists: z.array(z.string()),
              }),
            ),
          }),
        },
      },
    },
  },
})

const createFromTemplateRoute = createRoute({
  method: 'post',
  path: '/templates/create',
  tags: ['Board Templates'],
  summary: 'Create a board from a template',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            template_key: z.string().openapi({ example: 'agile' }),
            workspace_id: z.number().openapi({ example: 1 }),
            title: z.string().openapi({ example: 'Sprint 2026' }),
          }),
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
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const cloneBoardRoute = createRoute({
  method: 'post',
  path: '/{id}/clone',
  tags: ['Board Templates'],
  summary: 'Clone an existing board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            workspace_id: z.number().openapi({ example: 1 }),
            title: z.string().optional().openapi({ example: 'My Cloned Board' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Board cloned successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: BoardSchema,
          }),
        },
      },
    },
  },
})

boardTemplateRoutes.openapi(getTemplatesRoute, async (c) => {
  return c.json({ data: templateService.templates }, 200)
})

boardTemplateRoutes.openapi(createFromTemplateRoute, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const { template_key, workspace_id, title } = body

  if (!template_key || !workspace_id || !title) {
    return c.json({ error: 'template_key, workspace_id and title are required' }, 400)
  }

  try {
    const board = await templateService.createBoardFromTemplate(
      template_key,
      workspace_id,
      title,
      userId,
    )
    return c.json({ data: board }, 201)
  } catch (err: any) {
    const status = err.status || 500
    return c.json({ error: err.message }, status)
  }
})

boardTemplateRoutes.openapi(cloneBoardRoute, async (c) => {
  const userId = c.get('userId')
  const boardId = Number(c.req.param('id'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json()
  const { workspace_id, title } = body

  if (!workspace_id) {
    return c.json({ error: 'workspace_id is required' }, 400)
  }

  try {
    const board = await templateService.cloneBoard(boardId, workspace_id, userId, title)
    return c.json({ data: board }, 201)
  } catch (err: any) {
    const status = err.status || 500
    return c.json({ error: err.message }, status)
  }
})

export { boardTemplateRoutes }
