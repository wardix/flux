import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as voteService from '../services/voteService'
import { ErrorSchema } from '../lib/schemas'

const voteRoutes = new OpenAPIHono()

const VoteToggleResponseSchema = z.object({
  voted: z.boolean(),
  vote_count: z.number(),
  user_voted: z.boolean(),
})

const VoterSchema = z.object({
  id: z.number(),
  name: z.string(),
  avatar_url: z.string().nullable(),
  voted_at: z.string(),
})

const VoteDetailsResponseSchema = z.object({
  vote_count: z.number(),
  user_voted: z.boolean(),
  voters: z.array(VoterSchema),
})

const toggleVoteRoute = createRoute({
  method: 'post',
  path: '/cards/{id}/vote',
  tags: ['Votes'],
  summary: 'Toggle vote on card',
  description: 'Add or remove a vote on a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Vote toggled successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: VoteToggleResponseSchema,
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
  },
})

const getCardVotesRoute = createRoute({
  method: 'get',
  path: '/cards/{id}/votes',
  tags: ['Votes'],
  summary: 'Get card vote details',
  description: 'Get total vote count, user voted status, and list of voters',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Vote details retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: VoteDetailsResponseSchema,
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

voteRoutes.use('/cards/*', authMiddleware)

voteRoutes.openapi(toggleVoteRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid ID' }, 400)
    const userId = c.get('userId')

    const result = await voteService.toggleVote(cardId, userId)
    return c.json({ data: result }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    if (message.includes('not found') || message.includes('Card not found')) {
      return c.json({ error: message }, 404)
    }
    return c.json({ error: message }, 500)
  }
})

voteRoutes.openapi(getCardVotesRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid ID' }, 400)
    const userId = c.get('userId')

    const result = await voteService.getVotes(cardId, userId)
    return c.json({ data: result }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

export { voteRoutes }
