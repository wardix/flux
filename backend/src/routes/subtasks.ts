import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as subtaskService from '../services/subtaskService'
import { ErrorSchema } from '../lib/schemas'

const subtaskRoutes = new OpenAPIHono()

const getSubtasksRoute = createRoute({
  method: 'get',
  path: '/cards/{id}/subtasks',
  tags: ['Cards'],
  summary: 'Get subtasks of a card',
  description: 'Get all subtasks under a parent card along with total and completed counts',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Subtasks and count details',
      content: {
        'application/json': {
          schema: z.object({
            subtasks: z.array(z.any()),
            totalCount: z.number().openapi({ example: 3 }),
            completedCount: z.number().openapi({ example: 1 }),
          }),
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

const createSubtaskRoute = createRoute({
  method: 'post',
  path: '/cards/{id}/subtasks',
  tags: ['Cards'],
  summary: 'Create subtask',
  description: 'Create a new subtask (nesting depth 1) under a parent card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).openapi({ example: 'Subtask title' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Subtask created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Nesting depth exceeded or missing title',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Parent card not found',
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

const updateSubtaskRoute = createRoute({
  method: 'put',
  path: '/cards/{cardId}/subtasks/{subtaskId}',
  tags: ['Cards'],
  summary: 'Update subtask',
  description: 'Update the title or completion status of a subtask',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string().openapi({ example: '1' }),
      subtaskId: z.string().openapi({ example: '2' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().optional().openapi({ example: 'Updated subtask title' }),
            is_completed: z.boolean().optional().openapi({ example: true }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Subtask updated successfully',
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
      description: 'Subtask not found',
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

const deleteSubtaskRoute = createRoute({
  method: 'delete',
  path: '/cards/{cardId}/subtasks/{subtaskId}',
  tags: ['Cards'],
  summary: 'Delete subtask',
  description: 'Delete a subtask by its ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string().openapi({ example: '1' }),
      subtaskId: z.string().openapi({ example: '2' }),
    }),
  },
  responses: {
    204: {
      description: 'Subtask deleted successfully (no content)',
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
      description: 'Subtask not found',
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

subtaskRoutes.use('*', authMiddleware)

subtaskRoutes.openapi(getSubtasksRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid card ID' }, 400)

    const result = await subtaskService.getSubtasks(id)
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

subtaskRoutes.openapi(createSubtaskRoute, async (c) => {
  try {
    const parentCardId = Number(c.req.param('id'))
    if (Number.isNaN(parentCardId)) return c.json({ error: 'Invalid card ID' }, 400)

    const body = await c.req.json()
    if (!body.title) return c.json({ error: 'Title is required' }, 400)

    const subtask = await subtaskService.createSubtask(parentCardId, body)
    return c.json({ data: subtask }, 201)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return c.json({ error: 'Parent card not found' }, 404)
      }
      if (error.message === 'NESTING_DEPTH_EXCEEDED') {
        return c.json({ error: 'Cannot nest subtasks deeper than nesting depth 1' }, 400)
      }
      return c.json({ error: error.message }, 500)
    }
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

subtaskRoutes.openapi(updateSubtaskRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    const subtaskId = Number(c.req.param('subtaskId'))
    if (Number.isNaN(cardId) || Number.isNaN(subtaskId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }

    const body = await c.req.json()
    const result = await subtaskService.updateSubtask(cardId, subtaskId, body)
    if (!result) return c.json({ error: 'Subtask not found' }, 404)

    return c.json({ data: result }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

subtaskRoutes.openapi(deleteSubtaskRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    const subtaskId = Number(c.req.param('subtaskId'))
    if (Number.isNaN(cardId) || Number.isNaN(subtaskId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }

    const result = await subtaskService.removeSubtask(cardId, subtaskId)
    if (!result) return c.json({ error: 'Subtask not found' }, 404)

    return c.body(null, 204)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

export { subtaskRoutes }
