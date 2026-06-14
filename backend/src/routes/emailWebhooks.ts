import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { webhookAuthMiddleware } from '../middleware/webhookAuth'
import * as emailService from '../services/emailService'
import { ErrorSchema } from '../lib/schemas'

export const emailWebhooksRoutes = new OpenAPIHono()

emailWebhooksRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/email',
    tags: ['Webhooks'],
    summary: 'Process inbound email',
    description: 'Webhook endpoint for SendGrid/Mailgun to process inbound emails',
    middleware: [webhookAuthMiddleware] as any,
    request: {},
    responses: {
      200: {
        description: 'Email processed successfully',
        content: {
          'application/json': {
            schema: z.object({
              data: z.object({
                card_id: z.number(),
                status: z.string(),
              }),
            }),
          },
        },
      },
      403: {
        description: 'Invalid webhook secret',
        content: { 'application/json': { schema: ErrorSchema } },
      },
      404: {
        description: 'Email address not found or inactive',
        content: { 'application/json': { schema: ErrorSchema } },
      },
      500: {
        description: 'Internal Server Error',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    try {
      const formData = await c.req.formData()
      const cardId = await emailService.processInboundEmail(formData)
      return c.json({ data: { card_id: cardId, status: 'created' } }, 200)
    } catch (error: any) {
      if (error.message === 'Email address not found or inactive') {
        return c.json({ error: error.message }, 404)
      }
      return c.json({ error: error.message || 'Internal Server Error' }, 500)
    }
  }
)
