import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as formService from '../services/publicFormService'

const formRoutes = new OpenAPIHono()

// Private endpoints (requires authorization)
const upsertFormRoute = createRoute({
  method: 'post',
  path: '/boards/{boardId}/form',
  tags: ['Public Forms'],
  summary: 'Configure public form for a board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).max(255).openapi({ example: 'Feedback Form' }),
            description: z.string().nullable().optional(),
            is_active: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Form configured successfully',
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

const getFormConfigRoute = createRoute({
  method: 'get',
  path: '/boards/{boardId}/form',
  tags: ['Public Forms'],
  summary: 'Get public form config for board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Form config',
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

// Public endpoints (no authentication middleware)
const getPublicFormRoute = createRoute({
  method: 'get',
  path: '/public-forms/{id}',
  tags: ['Public Forms'],
  summary: 'Get public form info',
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Form details',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    404: {
      description: 'Form not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const submitPublicFormRoute = createRoute({
  method: 'post',
  path: '/public-forms/{id}/submit',
  tags: ['Public Forms'],
  summary: 'Submit a card through public form',
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).max(500).openapi({ example: 'Reported Issue' }),
            description: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Card submitted successfully',
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

// Setup a separate sub-router for board form settings that runs authMiddleware
const boardFormRoutes = new OpenAPIHono()
boardFormRoutes.use('*', authMiddleware)

boardFormRoutes.openapi(upsertFormRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid board ID' }, 400)

  const body = await c.req.json()
  const form = await formService.createOrUpdateForm(
    boardId,
    body.title,
    body.description,
    body.is_active,
  )
  return c.json({ data: form }, 200)
})

boardFormRoutes.openapi(getFormConfigRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid board ID' }, 400)

  const form = await formService.getFormByBoard(boardId)
  return c.json({ data: form }, 200)
})

// Register public endpoints on formRoutes
formRoutes.openapi(getPublicFormRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const form = await formService.getFormById(id)
  if (!form || !form.is_active) return c.json({ error: 'Form not found or is inactive' }, 404)
  return c.json({ data: form }, 200)
})

formRoutes.openapi(submitPublicFormRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json()
  try {
    const card = await formService.submitFormCard(id, body.title, body.description)
    return c.json({ data: card }, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

// Merge them
formRoutes.route('/', boardFormRoutes)

export { formRoutes }
