import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as webhookService from '../services/webhookService'

const webhookRoutes = new OpenAPIHono()
webhookRoutes.use('*', authMiddleware)

const createWebhookRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Webhooks'],
  summary: 'Create a webhook',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            url: z.string().url().openapi({ example: 'https://example.com/webhook' }),
            secret: z.string().optional().openapi({ example: 'my-webhook-secret' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Webhook created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              id: z.number(),
              board_id: z.number(),
              url: z.string(),
              secret: z.string().nullable(),
              is_active: z.boolean(),
              created_at: z.any(),
            }),
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

const listWebhooksRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Webhooks'],
  summary: 'List webhooks for board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'List of webhooks',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              z.object({
                id: z.number(),
                board_id: z.number(),
                url: z.string(),
                secret: z.string().nullable(),
                is_active: z.boolean(),
                created_at: z.any(),
              }),
            ),
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

const deleteWebhookRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Webhooks'],
  summary: 'Delete a webhook',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
      id: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Webhook deleted successfully',
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Webhook not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

webhookRoutes.openapi(createWebhookRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid board ID' }, 400)
  const body = await c.req.json()
  const webhook = await webhookService.createWebhook(boardId, body.url, body.secret)
  return c.json({ data: webhook }, 201)
})

webhookRoutes.openapi(listWebhooksRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid board ID' }, 400)
  const webhooks = await webhookService.listWebhooks(boardId)
  return c.json({ data: webhooks }, 200)
})

webhookRoutes.openapi(deleteWebhookRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  const id = Number(c.req.param('id'))
  if (Number.isNaN(boardId) || Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const success = await webhookService.deleteWebhook(boardId, id)
  if (!success) return c.json({ error: 'Webhook not found' }, 404)
  return c.body(null, 204)
})

export { webhookRoutes }
