import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as dependencyService from '../services/dependencyService'

const dependencyRoutes = new OpenAPIHono()

const getDependenciesRoute = createRoute({
  method: 'get',
  path: '/cards/{id}/dependencies',
  tags: ['Cards'],
  summary: 'Get card dependencies',
  description: 'Get blocking and blocked by dependencies for a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Dependencies list',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
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

const createDependencyRoute = createRoute({
  method: 'post',
  path: '/cards/{id}/dependencies',
  tags: ['Cards'],
  summary: 'Create dependency',
  description: 'Set a card to block another card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            blocked_card_id: z.number().openapi({ example: 2 }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Dependency created',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Invalid parameters or circular dependency',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    409: {
      description: 'Duplicate dependency',
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

const deleteDependencyRoute = createRoute({
  method: 'delete',
  path: '/cards/{id}/dependencies/{depId}',
  tags: ['Cards'],
  summary: 'Remove dependency',
  description: 'Remove a card dependency',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
      depId: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    204: {
      description: 'Dependency removed',
    },
    404: {
      description: 'Dependency not found',
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

dependencyRoutes.use('/cards/*', authMiddleware)

dependencyRoutes.openapi(getDependenciesRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    // Normally we should check if card exists, but tests say "404 for non-existent card"
    // So let's check card existence
    const { db } = require('../db')
    const cards = await db`SELECT id FROM cards WHERE id = ${cardId}`
    if (cards.length === 0) {
      return c.json({ error: 'Card not found' }, 404)
    }

    const data = await dependencyService.getDependencies(cardId)
    return c.json({ data }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

dependencyRoutes.openapi(createDependencyRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    const body = await c.req.json()
    const result = await dependencyService.createDependency(cardId, body.blocked_card_id)
    return c.json({ data: result }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    if (message === 'SELF_DEPENDENCY' || message === 'CIRCULAR_DEPENDENCY') {
      return c.json({ error: message }, 400)
    }
    if (message === 'DUPLICATE_DEPENDENCY') {
      return c.json({ error: message }, 409)
    }
    return c.json({ error: message }, 500)
  }
})

dependencyRoutes.openapi(deleteDependencyRoute, async (c) => {
  try {
    const depId = Number(c.req.param('depId'))
    const result = await dependencyService.removeDependency(depId)
    if (!result) return c.json({ error: 'Dependency not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

export { dependencyRoutes }
