import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { sign } from 'hono/jwt'
import { ErrorSchema, UserSchema } from '../lib/schemas'
import * as oauthService from '../services/oauthService'

const oauthRoutes = new OpenAPIHono()

const googleAuthRoute = createRoute({
  method: 'get',
  path: '/google',
  tags: ['Auth'],
  summary: 'Redirect to Google OAuth',
  description: 'Redirects the client to Google authorization page.',
  responses: {
    302: {
      description: 'Redirect to Google',
    },
  },
})

const googleCallbackRoute = createRoute({
  method: 'get',
  path: '/google/callback',
  tags: ['Auth'],
  summary: 'Google OAuth callback',
  description:
    'Handles the Google OAuth code callback, logs the user in, and returns auth credentials.',
  request: {
    query: z.object({
      code: z.string().openapi({ example: 'auth-code' }),
    }),
  },
  responses: {
    200: {
      description: 'Google Authentication Successful',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              token: z.string(),
              user: UserSchema,
            }),
          }),
        },
      },
    },
    302: {
      description: 'Redirect back to frontend with token/user query parameters',
    },
    500: {
      description: 'Auth failure',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const githubAuthRoute = createRoute({
  method: 'get',
  path: '/github',
  tags: ['Auth'],
  summary: 'Redirect to GitHub OAuth',
  description: 'Redirects the client to GitHub authorization page.',
  responses: {
    302: {
      description: 'Redirect to GitHub',
    },
  },
})

const githubCallbackRoute = createRoute({
  method: 'get',
  path: '/github/callback',
  tags: ['Auth'],
  summary: 'GitHub OAuth callback',
  description:
    'Handles the GitHub OAuth code callback, logs the user in, and returns auth credentials.',
  request: {
    query: z.object({
      code: z.string().openapi({ example: 'auth-code' }),
    }),
  },
  responses: {
    200: {
      description: 'GitHub Authentication Successful',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              token: z.string(),
              user: UserSchema,
            }),
          }),
        },
      },
    },
    302: {
      description: 'Redirect back to frontend with token/user query parameters',
    },
    500: {
      description: 'Auth failure',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const facebookAuthRoute = createRoute({
  method: 'get',
  path: '/facebook',
  tags: ['Auth'],
  summary: 'Redirect to Facebook OAuth',
  description: 'Redirects the client to Facebook authorization page.',
  responses: {
    302: {
      description: 'Redirect to Facebook',
    },
  },
})

const facebookCallbackRoute = createRoute({
  method: 'get',
  path: '/facebook/callback',
  tags: ['Auth'],
  summary: 'Facebook OAuth callback',
  description:
    'Handles the Facebook OAuth code callback, logs the user in, and returns auth credentials.',
  request: {
    query: z.object({
      code: z.string().openapi({ example: 'auth-code' }),
    }),
  },
  responses: {
    200: {
      description: 'Facebook Authentication Successful',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              token: z.string(),
              user: UserSchema,
            }),
          }),
        },
      },
    },
    302: {
      description: 'Redirect back to frontend with token/user query parameters',
    },
    500: {
      description: 'Auth failure',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

// Google Auth redirect
oauthRoutes.openapi(googleAuthRoute, (c) => {
  return c.redirect(oauthService.getGoogleAuthURL())
})

async function handleCallback(
  c: any,
  provider: 'google' | 'github' | 'facebook',
  callbackFn: Function,
) {
  try {
    const code = c.req.query('code')
    if (!code) {
      return c.json({ error: 'OAuth code missing' }, 400)
    }

    const oauthUser = await callbackFn(code)
    const user = await oauthService.findOrCreateUser(oauthUser)

    const secretKey = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    }
    const token = await sign(tokenPayload, secretKey)

    // Check if client requests JSON instead of redirect (like in test mock environment)
    if (c.req.header('Accept')?.includes('application/json')) {
      return c.json(
        {
          data: {
            token,
            user: {
              id: user.id,
              email: user.email,
              avatar_url: user.avatar_url,
            },
          },
        },
        200,
      )
    }

    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(
      JSON.stringify({
        id: user.id,
        email: user.email,
        avatar_url: user.avatar_url,
      }),
    )}`
    return c.redirect(redirectUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
}

oauthRoutes.openapi(googleCallbackRoute, (c) => {
  return handleCallback(c, 'google', oauthService.handleGoogleCallback)
})

// GitHub Auth redirect
oauthRoutes.openapi(githubAuthRoute, (c) => {
  return c.redirect(oauthService.getGitHubAuthURL())
})

oauthRoutes.openapi(githubCallbackRoute, (c) => {
  return handleCallback(c, 'github', oauthService.handleGitHubCallback)
})

// Facebook Auth redirect
oauthRoutes.openapi(facebookAuthRoute, (c) => {
  return c.redirect(oauthService.getFacebookAuthURL())
})

oauthRoutes.openapi(facebookCallbackRoute, (c) => {
  return handleCallback(c, 'facebook', oauthService.handleFacebookCallback)
})

export { oauthRoutes }
