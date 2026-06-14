import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { db } from '../db'
import { authMiddleware } from '../middleware/auth'
import { ErrorSchema } from '../lib/schemas'
import * as aiService from '../services/aiService'

const aiRoutes = new OpenAPIHono()

// Apply authentication middleware to all AI routes
aiRoutes.use('*', authMiddleware)

// 1. POST /api/ai/suggest-labels
const suggestLabelsRoute = createRoute({
  method: 'post',
  path: '/suggest-labels',
  tags: ['AI'],
  summary: 'Suggest labels for a card',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            card_id: z.number().optional().openapi({ example: 1 }),
            title: z.string().openapi({ example: 'Fix login button not responding on mobile' }),
            description: z.string().optional().openapi({ example: 'The login button on mobile Safari...' }),
            available_labels: z.array(
              z.object({
                id: z.number().openapi({ example: 1 }),
                name: z.string().openapi({ example: 'bug' }),
                color: z.string().openapi({ example: '#FF0000' }),
              })
            ),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Suggested labels',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              suggested_labels: z.array(
                z.object({
                  id: z.number(),
                  name: z.string(),
                  confidence: z.number(),
                })
              ),
              reasoning: z.string(),
            }),
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
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    503: {
      description: 'AI service unavailable',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

aiRoutes.openapi(suggestLabelsRoute, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    if (!body.title) {
      return c.json({ error: 'Title is required for AI suggestion' }, 400)
    }
    const availableLabels = body.available_labels || []

    const result = await aiService.suggestLabels(
      body.title,
      body.description || '',
      availableLabels
    )
    return c.json({ data: result }, 200)
  } catch (error: any) {
    if (error.message && error.message.includes('OpenAI API key is not configured')) {
      return c.json({ error: 'AI service unavailable. Please try again later.' }, 503)
    }
    const message = error.message || 'AI service unavailable. Please try again later.'
    return c.json({ error: message }, 503)
  }
})

// 2. POST /api/ai/summarize
const summarizeRoute = createRoute({
  method: 'post',
  path: '/summarize',
  tags: ['AI'],
  summary: 'Summarize card content, comments, and activities',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            card_id: z.number().openapi({ example: 1 }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Card summary',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              summary: z.string(),
              key_points: z.array(z.string()),
            }),
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
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
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
    503: {
      description: 'AI service unavailable',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

aiRoutes.openapi(summarizeRoute, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    if (!body.card_id) {
      return c.json({ error: 'Card ID is required' }, 400)
    }

    const cardId = Number(body.card_id)
    const cards = await db`SELECT title, description FROM cards WHERE id = ${cardId} AND deleted_at IS NULL`
    if (cards.length === 0) {
      return c.json({ error: 'Card not found' }, 404)
    }
    const card = cards[0]

    const comments = await db`SELECT content FROM comments WHERE card_id = ${cardId}`
    const activities = await db`SELECT action, details FROM activity_logs WHERE card_id = ${cardId}`

    const result = await aiService.summarizeCard({
      title: card.title,
      description: card.description,
      comments: comments.map((c) => ({ text: c.content })),
      activities: activities.map((a) => ({ action: a.action, details: a.details })),
    })

    return c.json({ data: result }, 200)
  } catch (error: any) {
    if (error.message && error.message.includes('OpenAI API key is not configured')) {
      return c.json({ error: 'AI service unavailable. Please try again later.' }, 503)
    }
    const message = error.message || 'AI service unavailable. Please try again later.'
    return c.json({ error: message }, 503)
  }
})

// 3. POST /api/ai/suggest-assignee
const suggestAssigneeRoute = createRoute({
  method: 'post',
  path: '/suggest-assignee',
  tags: ['AI'],
  summary: 'Suggest assignee based on history and workload',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            card_id: z.number().optional().openapi({ example: 1 }),
            board_id: z.number().optional().openapi({ example: 1 }),
            title: z.string().openapi({ example: 'Fix login button not responding on mobile' }),
            description: z.string().optional().openapi({ example: 'The login button on mobile Safari...' }),
            available_members: z.array(
              z.object({
                id: z.number().openapi({ example: 1 }),
                name: z.string().openapi({ example: 'John' }),
                recent_cards: z.number().optional().openapi({ example: 5 }),
              })
            ),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Suggested assignees',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              suggested_assignees: z.array(
                z.object({
                  id: z.number(),
                  name: z.string(),
                  confidence: z.number(),
                  reason: z.string(),
                })
              ),
            }),
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
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    503: {
      description: 'AI service unavailable',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

aiRoutes.openapi(suggestAssigneeRoute, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    if (!body.title) {
      return c.json({ error: 'Title is required' }, 400)
    }

    const members = body.available_members || []
    const result = await aiService.suggestAssignee({
      title: body.title,
      description: body.description || '',
      members,
    })

    return c.json({ data: result }, 200)
  } catch (error: any) {
    if (error.message && error.message.includes('OpenAI API key is not configured')) {
      return c.json({ error: 'AI service unavailable. Please try again later.' }, 503)
    }
    const message = error.message || 'AI service unavailable. Please try again later.'
    return c.json({ error: message }, 503)
  }
})

export { aiRoutes }
