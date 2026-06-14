import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { db } from '../db'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'

const userRoutes = new OpenAPIHono()

userRoutes.use('/users/*', authMiddleware)

const updateLocaleRoute = createRoute({
  method: 'put',
  path: '/users/me/locale',
  tags: ['Users'],
  summary: 'Update user locale preference',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            locale: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Locale updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              locale: z.string(),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Invalid locale preference',
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

userRoutes.openapi(updateLocaleRoute, async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { locale } = body

  if (locale !== 'en' && locale !== 'id') {
    return c.json({ error: 'Invalid locale. Supported: en, id' }, 400)
  }

  await db`
    UPDATE users
    SET locale = ${locale}, updated_at = NOW()
    WHERE id = ${userId}
  `

  return c.json({ data: { locale } }, 200)
})

export { userRoutes }
