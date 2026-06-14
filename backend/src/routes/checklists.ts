import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as checklistService from '../services/checklistService'
import { ErrorSchema } from '../lib/schemas'

const checklistRoutes = new OpenAPIHono()

const getChecklistsRoute = createRoute({
  method: 'get',
  path: '/cards/{id}/checklists',
  tags: ['Cards'],
  summary: 'Get checklists of a card',
  description: 'Get all checklists and their items under a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'List of checklists and items',
      content: {
        'application/json': {
          schema: z.array(z.any()),
        },
      },
    },
    400: {
      description: 'Invalid card ID',
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

const createChecklistRoute = createRoute({
  method: 'post',
  path: '/cards/{id}/checklists',
  tags: ['Cards'],
  summary: 'Create checklist',
  description: 'Create a new checklist on a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).openapi({ example: 'Tasks' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Checklist created successfully',
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

const updateChecklistRoute = createRoute({
  method: 'put',
  path: '/cards/{cardId}/checklists/{checklistId}',
  tags: ['Cards'],
  summary: 'Update checklist',
  description: 'Update the title of a checklist',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string().openapi({ example: '1' }),
      checklistId: z.string().openapi({ example: '2' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).openapi({ example: 'Updated title' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Checklist updated successfully',
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
      description: 'Checklist not found',
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

const deleteChecklistRoute = createRoute({
  method: 'delete',
  path: '/cards/{cardId}/checklists/{checklistId}',
  tags: ['Cards'],
  summary: 'Delete checklist',
  description: 'Delete a checklist from a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string().openapi({ example: '1' }),
      checklistId: z.string().openapi({ example: '2' }),
    }),
  },
  responses: {
    204: {
      description: 'Checklist deleted successfully',
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
      description: 'Checklist not found',
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

const createChecklistItemRoute = createRoute({
  method: 'post',
  path: '/checklists/{checklistId}/items',
  tags: ['Cards'],
  summary: 'Create checklist item',
  description: 'Create a new checklist item under a checklist',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      checklistId: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).openapi({ example: 'Sub task' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Checklist item created successfully',
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
      description: 'Checklist not found',
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

const updateChecklistItemRoute = createRoute({
  method: 'put',
  path: '/checklists/{checklistId}/items/{itemId}',
  tags: ['Cards'],
  summary: 'Update checklist item',
  description: 'Update title, completion, or position of checklist item',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      checklistId: z.string().openapi({ example: '1' }),
      itemId: z.string().openapi({ example: '2' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().optional().openapi({ example: 'New item title' }),
            is_completed: z.boolean().optional().openapi({ example: true }),
            position: z.number().optional().openapi({ example: 1 }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Checklist item updated successfully',
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
      description: 'Checklist item not found',
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

const deleteChecklistItemRoute = createRoute({
  method: 'delete',
  path: '/checklists/{checklistId}/items/{itemId}',
  tags: ['Cards'],
  summary: 'Delete checklist item',
  description: 'Delete checklist item by its ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      checklistId: z.string().openapi({ example: '1' }),
      itemId: z.string().openapi({ example: '2' }),
    }),
  },
  responses: {
    204: {
      description: 'Checklist item deleted successfully',
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
      description: 'Checklist item not found',
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

checklistRoutes.use('/cards/*', authMiddleware)

checklistRoutes.openapi(getChecklistsRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)
    const result = await checklistService.getChecklists(cardId)
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

checklistRoutes.openapi(createChecklistRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)
    const body = await c.req.json()
    if (!body.title) return c.json({ error: 'Title is required' }, 400)
    const result = await checklistService.createChecklist(cardId, body.title)
    return c.json({ data: result }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

checklistRoutes.openapi(updateChecklistRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    const checklistId = Number(c.req.param('checklistId'))
    if (Number.isNaN(cardId) || Number.isNaN(checklistId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }
    const body = await c.req.json()
    if (!body.title) return c.json({ error: 'Title is required' }, 400)
    const result = await checklistService.updateChecklist(cardId, checklistId, body.title)
    if (!result) return c.json({ error: 'Checklist not found' }, 404)
    return c.json({ data: result }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

checklistRoutes.openapi(deleteChecklistRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    const checklistId = Number(c.req.param('checklistId'))
    if (Number.isNaN(cardId) || Number.isNaN(checklistId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }
    const result = await checklistService.deleteChecklist(cardId, checklistId)
    if (!result) return c.json({ error: 'Checklist not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

checklistRoutes.openapi(createChecklistItemRoute, async (c) => {
  try {
    const checklistId = Number(c.req.param('checklistId'))
    if (Number.isNaN(checklistId)) return c.json({ error: 'Invalid checklist ID' }, 400)
    const body = await c.req.json()
    if (!body.title) return c.json({ error: 'Title is required' }, 400)
    const result = await checklistService.createChecklistItem(checklistId, body.title)
    return c.json({ data: result }, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return c.json({ error: 'Checklist not found' }, 404)
    }
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

checklistRoutes.openapi(updateChecklistItemRoute, async (c) => {
  try {
    const checklistId = Number(c.req.param('checklistId'))
    const itemId = Number(c.req.param('itemId'))
    if (Number.isNaN(checklistId) || Number.isNaN(itemId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }
    const body = await c.req.json()
    const result = await checklistService.updateChecklistItem(checklistId, itemId, body)
    if (!result) return c.json({ error: 'Checklist item not found' }, 404)
    return c.json({ data: result }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

checklistRoutes.openapi(deleteChecklistItemRoute, async (c) => {
  try {
    const checklistId = Number(c.req.param('checklistId'))
    const itemId = Number(c.req.param('itemId'))
    if (Number.isNaN(checklistId) || Number.isNaN(itemId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }
    const result = await checklistService.deleteChecklistItem(checklistId, itemId)
    if (!result) return c.json({ error: 'Checklist item not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

export { checklistRoutes }
