import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as searchService from '../services/searchService'

const searchRoutes = new OpenAPIHono()

searchRoutes.use('*', authMiddleware)

const searchCardsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Search'],
  summary: 'Search cards with query and filters',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      q: z.string().min(2, { message: 'Query must be at least 2 characters' }),
      assignee: z.string().optional(),
      label: z.string().optional(),
      due: z.enum(['overdue', 'due_today', 'due_week', 'no_date']).optional(),
      page: z.string().optional(),
      per_page: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Search results',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              z.object({
                id: z.number(),
                title: z.string(),
                description: z.string().nullable(),
                due_date: z.string().nullable(),
                list_id: z.number(),
                list_title: z.string(),
                board_id: z.number(),
                board_title: z.string(),
                labels: z.array(
                  z.object({
                    id: z.number(),
                    name: z.string(),
                    color: z.string(),
                  })
                ),
                assignees: z.array(
                  z.object({
                    id: z.number(),
                    name: z.string(),
                    avatar_url: z.string().nullable(),
                  })
                ),
              })
            ),
            meta: z.object({
              page: z.number(),
              perPage: z.number(),
              total: z.number(),
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
  },
})

searchRoutes.openapi(searchCardsRoute, async (c) => {
  try {
    const query = c.req.valid('query')
    const userId = c.get('userId')

    const q = query.q
    const assignee = query.assignee ? Number(query.assignee) : undefined
    const label = query.label ? Number(query.label) : undefined
    const due = query.due
    const page = query.page ? Number(query.page) : 1
    const perPage = query.per_page ? Number(query.per_page) : 10

    const { data, total } = await searchService.searchCards(
      userId,
      q,
      { assignee, label, due },
      page,
      perPage
    )

    return c.json(
      {
        data,
        meta: {
          page,
          perPage,
          total,
        },
      },
      200
    )
  } catch (error: any) {
    const message = error.message || 'Search failed'
    return c.json({ error: message }, 400)
  }
})

export { searchRoutes }
