import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as unsplashService from '../services/unsplashService'

const unsplashRoutes = new OpenAPIHono()

// Apply authentication middleware
unsplashRoutes.use('*', authMiddleware)

// In-memory rate limiting store for Unsplash: limit max 50 requests per user per hour
const rateLimitMap = new Map<number, { count: number; resetTime: number }>()

function checkRateLimit(userId: number): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + 60 * 60 * 1000, // 1 hour window
    })
    return true
  }

  if (userLimit.count >= 50) {
    return false
  }

  userLimit.count += 1
  return true
}

// Routes definitions
const SearchRoute = createRoute({
  method: 'get',
  path: '/search',
  summary: 'Search Unsplash photos',
  request: {
    query: z.object({
      q: z.string().min(1),
      page: z.string().optional(),
      per_page: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Search results returned',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              z.object({
                id: z.string(),
                url_thumb: z.string(),
                url_regular: z.string(),
                photographer: z.string(),
                photographer_url: z.string(),
              })
            ),
          }),
        },
      },
    },
    400: {
      description: 'Missing/invalid parameters',
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
    429: {
      description: 'Rate limit exceeded',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal server error (e.g. Unsplash not configured)',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const RandomRoute = createRoute({
  method: 'get',
  path: '/random',
  summary: 'Get random Unsplash photos',
  request: {
    query: z.object({
      count: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Random photos returned',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              z.object({
                id: z.string(),
                url_thumb: z.string(),
                url_regular: z.string(),
                photographer: z.string(),
                photographer_url: z.string(),
              })
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
    429: {
      description: 'Rate limit exceeded',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

// Handlers
unsplashRoutes.openapi(SearchRoute, async (c) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (!checkRateLimit(userId)) {
    return c.json({ error: 'Rate limit exceeded. Max 50 requests per hour.' }, 429)
  }

  const queryParams = c.req.valid('query')
  const q = queryParams.q
  const page = queryParams.page ? Number(queryParams.page) : 1
  const perPage = queryParams.per_page ? Number(queryParams.per_page) : 20

  try {
    const data = await unsplashService.searchPhotos(q, page, perPage)
    return c.json({ data }, 200)
  } catch (err: any) {
    if (err.message === 'UNSPLASH_NOT_CONFIGURED') {
      return c.json({ error: 'Unsplash API is not configured on this server.' }, 500)
    }
    return c.json({ error: err.message }, 500)
  }
})

unsplashRoutes.openapi(RandomRoute, async (c) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (!checkRateLimit(userId)) {
    return c.json({ error: 'Rate limit exceeded. Max 50 requests per hour.' }, 429)
  }

  const queryParams = c.req.valid('query')
  const count = queryParams.count ? Number(queryParams.count) : 20

  try {
    const data = await unsplashService.getRandomPhotos(count)
    return c.json({ data }, 200)
  } catch (err: any) {
    if (err.message === 'UNSPLASH_NOT_CONFIGURED') {
      return c.json({ error: 'Unsplash API is not configured on this server.' }, 500)
    }
    return c.json({ error: err.message }, 500)
  }
})

export { unsplashRoutes }
