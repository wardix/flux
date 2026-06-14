import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as customFieldService from '../services/customFieldService'

const boardCustomFieldRoutes = new OpenAPIHono()
boardCustomFieldRoutes.use('*', authMiddleware)

const createFieldRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Custom Fields'],
  summary: 'Create custom field for board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string(),
            field_type: z.string(),
            options: z.any().optional(),
            is_required: z.boolean().optional(),
            position: z.number().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Field created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Validation failed',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    409: {
      description: 'Duplicate name',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const getFieldsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Custom Fields'],
  summary: 'Get custom fields for board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Fields retrieved successfully',
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

const deleteFieldRoute = createRoute({
  method: 'delete',
  path: '/{fieldId}',
  tags: ['Custom Fields'],
  summary: 'Delete custom field',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
      fieldId: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Field deleted successfully',
    },
  },
})

boardCustomFieldRoutes.openapi(createFieldRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid board ID' }, 400)

  const body = await c.req.json()
  try {
    const field = await customFieldService.createField(boardId, body)
    return c.json({ data: field }, 201)
  } catch (err: any) {
    const status = err.status || 500
    return c.json({ error: err.message }, status)
  }
})

boardCustomFieldRoutes.openapi(getFieldsRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid board ID' }, 400)

  const fields = await customFieldService.getFieldsByBoard(boardId)
  return c.json({ data: fields }, 200)
})

boardCustomFieldRoutes.openapi(deleteFieldRoute, async (c) => {
  const fieldId = Number(c.req.param('fieldId'))
  if (Number.isNaN(fieldId)) return c.json({ error: 'Invalid field ID' }, 400)

  await customFieldService.deleteField(fieldId)
  return c.body(null, 204)
})

const cardCustomFieldRoutes = new OpenAPIHono()
cardCustomFieldRoutes.use('*', authMiddleware)

const getCardValuesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Custom Field Values'],
  summary: 'Get card custom field values',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Values retrieved successfully',
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

const setCardValuesRoute = createRoute({
  method: 'put',
  path: '/',
  tags: ['Custom Field Values'],
  summary: 'Set card custom field values',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            values: z.array(
              z.object({
                field_id: z.number(),
                value: z.string().nullable(),
              }),
            ),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Values updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              success: z.boolean(),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

cardCustomFieldRoutes.openapi(getCardValuesRoute, async (c) => {
  const cardId = Number(c.req.param('cardId'))
  if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)

  const values = await customFieldService.getCardValues(cardId)
  return c.json({ data: values }, 200)
})

cardCustomFieldRoutes.openapi(setCardValuesRoute, async (c) => {
  const cardId = Number(c.req.param('cardId'))
  if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)

  const body = await c.req.json()
  try {
    await customFieldService.setCardValues(cardId, body.values)
    return c.json({ data: { success: true } }, 200)
  } catch (err: any) {
    const status = err.status || 500
    return c.json({ error: err.message }, status)
  }
})

export { boardCustomFieldRoutes, cardCustomFieldRoutes }
