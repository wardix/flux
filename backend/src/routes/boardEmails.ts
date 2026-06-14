import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import * as emailService from '../services/emailService'
import { authMiddleware } from '../middleware/auth'
import { ErrorSchema } from '../lib/schemas'

export const boardEmailsRoutes = new OpenAPIHono()

boardEmailsRoutes.use('/*', authMiddleware)

const BoardEmailSchema = z.object({
  id: z.number(),
  board_id: z.number(),
  target_list_id: z.number(),
  email_address: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

boardEmailsRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Board Emails'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Get board emails',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(BoardEmailSchema),
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    const boardId = Number(c.req.param('boardId'))
    const emails = await emailService.getBoardEmails(boardId)
    return c.json({ data: emails }, 200)
  }
)

boardEmailsRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Board Emails'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              target_list_id: z.number(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Create board email',
        content: {
          'application/json': {
            schema: z.object({
              data: BoardEmailSchema,
            }),
          },
        },
      },
      400: {
        description: 'Bad Request',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const boardId = Number(c.req.param('boardId'))
    const { target_list_id } = await c.req.json()
    if (!target_list_id) return c.json({ error: 'target_list_id is required' }, 400)
    
    const email = await emailService.createBoardEmail(boardId, target_list_id)
    return c.json({ data: email }, 201)
  }
)

boardEmailsRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['Board Emails'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string(),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              is_active: z.boolean(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Update board email',
        content: {
          'application/json': {
            schema: z.object({
              data: BoardEmailSchema,
            }),
          },
        },
      },
      404: {
        description: 'Not Found',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const boardId = Number(c.req.param('boardId'))
    const id = Number(c.req.param('id'))
    const { is_active } = await c.req.json()
    
    const updated = await emailService.updateBoardEmail(id, boardId, is_active)
    if (!updated) return c.json({ error: 'Email not found' }, 404)
    return c.json({ data: updated }, 200)
  }
)

boardEmailsRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Board Emails'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      200: {
        description: 'Delete board email',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
      },
      404: {
        description: 'Not Found',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const boardId = Number(c.req.param('boardId'))
    const id = Number(c.req.param('id'))
    
    const success = await emailService.deleteBoardEmail(id, boardId)
    if (!success) return c.json({ error: 'Email not found' }, 404)
    return c.json({ success: true }, 200)
  }
)
