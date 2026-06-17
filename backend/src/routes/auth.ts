import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema, UserSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as authService from '../services/authService'

const authRoutes = new OpenAPIHono()

const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  tags: ['Auth'],
  summary: 'Register new user',
  description: 'Create a new user account with email and password',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email().openapi({ example: 'user@example.com' }),
            password: z.string().min(6).openapi({ example: 'password123' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Successfully registered',
      content: {
        'application/json': {
          schema: z.object({
            data: UserSchema,
          }),
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    409: {
      description: 'Conflict (Email already registered)',
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

const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  summary: 'User Login',
  description: 'Authenticate user with email and password and return a JWT token or require 2FA',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email().openapi({ example: 'user@example.com' }),
            password: z.string().openapi({ example: 'password123' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully authenticated or requires 2FA verification',
      content: {
        'application/json': {
          schema: z.union([
            z.object({
              data: z.object({
                token: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsIn...' }),
                user: UserSchema,
              }),
            }),
            z.object({
              data: z.object({
                requires_2fa: z.boolean().openapi({ example: true }),
                temp_token: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsIn...' }),
              }),
            }),
          ]),
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized (Invalid credentials)',
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

const getMeRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Auth'],
  summary: 'Get Current User',
  description: 'Get profile information of the currently authenticated user',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Profile information retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: UserSchema,
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
    404: {
      description: 'User Not Found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

// Register route definitions with OpenAPIHono handlers
authRoutes.openapi(registerRoute, async (c) => {
  if (process.env.DISABLE_REGISTRATION === 'true') {
    return c.json({ error: 'Registration is currently disabled' }, 403)
  }

  try {
    const body = await c.req.json()
    if (!body.email || !body.password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const user = await authService.register(body.email, body.password)
    return c.json({ data: user }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    if (message === 'Email already registered') {
      return c.json({ error: message }, 409)
    }
    return c.json({ error: message }, 500)
  }
})

authRoutes.openapi(loginRoute, async (c) => {
  try {
    const body = await c.req.json()
    if (!body.email || !body.password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const result = await authService.login(body.email, body.password)
    return c.json({ data: result }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    if (message === 'Invalid email or password') {
      return c.json({ error: message }, 401)
    }
    return c.json({ error: message }, 500)
  }
})

// Attach middleware for getMeRoute handler
authRoutes.use('/me', authMiddleware)
authRoutes.openapi(getMeRoute, async (c) => {
  const userId = c.get('userId')
  const user = await authService.getMe(userId)
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({ data: user }, 200)
})

export { authRoutes }
